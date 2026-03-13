# Deployment Guide

This guide covers deploying your application to AWS Amplify Hosting.

## Prerequisites

- GitHub/GitLab/Bitbucket account
- AWS Account
- Your code pushed to a git repository
- Completed local development setup

## Deployment Options

### Option 1: AWS Amplify Console (Recommended)

The easiest way to deploy with automatic CI/CD.

#### Step 1: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### Step 2: Open Amplify Console

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Click **"New app"** → **"Host web app"**
3. Select your git provider (GitHub, GitLab, Bitbucket, etc.)
4. Authorize AWS Amplify to access your repositories

#### Step 3: Select Repository

1. Choose your repository from the list
2. Select the branch to deploy (usually `main`)
3. Click **"Next"**

#### Step 4: Configure Build Settings

Amplify auto-detects your settings. The default `amplify.yml` should work:

```yaml
version: 1
backend:
  phases:
    build:
      commands:
        - npm ci --cache .npm --prefer-offline
        - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
frontend:
  phases:
    preBuild:
      commands:
        - npm ci --cache .npm --prefer-offline
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - "**/*"
  cache:
    paths:
      - .next/cache/**/*
      - .npm/**/*
```

**Review and click "Next"**

#### Step 5: Review and Deploy

1. Review your settings
2. Click **"Save and deploy"**
3. Wait for the build to complete (5-10 minutes on first deploy)

#### Step 6: View Your Live App

Once deployed, you'll get a URL like:

```
https://main.d1a2b3c4d5e6f7.amplifyapp.com
```

Your app is now live!

---

### Option 2: Amplify CLI Deployment

For manual deployments without CI/CD.

#### Step 1: Install Amplify CLI

```bash
npm install -g @aws-amplify/cli
```

#### Step 2: Initialize Amplify

```bash
npx ampx sandbox delete  # Stop local sandbox first
npx ampx deploy --branch main
```

This creates production resources in AWS.

#### Step 3: Deploy Frontend

Build and deploy:

```bash
npm run build
```

Then use AWS Amplify Console to host the built files, or deploy to your preferred hosting platform (Vercel, Netlify, etc.) and point to your Amplify backend.

---

## Environment Configuration

### Adding Environment Variables

#### In Amplify Console:

1. Go to your app in Amplify Console
2. Click **"Environment variables"** in the sidebar
3. Click **"Manage variables"**
4. Add your variables:

```
NEXT_PUBLIC_APP_NAME=My Production App
NEXT_PUBLIC_API_URL=https://api.example.com
```

5. Redeploy your app

#### In Code:

Access in your app:

```typescript
const appName = process.env.NEXT_PUBLIC_APP_NAME;
```

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## Custom Domain Setup

### Step 1: Add Custom Domain

1. In Amplify Console, click **"Domain management"**
2. Click **"Add domain"**
3. Enter your domain name (e.g., `myapp.com`)
4. Click **"Configure domain"**

### Step 2: Configure DNS

Amplify provides DNS records to add to your domain registrar:

```
Type: CNAME
Name: www
Value: d1a2b3c4d5e6f7.cloudfront.net
```

### Step 3: SSL Certificate

Amplify automatically provisions an SSL certificate via AWS Certificate Manager. This takes 5-30 minutes.

### Step 4: Verify

Once the certificate is issued, your app will be live at:

```
https://myapp.com
https://www.myapp.com
```

---

## Branch Deployments

Deploy multiple branches for staging/production environments.

### Step 1: Connect Branch

1. In Amplify Console, click **"Branch deployments"**
2. Click **"Connect branch"**
3. Select branch (e.g., `develop`)
4. Click **"Save and deploy"**

### Step 2: Access Branch URL

Each branch gets its own URL:

```
https://main.d1a2b3c4d5e6f7.amplifyapp.com      (production)
https://develop.d1a2b3c4d5e6f7.amplifyapp.com   (staging)
```

### Step 3: Configure Branch Settings

You can set different environment variables per branch:

1. Click on the branch
2. Click **"Environment variables"**
3. Override production variables as needed

---

## CI/CD Pipeline

Every push to connected branches triggers:

1. **Backend Deploy** - Updates Amplify backend (API, auth, database)
2. **Frontend Build** - Runs `npm run build`
3. **Deploy** - Publishes to CloudFront CDN
4. **Verification** - Runs tests (if configured)

### View Build Logs

1. Go to Amplify Console
2. Click on your app
3. Click on a deployment
4. View logs for each phase

### Build Notifications

Set up notifications for build success/failure:

1. Click **"Notifications"**
2. Add email or Slack webhook
3. Choose events (build start, success, failure)

---

## Performance Optimization

