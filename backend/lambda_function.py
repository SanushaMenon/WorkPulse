import hashlib
import json
import os
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import BotoCoreError, ClientError

# ─── Environment ────────────────────────────────────────────────────────────────

TABLE_NAME = os.environ.get("FEEDBACK_TABLE_NAME", "FeedbackSubmissions")
EXPORT_BUCKET = os.environ.get("EXPORT_BUCKET_NAME")
BEDROCK_MODEL_ID = os.environ.get(
    "BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0"
)

DEPT_GSI_NAME = "department-timestamp-index"
EMAIL_HASH_GSI_NAME = "emailHash-timestamp-index"
TARGET_EMAIL_HASH_GSI_NAME = "targetEmailHash-timestamp-index"

MINIMUM_GROUP_SIZE = 5
MAX_ROADMAP_ENTRIES = 10

MAX_NAME_LEN = 100
MAX_EMAIL_LEN = 254
MAX_MESSAGE_LEN = 2000

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

_PII_PATTERNS = [
    re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"),
    re.compile(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
]

GROUP_PRIORITY = ["super-admins", "hr-admins", "managers", "employees"]

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
bedrock = boto3.client("bedrock-runtime")
s3 = boto3.client("s3") if EXPORT_BUCKET else None


# ─── Helpers ────────────────────────────────────────────────────────────────────

def _cors_headers() -> Dict[str, str]:
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
    }


def _resp(status: int, body: Any) -> Dict[str, Any]:
    return {"statusCode": status, "headers": _cors_headers(), "body": json.dumps(body)}


def _get_claims(event: Dict[str, Any]) -> Dict[str, str]:
    return event.get("requestContext", {}).get("authorizer", {}).get("claims", {})


def _get_groups(claims: Dict[str, str]) -> List[str]:
    raw = claims.get("cognito:groups", "")
    if isinstance(raw, list):
        return [g.strip() for g in raw]
    return [g.strip() for g in str(raw).split(",") if g.strip()]


def _highest_group(groups: List[str]) -> Optional[str]:
    for g in GROUP_PRIORITY:
        if g in groups:
            return g
    return None


def hash_email(email: str) -> str:
    return hashlib.sha256(email.lower().strip().encode()).hexdigest()


def strip_pii(text: str) -> str:
    for p in _PII_PATTERNS:
        text = p.sub("[REDACTED]", text)
    return text


def _scan_all() -> List[Dict[str, Any]]:
    resp = table.scan()
    items: List[Dict[str, Any]] = resp.get("Items", [])
    while "LastEvaluatedKey" in resp:
        resp = table.scan(ExclusiveStartKey=resp["LastEvaluatedKey"])
        items.extend(resp.get("Items", []))
    return items


def _query_by_gsi(index_name: str, key_name: str, key_value: str,
                  ascending: bool = True) -> List[Dict[str, Any]]:
    resp = table.query(
        IndexName=index_name,
        KeyConditionExpression=Key(key_name).eq(key_value),
        ScanIndexForward=ascending,
    )
    items: List[Dict[str, Any]] = resp.get("Items", [])
    while "LastEvaluatedKey" in resp:
        resp = table.query(
            IndexName=index_name,
            KeyConditionExpression=Key(key_name).eq(key_value),
            ScanIndexForward=ascending,
            ExclusiveStartKey=resp["LastEvaluatedKey"],
        )
        items.extend(resp.get("Items", []))
    return items


