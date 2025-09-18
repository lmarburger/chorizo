# Chorizo Security Setup

## What's Been Implemented

Your Chorizo app is now fully secured with:

✅ **Middleware Protection**: ALL routes and API endpoints are protected
✅ **JWT Authentication**: Secure tokens that last 30 days (kids won't need to sign in often)
✅ **Rate Limiting**: Prevents brute force attacks (5 attempts, then 15-minute lockout)
✅ **Simple Family Password**: One password for the whole family
✅ **Secure Cookie Storage**: httpOnly cookies prevent XSS attacks
✅ **Production-Ready**: Different security settings for dev vs production

## Setup Instructions

### Step 1: Generate Your Family Password Hash

Run this command locally:

```bash
node scripts/setup-password.js
```

This will:
1. Prompt you for your family password (choose something your kids can remember)
2. Generate a secure hash that can't be reversed
3. Create a random JWT secret
4. Show you the exact environment variables to add

### Step 2: Configure Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `chorizo` project
3. Go to Settings → Environment Variables
4. Add these two variables (you'll get the exact values from Step 1):
   - `FAMILY_PASSWORD_HASH_B64` - The base64-encoded bcrypt hash of your password
   - `JWT_SECRET` - A random string for signing tokens

5. Click "Save" for each variable
6. **IMPORTANT**: Redeploy your app (Deployments → Three dots → Redeploy)

### Step 3: Local Development Setup

Add the same variables to your `.env.local` file:

```env
FAMILY_PASSWORD_HASH_B64="your_base64_encoded_hash_here"
JWT_SECRET="your_secret_here"
```

Then restart your dev server:
```bash
npm run dev
```

## How It Works

1. **First Visit**: Users land on the login page
2. **Authentication**: Enter the family password
3. **Token Creation**: A secure JWT token is created and stored as a cookie
4. **30-Day Duration**: The token lasts 30 days, so kids rarely need to sign in
5. **Automatic Protection**: Every page and API endpoint checks for valid authentication

## Security Features

### Rate Limiting
- 5 login attempts allowed per IP address
- After 5 failed attempts, 15-minute lockout
- Prevents automated password guessing

### Token Security
- JWTs are signed with your secret key
- Tokens expire after 30 days
- Stored in httpOnly cookies (not accessible via JavaScript)
- Different cookie settings for dev vs production

### Complete Protection
- Middleware runs before EVERY request
- API endpoints can't be accessed without authentication
- No data leakage to unauthenticated users

## User Experience

### For Kids:
- Sign in once every 30 days
- Simple password field
- Clear message if they forget: "Ask mom or dad!"
- No usernames to remember

### For Parents:
- Same simple login
- Can change password by regenerating hash and updating Vercel

## Testing Your Security

After deployment, test that everything is secure:

1. **Open incognito/private browser**
2. **Try to access** `https://chorizo-eight.vercel.app/`
3. **Should redirect to** `/login`
4. **Try API endpoints** like `/api/chores` - should also redirect
5. **Enter wrong password** 5 times - should lock out for 15 minutes
6. **Enter correct password** - should access the app
7. **Close and reopen browser** - should stay logged in

## Changing the Password

To change your family password:

1. Run `node scripts/generate-password-hash.js` with new password
2. Update `FAMILY_PASSWORD_HASH` in Vercel
3. Redeploy
4. All existing sessions will continue to work until tokens expire

## Troubleshooting

**"Authentication not configured" error**
- Make sure you've added both environment variables to Vercel
- Redeploy after adding variables

**Can't login locally**
- Check that `.env.local` has both variables
- Restart dev server after adding variables

**Kids keep getting logged out**
- Check browser settings - cookies might be getting cleared
- Consider increasing token duration if needed

## Important Notes

⚠️ **Never commit `.env.local` to git** - it contains your secrets
⚠️ **Keep your JWT_SECRET private** - anyone with it can create valid tokens
✅ **Your password hash is safe** - even if someone sees it, they can't reverse it to get your password
✅ **The app is now completely private** - only your family can access it