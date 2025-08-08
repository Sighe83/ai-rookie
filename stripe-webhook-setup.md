# 🪝 Stripe Webhook Setup for Local Development

## Step 1: Login to Stripe CLI

Run this command to authenticate with your Stripe account:

```bash
stripe login
```

This will open a browser window to authorize the CLI with your Stripe account.

## Step 2: Start Webhook Forwarding

Once logged in, run this command to forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:8080/api/payments/webhook
```

This command will:
- Start listening for webhook events from Stripe
- Forward them to your local development server
- Display a webhook signing secret

## Step 3: Copy the Webhook Secret

When you run the `stripe listen` command, you'll see output like:

```
> Ready! Your webhook signing secret is whsec_1234567890abcdef... (^C to quit)
```

**Copy that webhook secret** (starts with `whsec_`) and let me know what it is!

## Step 4: Test the Setup

After I add the webhook secret to your environment, you can test by:

1. **Start your backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start your frontend:**
   ```bash
   npm run dev
   ```

3. **Create a test booking** and it should redirect to Stripe payment!

4. **Use test card:** 4242 4242 4242 4242 with any future expiry date

## Keep These Running

For local development, you'll need to keep these running:
- ✅ Backend server (`npm run dev` in backend/)
- ✅ Frontend server (`npm run dev` in root)  
- ✅ Stripe webhook forwarding (`stripe listen --forward-to localhost:8080/api/payments/webhook`)

---

## Alternative: Use ngrok (if Stripe CLI doesn't work)

If you prefer ngrok or if Stripe CLI has issues:

1. Install ngrok: `brew install ngrok`
2. Start your backend: `cd backend && npm run dev`
3. Expose it: `ngrok http 8080`
4. Use the ngrok URL in Stripe webhook settings