def compute_monthly_trend(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    monthly: Dict[str, Dict[str, Any]] = {}
    for item in items:
        month = (item.get("timestamp") or "")[:7]
        if len(month) != 7:
            continue
        if month not in monthly:
            monthly[month] = {"month": month, "positive": 0, "negative": 0, "neutral": 0, "total": 0}
        s = (item.get("sentiment") or "neutral").lower()
        if s in monthly[month]:
            monthly[month][s] += 1
        monthly[month]["total"] += 1
    return sorted(monthly.values(), key=lambda x: x["month"])


def compute_dept_scores(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    dept: Dict[str, Dict[str, Any]] = {}
    for item in items:
        d = item.get("department") or "unknown"
        if d not in dept:
            dept[d] = {"positive": 0, "negative": 0, "neutral": 0, "total": 0}
        s = (item.get("sentiment") or "neutral").lower()
        if s in dept[d]:
            dept[d][s] += 1
        dept[d]["total"] += 1
    result: Dict[str, Any] = {}
    for d, counts in dept.items():
        t = counts["total"]
        result[d] = {**counts, "score": round((counts["positive"] / t) * 100) if t > 0 else 0}
    return result


# ─── Router ─────────────────────────────────────────────────────────────────────

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get("httpMethod", "")
    path = event.get("path", "")

    if method == "OPTIONS":
        return _resp(200, {})

    try:
        if path.endswith("/feedback") and method == "POST":
            return handle_post_feedback(event)
        if path.endswith("/insights") and method == "GET":
            return handle_get_insights(event)
        if path.endswith("/my-roadmap") and method == "GET":
            return handle_get_roadmap(event)
        if path.endswith("/my-reviews") and method == "GET":
            return handle_get_my_reviews(event)
        return _resp(404, {"message": "Not Found"})
    except Exception as exc:  # pylint: disable=broad-except
        print(f"Unhandled error: {exc}")
        return _resp(500, {"message": "Internal server error"})


# ─── POST /feedback ──────────────────────────────────────────────────────────────

def handle_post_feedback(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Self-feedback: submitter's name/email from JWT. message from body.
    Peer review: additionally accepts targetName + targetEmail from body.
                 The target's email is hashed for the GSI; submitter stays anonymous.
    """
    claims = _get_claims(event)
    name = (claims.get("name") or "").strip()
    email = (claims.get("email") or "").strip()
    department = (claims.get("custom:department") or "unknown").strip()

    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _resp(400, {"message": "Invalid JSON body"})

    message = (body.get("message") or "").strip()

    # Fallback for local dev
    if not name:
        name = (body.get("name") or "").strip()
    if not email:
        email = (body.get("email") or "").strip()

    # ── Peer review optional fields ──
    target_name = (body.get("targetName") or "").strip()
    target_email = (body.get("targetEmail") or "").strip()
    is_peer_review = bool(target_name and target_email)

    # ── Validation ──
    if not name or not email or not message:
        return _resp(400, {"message": "name, email, and message are required"})
    if len(name) > MAX_NAME_LEN:
        return _resp(400, {"message": f"name must be ≤ {MAX_NAME_LEN} characters"})
    if not EMAIL_RE.match(email) or len(email) > MAX_EMAIL_LEN:
        return _resp(400, {"message": "Invalid submitter email"})
    if len(message) > MAX_MESSAGE_LEN:
        return _resp(400, {"message": f"message must be ≤ {MAX_MESSAGE_LEN} characters"})

    if is_peer_review:
        if len(target_name) > MAX_NAME_LEN:
            return _resp(400, {"message": f"targetName must be ≤ {MAX_NAME_LEN} characters"})
        if not EMAIL_RE.match(target_email) or len(target_email) > MAX_EMAIL_LEN:
            return _resp(400, {"message": "Invalid target email address"})
        if target_email.lower() == email.lower():
            return _resp(400, {"message": "You cannot submit a peer review about yourself"})

    # ── Anonymise ──
    email_hash = hash_email(email)
    clean_message = strip_pii(message)
    target_email_hash = hash_email(target_email) if is_peer_review else None

    feedback_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()

    item: Dict[str, Any] = {
        "feedbackId": feedback_id,
        "name": name,
        "emailHash": email_hash,
        "message": clean_message,
        "department": department,
        "isPeerReview": is_peer_review,
        "sentiment": None,
        "topics": [],
        "summary": None,
        "timestamp": timestamp,
    }

    if is_peer_review:
        item["targetName"] = target_name
        item["targetEmailHash"] = target_email_hash  # drives the GSI

    try:
        table.put_item(Item=item)
    except (BotoCoreError, ClientError) as exc:
        print(f"DynamoDB put_item failed: {exc}")
        return _resp(500, {"message": "Failed to store feedback"})

    # Bedrock analysis — best-effort
    try:
        ai = call_bedrock_analysis(clean_message)
        table.update_item(
            Key={"feedbackId": feedback_id},
            UpdateExpression="SET sentiment = :s, topics = :t, summary = :m",
            ExpressionAttributeValues={
                ":s": ai.get("sentiment"),
                ":t": ai.get("topics") or [],
                ":m": ai.get("summary"),
            },
        )
        if s3 and EXPORT_BUCKET:
            key = f"exports/{timestamp[:7]}/{feedback_id}.json"
            s3.put_object(
                Bucket=EXPORT_BUCKET,
                Key=key,
                Body=json.dumps({**item, **ai}),
                ContentType="application/json",
            )
    except Exception as exc:  # pylint: disable=broad-except
        print(f"Bedrock analysis failed (non-fatal): {exc}")

    return _resp(201, {"feedbackId": feedback_id, "isPeerReview": is_peer_review})


# ─── GET /insights ───────────────────────────────────────────────────────────────

def handle_get_insights(event: Dict[str, Any]) -> Dict[str, Any]:
    claims = _get_claims(event)
    groups = _get_groups(claims)
    role = _highest_group(groups)
    department = (claims.get("custom:department") or "").strip()

    if role is None or role == "employees":
        return _resp(403, {"message": "Forbidden: insufficient permissions"})

    try:
        if role == "managers" and department:
            items = _query_by_gsi(DEPT_GSI_NAME, "department", department)
        else:
            items = _scan_all()

        # Filter out peer reviews from insights (they're personal, not org sentiment)
        items = [i for i in items if not i.get("isPeerReview")]

        if role == "managers" and len(items) < MINIMUM_GROUP_SIZE:
            return _resp(200, {
                "minimumThresholdMet": False,
                "minimumGroupSize": MINIMUM_GROUP_SIZE,
                "totalSubmissions": len(items),
                "role": role,
                "scopedToDepartment": department,
            })

        total = len(items)
        sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
        summaries: List[Dict[str, str]] = []
        topics: List[str] = []

        for item in items:
            s = (item.get("sentiment") or "neutral").lower()
            if s in sentiment_counts:
                sentiment_counts[s] += 1
            if item.get("summary"):
                summaries.append({
                    "summary": item["summary"],
                    "department": item.get("department", "unknown"),
                })
            if isinstance(item.get("topics"), list):
                topics.extend(str(t) for t in item["topics"])

        monthly_trend = compute_monthly_trend(items)
        dept_scores = (
            compute_dept_scores(items) if role in ("hr-admins", "super-admins") else None
        )

        return _resp(200, {
            "minimumThresholdMet": True,
            "minimumGroupSize": MINIMUM_GROUP_SIZE,
            "totalSubmissions": total,
            "sentimentCounts": sentiment_counts,
            "summaries": summaries,
            "topics": topics,
            "role": role,
            "scopedToDepartment": department if role == "managers" else None,
            "monthlyTrend": monthly_trend,
            "departmentScores": dept_scores,
        })

    except (BotoCoreError, ClientError) as exc:
        print(f"Insights query failed: {exc}")
        return _resp(500, {"message": "Failed to load insights"})


# ─── GET /my-reviews ─────────────────────────────────────────────────────────────

def handle_get_my_reviews(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Returns peer-review feedback that others have submitted ABOUT the current user.
    Submitter identity is never exposed — fully anonymous to the recipient.
    """
    claims = _get_claims(event)
    email = (claims.get("email") or "").strip()

    if not email:
        return _resp(400, {"message": "Could not identify user from token"})

    email_hash = hash_email(email)

    try:
        # Query the targetEmailHash GSI — only peer review items have this field
        items = _query_by_gsi(
            TARGET_EMAIL_HASH_GSI_NAME, "targetEmailHash", email_hash, ascending=False
        )

        reviews = []
        for item in items:
            reviews.append({
                "feedbackId": item.get("feedbackId"),
                "timestamp": item.get("timestamp"),
                "sentiment": item.get("sentiment"),
                "summary": item.get("summary"),
                "topics": item.get("topics") or [],
                # Deliberately omit: name, emailHash, targetName, targetEmailHash
                # Submitter is completely anonymous to recipient
            })

        return _resp(200, {
            "reviews": reviews,
            "totalReviews": len(reviews),
        })

    except (BotoCoreError, ClientError) as exc:
        print(f"My-reviews query failed: {exc}")
        return _resp(500, {"message": "Failed to load reviews"})


# ─── GET /my-roadmap ─────────────────────────────────────────────────────────────

def handle_get_roadmap(event: Dict[str, Any]) -> Dict[str, Any]:
    claims = _get_claims(event)
    email = (claims.get("email") or "").strip()
    name = (claims.get("name") or "Employee").strip()

    if not email:
        return _resp(400, {"message": "Could not identify user from token"})

    email_hash = hash_email(email)

    try:
        # Only use self-feedback (not peer reviews) for personal roadmap
        all_items = _query_by_gsi(EMAIL_HASH_GSI_NAME, "emailHash", email_hash)
        items = [i for i in all_items if not i.get("isPeerReview")]
        recent = items[-MAX_ROADMAP_ENTRIES:]

        if len(recent) < 2:
            return _resp(200, {
                "hasEnoughData": False,
                "totalSubmissions": len(items),
                "message": (
                    "Submit at least 2 pieces of feedback to unlock your "
                    "personalised growth roadmap."
                ),
            })

        roadmap = call_bedrock_roadmap(name, recent)
        return _resp(200, {
            "hasEnoughData": True,
            "totalSubmissions": len(items),
            "analyzedSubmissions": len(recent),
            **roadmap,
        })

    except (BotoCoreError, ClientError) as exc:
        print(f"Roadmap query failed: {exc}")
        return _resp(500, {"message": "Failed to load roadmap"})


# ─── Bedrock: sentiment analysis ─────────────────────────────────────────────────

def call_bedrock_analysis(message: str) -> Dict[str, Any]:
    prompt = f"""You are an HR analytics assistant. Analyze the following employee feedback.

Return a JSON object with exactly these fields:
- sentiment: one of "positive", "negative", or "neutral"
- topics: an array of short topic strings (1-4 words each)
- summary: a single sentence summarizing the feedback

Respond with JSON only, no additional text.

Feedback:
\"\"\"{message}\"\"\"
""".strip()
    return _call_bedrock_json(prompt, max_tokens=256, temperature=0)


# ─── Bedrock: growth roadmap ──────────────────────────────────────────────────────

def call_bedrock_roadmap(name: str, entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    lines = []
    for i, e in enumerate(entries, 1):
        ts = (e.get("timestamp") or "")[:10]
        s = e.get("sentiment") or "unknown"
        t = ", ".join(e.get("topics") or []) or "none"
        m = e.get("message", "")
        lines.append(f'{i}. [{ts}] Sentiment: {s} | Topics: {t}\n   Feedback: "{m}"')

    prompt = f"""You are a compassionate HR growth coach helping an employee named {name} improve professionally.

Feedback history (oldest to newest):
{chr(10).join(lines)}

Generate a personalized growth roadmap as a JSON object with exactly these fields:
- currentState: {{dominantSentiment, trend ("improving"|"declining"|"stable"), recurringTopics (array), summary (one sentence)}}
- focusAreas: array of 2-3 objects each with {{area, reason, action}}
- plan: {{thirtyDays, sixtyDays, ninetyDays}} (one sentence each)
- encouragement: one warm uplifting sentence

Respond with JSON only. Be specific, practical, and kind.
""".strip()
    return _call_bedrock_json(prompt, max_tokens=1024, temperature=0.3)


# ─── Bedrock shared caller ────────────────────────────────────────────────────────

def _call_bedrock_json(prompt: str, max_tokens: int, temperature: float) -> Dict[str, Any]:
    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}],
    }
    response = bedrock.invoke_model(
        modelId=BEDROCK_MODEL_ID,
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )
    response_body = json.loads(response["body"].read())
    text = "".join(
        c.get("text", "")
        for c in response_body.get("content", [])
        if c.get("type") == "text"
    ).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end > start:
            return json.loads(text[start : end + 1])
        raise
