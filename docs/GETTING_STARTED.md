# Getting Started Guide

This guide will walk you through setting up and running the Universal Starter Template locally.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and npm installed ([Download](https://nodejs.org/))
- **Git** installed ([Download](https://git-scm.com/))
- **AWS Account** (free tier works fine) ([Sign up](https://aws.amazon.com/))
- **Code editor** (VS Code recommended)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd universal-starter-template

# Install dependencies
npm install
```

## Step 2: Configure AWS Credentials

The Amplify sandbox requires AWS credentials to provision cloud resources.

### Option A: AWS CLI (Recommended)

1. Install AWS CLI: https://aws.amazon.com/cli/
2. Configure credentials:

```bash
aws configure
```

Enter your:

- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format: `json`

### Option B: Environment Variables

Set these environment variables:

```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
```

## Step 3: Start Amplify Sandbox

The sandbox creates a personal cloud development environment:

```bash
npx ampx sandbox
```

**What this does:**

- Creates AWS resources (AppSync API, DynamoDB tables, Cognito user pool)
- Generates `amplify_outputs.json` with your backend configuration
- Watches for schema changes and auto-deploys

**Wait for this message:**

```
✅ [Deployed]
```

This can take 2-5 minutes on first run.

**Keep this terminal running** - it watches for changes.

## Step 4: Run the Development Server

Open a **new terminal** and run:

```bash
npm run dev
```

You should see:

```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Experiments:  • Turbopack
```

## Step 5: Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

You should see the beautiful landing page!

## Step 6: Test Authentication

1. Click "Get Started" or navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
2. You'll see the Amplify Authenticator
3. Click "Create Account"
4. Enter an email and password (minimum 8 characters)
5. Check your email for the verification code
6. Enter the code and sign in
7. You're now on the authenticated dashboard!

## Step 7: Test the Database

On the dashboard page:

1. Click "Create Sample Task"
2. See the task appear in your list
3. Click "Delete" to remove it

**What just happened?**

- Your app created a record in DynamoDB
- The record is tied to your user (owner authorization)
- The UI updated in real-time

## Project Structure Overview

```
├── app/                    # Next.js pages
│   ├── page.tsx           # Landing page (public)
│   ├── dashboard/         # Dashboard (authenticated)
│   └── login/             # Login page
│
├── amplify/               # Backend configuration
│   ├── auth/              # Cognito auth settings
│   ├── data/              # Data models (your schema)
│   └── backend.ts         # Backend definition
│
├── components/            # React components
│   ├── ui/                # Reusable components (Button, etc.)
│   └── auth/              # Auth-related components
│
├── lib/                   # Utilities
│   └── utils/             # Helper functions (cn, etc.)
│
└── types/                 # TypeScript types
    └── index.ts           # Type exports
```

## Common Tasks

### Modify the Data Schema

Edit `/amplify/data/resource.ts`:

```typescript
const schema = a.schema({
  // Add your models here
  BlogPost: a
    .model({
      title: a.string().required(),
      content: a.string(),
      publishedAt: a.datetime(),
    })
    .authorization((allow) => [allow.authenticated().to(["read"]), allow.owner()]),
});
```

The sandbox will automatically detect changes and redeploy (takes ~30 seconds).

### Add a New Page

1. Create `/app/blog/page.tsx`:

```typescript
export default function BlogPage() {
  return <div>My Blog</div>;
}
```

2. Navigate to [http://localhost:3000/blog](http://localhost:3000/blog)

### Query Data from Your Schema

```typescript
"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export default function MyComponent() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    async function fetchPosts() {
      const { data } = await client.models.BlogPost.list();
      setPosts(data);
    }
    fetchPosts();
  }, []);

  // ... render posts
}
```

### Add Social Login (Google, Facebook, etc.)

Edit `/amplify/auth/resource.ts`:

```typescript
export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: "your-google-client-id",
        clientSecret: "your-google-client-secret",
      },
    },
  },
});
```

See [Amplify Auth docs](https://docs.amplify.aws/gen2/build-a-backend/auth/add-social-provider/) for full setup.

## Troubleshooting

### `npx ampx sandbox` fails

**Error:** `Unable to resolve AWS credentials`

**Solution:** Configure AWS CLI (see Step 2)

---

**Error:** `Region not configured`

**Solution:** Set AWS_REGION environment variable or run `aws configure`

---

### Development server won't start

**Error:** `Port 3000 is already in use`

**Solution:** Kill the process using port 3000 or use a different port:

```bash
npm run dev -- -p 3001
```

---

### Authentication not working

**Error:** `amplify_outputs.json not found`

**Solution:** Make sure the sandbox is running and has deployed successfully

---

### Changes to schema not reflecting

1. Check that `npx ampx sandbox` is still running
2. Look for error messages in the sandbox terminal
3. Wait ~30 seconds for the deployment to complete
4. Refresh your browser

---

## Next Steps

1. **Customize the landing page** - Edit `/app/page.tsx`
2. **Define your data models** - Edit `/amplify/data/resource.ts`
3. **Build your features** - Add new pages and components
4. **Read CLAUDE.md** - Learn the development philosophy
5. **Deploy to AWS** - See [DEPLOYMENT.md](./DEPLOYMENT.md)

## Useful Resources

- [Amplify Gen2 Documentation](https://docs.amplify.aws/gen2/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [CLAUDE.md](../CLAUDE.md) - Development guidelines

## Getting Help

- Review the [Amplify Gen2 Guidelines](../AMPLIFY_GEN2_GUIDELINES.md)
- Check [Amplify Discord](https://discord.gg/amplify)
- Search [Stack Overflow](https://stackoverflow.com/questions/tagged/aws-amplify)
- Open an issue on GitHub
