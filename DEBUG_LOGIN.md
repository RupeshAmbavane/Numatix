# Debugging Login Issues

## Common Issues and Solutions

### 1. Check Backend Logs

When you try to login, check the backend terminal. You should see:
- "Login attempt for email: [email]"
- "User found, verifying password..."
- "Password verified, generating token..."
- "Login successful for user: [email]"

If you see "User not found", the email might be incorrect or the user wasn't created.

If you see "Password verification failed", the password is incorrect.

### 2. Verify User Exists in Database

Check if the user was actually created:

```bash
cd apps/backend
npx prisma studio
```

This will open Prisma Studio in your browser. Check the `User` table to see if your user exists.

### 3. Test Login API Directly

Test the login endpoint directly:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"your-email@example.com\",\"password\":\"your-password\"}"
```

### 4. Common Issues

**Email Case Sensitivity:**
- Make sure the email matches exactly (case-sensitive in some databases)
- Try the exact email you used during registration

**Password Issues:**
- Make sure you're using the exact password you registered with
- Check for extra spaces or special characters
- Password must be at least 8 characters

**Database Issues:**
- Make sure the database file exists: `apps/backend/prisma/dev.db`
- Try running migrations again: `npx prisma migrate dev`

**CORS Issues:**
- Make sure the backend is running on port 3000
- Check browser console for CORS errors
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local` is `http://localhost:3000`

### 5. Reset Password (If Needed)

If you need to reset a user's password, you can:

1. Delete the user from the database
2. Register again with the same email

Or manually update the password hash in the database using Prisma Studio.

