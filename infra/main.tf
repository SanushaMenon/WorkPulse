terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.4"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

########################
## COGNITO USER POOL
########################

resource "aws_cognito_user_pool" "app_pool" {
  name = "${var.project_name}-user-pool"

  password_policy {
    minimum_length    = 12
    require_uppercase = true
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
  }

  # HR app — only admins create user accounts
  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  # Custom attribute: department (set at user creation)
  schema {
    name                     = "department"
    attribute_data_type      = "String"
    mutable                  = true
    required                 = false
    string_attribute_constraints {
      min_length = 0
      max_length = 100
    }
  }

  tags = {
    Project = var.project_name
  }
}

resource "aws_cognito_user_pool_client" "app_client" {
  name         = "${var.project_name}-client"
  user_pool_id = aws_cognito_user_pool.app_pool.id

  generate_secret = false # SPA — no client secret

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30

  prevent_user_existence_errors = "ENABLED"
}

resource "aws_cognito_user_group" "employees" {
  name         = "employees"
  user_pool_id = aws_cognito_user_pool.app_pool.id
  description  = "Regular employees — can submit feedback only"
}

resource "aws_cognito_user_group" "managers" {
  name         = "managers"
  user_pool_id = aws_cognito_user_pool.app_pool.id
  description  = "Team managers — can view team-scoped insights"
}

resource "aws_cognito_user_group" "hr_admins" {
  name         = "hr-admins"
  user_pool_id = aws_cognito_user_pool.app_pool.id
  description  = "HR administrators — can view all insights and export"
}

resource "aws_cognito_user_group" "super_admins" {
  name         = "super-admins"
  user_pool_id = aws_cognito_user_pool.app_pool.id
  description  = "Super administrators — full access"
}

########################
## IAM ROLE FOR LAMBDA
########################

resource "aws_iam_role" "lambda_role" {
  name               = "${var.project_name}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "lambda_policy" {
  statement {
    sid    = "DynamoDBAccess"
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:Scan",
      "dynamodb:Query",
      "dynamodb:DescribeTable"
    ]
    resources = [
      aws_dynamodb_table.feedback_table.arn,
      "${aws_dynamodb_table.feedback_table.arn}/index/*"
    ]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["arn:aws:logs:*:*:*"]
  }

  # Scoped to the specific Bedrock model — not wildcard "*"
  statement {
    sid    = "BedrockInvoke"
    effect = "Allow"
    actions = [
      "bedrock:InvokeModel"
    ]
    resources = ["arn:aws:bedrock:${var.aws_region}::foundation-model/${var.bedrock_model_id}"]
  }

  statement {
    sid    = "S3Export"
    effect = "Allow"
    actions = [
      "s3:PutObject"
    ]
    resources = ["${aws_s3_bucket.export_bucket.arn}/*"]
  }
}

resource "aws_iam_policy" "lambda_policy" {
  name   = "${var.project_name}-lambda-policy"
  policy = data.aws_iam_policy_document.lambda_policy.json
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}

########################
## DYNAMODB TABLE
########################

resource "aws_dynamodb_table" "feedback_table" {
  name         = var.feedback_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "feedbackId"

  attribute {
    name = "feedbackId"
    type = "S"
  }

  attribute {
    name = "department"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "emailHash"
    type = "S"
  }

  attribute {
    name = "targetEmailHash"
    type = "S"
  }

  # GSI: managers query by department without full table scan
  global_secondary_index {
    name            = "department-timestamp-index"
    hash_key        = "department"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  # GSI: employees query their own submissions for growth roadmap
  global_secondary_index {
    name            = "emailHash-timestamp-index"
    hash_key        = "emailHash"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  # GSI: employees query peer feedback submitted ABOUT them
  global_secondary_index {
    name            = "targetEmailHash-timestamp-index"
    hash_key        = "targetEmailHash"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  tags = {
    Project = var.project_name
  }
}

########################
## S3 BUCKET FOR EXPORTS
########################

resource "aws_s3_bucket" "export_bucket" {
  bucket = var.export_bucket_name

  tags = {
    Project = var.project_name
  }
}

resource "aws_s3_bucket_public_access_block" "export_bucket" {
  bucket = aws_s3_bucket.export_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

########################
## LAMBDA FUNCTION
########################

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend"
  output_path = "${path.module}/lambda_build/lambda.zip"
}

resource "aws_lambda_function" "feedback_api" {
  function_name = "${var.project_name}-lambda"
  role          = aws_iam_role.lambda_role.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.12"

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  timeout = 30  # Bedrock can take up to 20–25 s; 30 s gives headroom

  environment {
    variables = {
      FEEDBACK_TABLE_NAME = aws_dynamodb_table.feedback_table.name
      EXPORT_BUCKET_NAME  = aws_s3_bucket.export_bucket.bucket
      BEDROCK_MODEL_ID    = var.bedrock_model_id
    }
  }

  tags = {
    Project = var.project_name
  }
}

########################
## API GATEWAY REST API
########################

resource "aws_api_gateway_rest_api" "api" {
  name        = "${var.project_name}-api"
  description = "Smart Talent Insight Hub REST API"
}

# Cognito JWT authorizer — validates Bearer tokens on protected routes
resource "aws_api_gateway_authorizer" "cognito" {
  name                   = "${var.project_name}-cognito-authorizer"
  rest_api_id            = aws_api_gateway_rest_api.api.id
  type                   = "COGNITO_USER_POOLS"
  provider_arns          = [aws_cognito_user_pool.app_pool.arn]
  # Tell API GW where to find the JWT — required, missing this causes 500 on protected routes
  identity_source        = "method.request.header.Authorization"
}

resource "aws_api_gateway_resource" "feedback_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "feedback"
}

resource "aws_api_gateway_resource" "insights_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "insights"
}

# --- /feedback ---

resource "aws_api_gateway_method" "feedback_post" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.feedback_resource.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

# OPTIONS must stay NONE — CORS preflights are unauthenticated
# Route to Lambda so it can return proper CORS headers (not MOCK)
resource "aws_api_gateway_method" "feedback_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.feedback_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# --- /insights ---

resource "aws_api_gateway_method" "insights_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.insights_resource.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_method" "insights_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.insights_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# --- Integrations (all AWS_PROXY to Lambda) ---

resource "aws_api_gateway_integration" "feedback_post_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.feedback_resource.id
  http_method             = aws_api_gateway_method.feedback_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.feedback_api.invoke_arn
}

