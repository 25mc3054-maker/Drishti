# Drishti AWS Hackathon Setup (End-to-End)

This guide matches your architecture:
- Frontend hosting: AWS Amplify Hosting
- Image upload/storage: Amazon S3
- Image understanding: Amazon Rekognition + Textract
- AI suggestions: Amazon Bedrock
- Orchestration: Step Functions
- Logic/API: Lambda + API Gateway (optional if using Next.js API routes in Amplify SSR)
- Database: DynamoDB
- Authentication: Cognito
- Notifications: SES
- Security/ops: Secrets Manager, CloudWatch, CloudTrail, WAF

---

## 1) Important first: do NOT “buy” services manually

AWS services here are pay-as-you-go. You only need to:
1. Create/configure each service
2. Enable billing alerts
3. Stay within your $300 credits and free-tier where possible

### Budget guardrails (must do)
1. Go to `Billing & Cost Management` → `Budgets` → `Create budget`
2. Create monthly cost budget (example: `$50`)
3. Add alerts at `50%`, `80%`, `100%`
4. Enable `Cost Explorer`

---

## 2) Exact credentials/values you must provide in `.env.local`

Fill these keys:

```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-north-1
AWS_BEDROCK_REGION=us-east-1
BEDROCK_MODEL_ID_PRIMARY=anthropic.claude-3-5-sonnet-20240620-v1:0
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
BEDROCK_MARKETING_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
AWS_S3_BUCKET=drishti-assets
AWS_DYNAMODB_TABLE_ANALYSIS=Drishti_Analysis
AWS_COGNITO_REGION=eu-north-1
AWS_COGNITO_USER_POOL_ID=
AWS_COGNITO_CLIENT_ID=
AWS_SES_SENDER_EMAIL=
AWS_SFN_ARN=
AWS_SECRET_NAME=Drishti/AppSecret
```

### Where each value comes from
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`:
  - IAM → Users → your user → Security credentials → Create access key
- `AWS_REGION`:
  - your primary app region (you use `eu-north-1`)
- `AWS_BEDROCK_REGION`:
  - keep `us-east-1` for Claude availability
- `BEDROCK_*MODEL_ID`:
  - Bedrock → Model access → enabled model ID
- `AWS_S3_BUCKET`:
  - S3 bucket name you create
- `AWS_DYNAMODB_TABLE_ANALYSIS`:
  - DynamoDB table name you create
- `AWS_COGNITO_USER_POOL_ID`, `AWS_COGNITO_CLIENT_ID`:
  - Cognito → User pools → your pool/app client details
- `AWS_SES_SENDER_EMAIL`:
  - SES verified identity email address
- `AWS_SFN_ARN`:
  - Step Functions → State machine ARN
- `AWS_SECRET_NAME`:
  - Secrets Manager secret name

---

## 3) Service-by-service setup (console path + minimal config)

## A) IAM (for local development)
1. IAM → Users → `drishti-dev` → Create access key
2. Attach least-privilege policy allowing:
   - `s3:PutObject`, `s3:GetObject`, `s3:ListBucket`
   - `rekognition:DetectLabels`, `rekognition:DetectText`
   - `textract:DetectDocumentText`
   - `bedrock:InvokeModel`
   - `dynamodb:PutItem`, `GetItem`, `UpdateItem`, `Query`, `Scan`
   - `cognito-idp:AdminCreateUser`
   - `ses:SendEmail`
   - `states:StartExecution`
   - `secretsmanager:GetSecretValue`
   - `logs:CreateLogGroup`, `CreateLogStream`, `PutLogEvents`

## B) S3
1. S3 → Create bucket `drishti-assets` (globally unique)
2. Keep Block Public Access ON
3. Add CORS for browser uploads if needed:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

## C) Rekognition + Textract
- No resource creation needed.
- Ensure region supports API and IAM user has permissions.

## D) Bedrock
1. Bedrock console in `us-east-1`
2. Model access → Request/enable Anthropic Claude model access
3. Use model id in env (`anthropic.claude-3-5-sonnet-20240620-v1:0`)

## E) DynamoDB
1. Create table `Drishti_Analysis`
2. Partition key: `id` (String)
3. Billing mode: On-demand (recommended for hackathon)
4. PITR optional but useful for safety

## F) Cognito
1. Cognito → Create user pool
2. Sign-in options: Email
3. Create app client (no secret for browser flows)
4. Save:
   - User Pool ID → `AWS_COGNITO_USER_POOL_ID`
   - App Client ID → `AWS_COGNITO_CLIENT_ID`

## G) SES
1. SES in your sending region (prefer `eu-north-1` if supported in account)
2. Verify sender email/domain
3. If account is in sandbox, verify recipient too
4. Use verified sender in `AWS_SES_SENDER_EMAIL`

## H) Step Functions
1. Create state machine (Standard)
2. First version can be minimal pass-through
3. Save ARN to `AWS_SFN_ARN`

## I) Secrets Manager
1. Create secret named `Drishti/AppSecret`
2. Store JSON like:
```json
{
  "appSecret": "replace-with-random-value"
}
```

## J) CloudWatch / CloudTrail / WAF
- CloudWatch: enabled by default for logs
- CloudTrail: create trail for governance
- WAF: attach to CloudFront/Amplify distribution for production hardening

---

## 4) Amplify Hosting (your missing piece)

1. Amplify → New app → Host web app
2. Connect your Git repository
3. Build settings for Next.js:
   - Amplify auto-detects Next.js; keep generated build settings
4. Add environment variables from `.env.local` (except local-only secrets if using IAM role)
5. Deploy

### Recommended Amplify security mode
- Prefer Amplify service role / execution role instead of hardcoded access keys in production.
- Keep `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` only for local development.

---

## 5) What is already implemented in this codebase

The analyzer route already orchestrates:
- S3 upload
- Rekognition + Textract analysis
- Bedrock inference
- Cognito user creation
- SES email send
- Step Functions trigger
- DynamoDB write
- Secrets Manager check

You mainly need valid AWS resources + correct env values.

---

## 6) Final go-live checklist

1. Fill `.env.local` with real values
2. Run locally: `npm run dev`
3. Upload a shop image and verify:
   - S3 object exists
   - DynamoDB record inserted
   - Cognito user created
   - SES email sent
   - Step Function execution started
4. Deploy on Amplify
5. Re-test with Amplify env vars
6. Rotate local IAM access keys if exposed/shared

---

## 7) Cost control tips for winning hackathon

- Use DynamoDB on-demand
- Limit Rekognition/Textract calls to only uploaded images
- Keep Bedrock token limits tight (`max_tokens`)
- Set CloudWatch log retention to 7–14 days
- Delete unused test resources after demo