### Enable Caching

Amplify automatically caches:

- Static assets (images, CSS, JS)
- API responses (via CloudFront)
- Next.js build cache

### Configure Cache Headers

In `next.config.ts`:

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};
```

### Enable Compression

Already enabled by default in Amplify (Gzip and Brotli).

---

## Monitoring and Logging

### CloudWatch Logs

View application logs:

1. Go to [CloudWatch Console](https://console.aws.amazon.com/cloudwatch)
2. Click **"Logs"** → **"Log groups"**
3. Find your app's log group: `/aws/amplify/[app-id]`

### Amplify Monitoring

In Amplify Console:

1. Click **"Monitoring"**
2. View metrics:
   - Request count
   - Error rate
   - Response time
   - Data transfer

---

## Database Migrations

### Schema Changes in Production

When you modify `/amplify/data/resource.ts`:

1. **Commit and push** your changes
2. Amplify **automatically migrates** your database
3. **No downtime** - migrations are seamless

### Dangerous Changes

Some schema changes can cause data loss:

- ⚠️ Removing a model
- ⚠️ Removing required fields
- ⚠️ Changing field types

**Best practice:**

1. Test schema changes in a staging branch first
2. Use data migration scripts for complex changes
3. Back up data before major schema changes

---

## Rollback

### Rollback to Previous Deployment

1. Go to Amplify Console
2. Click on a previous successful deployment
3. Click **"Redeploy this version"**
4. Confirm

Your app will rollback to that deployment.

### Rollback Backend Changes

```bash
npx ampx rollback --branch main
```

---

## Security Best Practices

### 1. Secrets Management

**Never commit secrets to git**

Use AWS Secrets Manager:

```typescript
// In your app
import { getSecret } from "aws-amplify/utils";

const apiKey = await getSecret("MY_API_KEY");
```

### 2. CORS Configuration

Configure allowed origins in `/amplify/backend.ts`:

```typescript
const backend = defineBackend({
  // ...
});

// Configure CORS for your API
backend.data.resources.graphqlApi.addHttpDataSource(/*...*/);
```

### 3. Rate Limiting

Enable WAF (Web Application Firewall) in Amplify Console:

1. Click **"Access control"**
2. Enable **"AWS WAF"**
3. Configure rate limits

### 4. Authentication Settings

In production, enforce strong passwords:

Edit `/amplify/auth/resource.ts`:

```typescript
export const auth = defineAuth({
  loginWith: { email: true },
  multifactor: {
    mode: "OPTIONAL",
    sms: true,
  },
});
```

---

## Cost Optimization

### Free Tier

AWS Amplify free tier includes:

- 1,000 build minutes/month
- 15 GB data transfer/month
- 5 GB storage

### Estimated Costs

For a typical app with moderate traffic:

- **Amplify Hosting:** ~$5-15/month
- **AppSync API:** ~$4/million requests
- **DynamoDB:** ~$1.25/million requests (on-demand)
- **Cognito:** Free for <50,000 MAU

### Cost Monitoring

Set up billing alerts:

1. Go to [AWS Billing Console](https://console.aws.amazon.com/billing)
2. Click **"Budgets"**
3. Create a budget with email alerts

---

## Troubleshooting

### Build Fails

**Check build logs:**

1. Amplify Console → Your app → Failed deployment → Logs

**Common issues:**

- Missing dependencies in package.json
- Environment variables not set
- TypeScript errors

### 502 Bad Gateway

**Cause:** Backend not deployed or misconfigured

**Solution:**

1. Check that `amplify_outputs.json` is generated
2. Verify backend deployed successfully
3. Check CloudWatch logs for errors

### Authentication Not Working

**Cause:** Cognito user pool not accessible

**Solution:**

1. Check CORS settings in API
2. Verify `amplify_outputs.json` in build
3. Check browser console for errors

---

## Next Steps

After deployment:

1. ✅ Set up custom domain
2. ✅ Configure environment variables
3. ✅ Enable monitoring and alerts
4. ✅ Set up staging branch
5. ✅ Configure WAF rate limiting
6. ✅ Test authentication flows
7. ✅ Run performance tests

---

## Useful Resources

- [Amplify Hosting Documentation](https://docs.amplify.aws/guides/hosting/)
- [AWS Amplify Console](https://console.aws.amazon.com/amplify)
- [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch)
- [AWS Support](https://console.aws.amazon.com/support)

---

## Need Help?

- Review [GETTING_STARTED.md](./GETTING_STARTED.md)
- Check [Amplify Discord](https://discord.gg/amplify)
- Search [AWS Forums](https://forums.aws.amazon.com/forum.jspa?forumID=314)
- Open an issue on GitHub