resource "aws_api_gateway_integration" "feedback_options_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.feedback_resource.id
  http_method             = aws_api_gateway_method.feedback_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.feedback_api.invoke_arn
}

resource "aws_api_gateway_integration" "insights_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.insights_resource.id
  http_method             = aws_api_gateway_method.insights_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.feedback_api.invoke_arn
}

resource "aws_api_gateway_integration" "insights_options_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.insights_resource.id
  http_method             = aws_api_gateway_method.insights_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.feedback_api.invoke_arn
}

# --- /my-roadmap ---

resource "aws_api_gateway_resource" "roadmap_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "my-roadmap"
}

resource "aws_api_gateway_method" "roadmap_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.roadmap_resource.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_method" "roadmap_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.roadmap_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "roadmap_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.roadmap_resource.id
  http_method             = aws_api_gateway_method.roadmap_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.feedback_api.invoke_arn
}

resource "aws_api_gateway_integration" "roadmap_options_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.roadmap_resource.id
  http_method             = aws_api_gateway_method.roadmap_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.feedback_api.invoke_arn
}

# --- /my-reviews ---

resource "aws_api_gateway_resource" "reviews_resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "my-reviews"
}

resource "aws_api_gateway_method" "reviews_get" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.reviews_resource.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_method" "reviews_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.reviews_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "reviews_get_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.reviews_resource.id
  http_method             = aws_api_gateway_method.reviews_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.feedback_api.invoke_arn
}

resource "aws_api_gateway_integration" "reviews_options_integration" {
  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = aws_api_gateway_resource.reviews_resource.id
  http_method             = aws_api_gateway_method.reviews_options.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.feedback_api.invoke_arn
}

resource "aws_lambda_permission" "apigw_lambda" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.feedback_api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "deployment" {
  # triggers forces Terraform to create a new deployment whenever any
  # integration or method config changes (without this, route additions are never deployed)
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.feedback_resource.id,
      aws_api_gateway_resource.insights_resource.id,
      aws_api_gateway_resource.roadmap_resource.id,
      aws_api_gateway_resource.reviews_resource.id,
      aws_api_gateway_method.feedback_post.id,
      aws_api_gateway_method.feedback_options.id,
      aws_api_gateway_method.insights_get.id,
      aws_api_gateway_method.insights_options.id,
      aws_api_gateway_method.roadmap_get.id,
      aws_api_gateway_method.roadmap_options.id,
      aws_api_gateway_method.reviews_get.id,
      aws_api_gateway_method.reviews_options.id,
      aws_api_gateway_integration.feedback_post_integration.id,
      aws_api_gateway_integration.feedback_options_integration.id,
      aws_api_gateway_integration.insights_get_integration.id,
      aws_api_gateway_integration.insights_options_integration.id,
      aws_api_gateway_integration.roadmap_get_integration.id,
      aws_api_gateway_integration.roadmap_options_integration.id,
      aws_api_gateway_integration.reviews_get_integration.id,
      aws_api_gateway_integration.reviews_options_integration.id,
    ]))
  }

  depends_on = [
    aws_api_gateway_integration.feedback_post_integration,
    aws_api_gateway_integration.insights_get_integration,
    aws_api_gateway_integration.feedback_options_integration,
    aws_api_gateway_integration.insights_options_integration,
    aws_api_gateway_integration.roadmap_get_integration,
    aws_api_gateway_integration.roadmap_options_integration,
    aws_api_gateway_integration.reviews_get_integration,
    aws_api_gateway_integration.reviews_options_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.api.id

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "stage" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  deployment_id = aws_api_gateway_deployment.deployment.id
  stage_name    = var.api_stage_name
}

########################
## CLOUDWATCH ALARM
########################

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 1

  dimensions = {
    FunctionName = aws_lambda_function.feedback_api.function_name
  }

  alarm_description  = "Alarm if lambda function errors > 1 in 5 minutes"
  treat_missing_data = "notBreaching"
}

########################
## OUTPUTS
########################

output "api_base_url" {
  description = "Base URL for the API Gateway stage — use as VITE_API_BASE_URL"
  value       = aws_api_gateway_stage.stage.invoke_url
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID — use as VITE_COGNITO_USER_POOL_ID"
  value       = aws_cognito_user_pool.app_pool.id
}

output "cognito_client_id" {
  description = "Cognito App Client ID — use as VITE_COGNITO_CLIENT_ID"
  value       = aws_cognito_user_pool_client.app_client.id
}

output "aws_region" {
  description = "AWS region — use as VITE_AWS_REGION"
  value       = var.aws_region
}
