import { Amplify } from "aws-amplify";

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID as string;
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string;
const region = import.meta.env.VITE_AWS_REGION as string;

if (!userPoolId || !userPoolClientId || !region) {
  console.error(
    "[amplify-config] Missing environment variables. " +
    "Copy frontend/.env.example → frontend/.env and fill in the values from `terraform output`."
  );
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: userPoolId ?? "",
      userPoolClientId: userPoolClientId ?? "",
      // Region must be set — without it, Cognito calls silently target the wrong region
      loginWith: {
        email: true,
      },
    },
  },
});
