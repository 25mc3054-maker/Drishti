import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand 
} from "@aws-sdk/client-cognito-identity-provider";

const hasStaticCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_COGNITO_REGION || process.env.AWS_REGION || "us-east-1",
  ...(hasStaticCredentials
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
        },
      }
    : {}),
});

export async function createShopkeeperAccount() {
  const tempPassword = `Shop@${Math.random().toString(36).slice(-8)}!`;
  // Generate a unique email/username for the hackathon demo
  const uniqueId = Math.random().toString(36).substring(7);
  const username = `shopkeeper_${uniqueId}@drishti.demo`;

  // Safety check: if env var is missing, return mock data so the app doesn't crash during demo
  if (!process.env.AWS_COGNITO_USER_POOL_ID) {
    console.warn("AWS_COGNITO_USER_POOL_ID is not set. Returning mock credentials.");
    return {
      success: true,
      username: username,
      password: tempPassword
    };
  }

  const command = new AdminCreateUserCommand({
    UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
    Username: username,
    TemporaryPassword: tempPassword,
    UserAttributes: [
      { Name: "email", Value: username },
      { Name: "email_verified", Value: "true" }
    ],
    MessageAction: "SUPPRESS" // Don't send an email, we will display creds on screen
  });

  try {
    await cognitoClient.send(command);
    return {
      success: true,
      username: username,
      password: tempPassword
    };
  } catch (error) {
    console.error("Cognito Create User Error:", error);
    // Fallback for demo if Cognito fails (e.g. permissions issue)
    return {
      success: false,
      username: "demo_user",
      password: "demo_password_123"
    };
  }
}