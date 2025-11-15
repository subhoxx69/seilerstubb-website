# 🔐 Secure Deployment Guide - Seilerstubb Restaurant

## Overview
This guide shows how to securely deploy your restaurant app to Vercel with encrypted API keys to prevent leaks and hacks.

---

## ⚠️ **BEFORE DEPLOYMENT: DO NOT COMMIT .env.local**

### Step 1: Add .env.local to .gitignore (CRITICAL!)

```bash
# Edit .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
echo ".env.production" >> .gitignore
```

**Why?** Your `.env.local` file contains:
- ❌ Firebase private keys
- ❌ Gmail passwords
- ❌ Google OAuth secrets
- ❌ ImageKit API keys

These should NEVER be in GitHub!

---

## 🔑 **Step 2: Identify Sensitive Keys**

### Public Keys (Safe to commit/expose)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
```

### Private/Sensitive Keys (ENCRYPT THESE!)
```
FIREBASE_PRIVATE_KEY                 ❌ VERY SENSITIVE
FIREBASE_CLIENT_EMAIL                ⚠️ Semi-sensitive
GOOGLE_CLIENT_SECRET                 ❌ VERY SENSITIVE
GMAIL_APP_PASSWORD                   ❌ VERY SENSITIVE
IMAGEKIT_PRIVATE_KEY                 ❌ VERY SENSITIVE
ENCRYPTION_MASTER_KEY                ❌ VERY SENSITIVE
HASH_SECRET                          ❌ VERY SENSITIVE
```

---

## 🔐 **Step 3: Deployment Strategy**

### Option A: Use Vercel Secrets (RECOMMENDED)
✅ **Best for production**

1. **Never commit secrets to GitHub**
2. **Add secrets directly in Vercel dashboard**
3. **Vercel encrypts them automatically**

### Option B: Use Environment Vault (Extra Security)
✅ **Best for maximum security**

1. **Encrypt sensitive keys locally**
2. **Store encrypted versions in repo**
3. **Decrypt at runtime on server**

---

## 📋 **DEPLOYMENT CHECKLIST**

### Pre-Deployment
- [ ] Backup `.env.local` to safe location
- [ ] Update `.gitignore` with `.env.local`
- [ ] Delete `.env.local` from git history (if already committed)
- [ ] Create new encryption key
- [ ] Create `.env.example` with dummy values

### Git Setup
```bash
# Add env files to .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# Commit changes
git add .gitignore
git commit -m "Add env files to gitignore"
git push origin main
```

### Firebase Setup (Keep Private Keys Safe)
```bash
# NEVER do this:
git add .env.local
git push                            # ❌ WRONG!

# DO this instead:
# Copy Firebase credentials ONLY in Vercel dashboard environment variables
```

---

## 🚀 **VERCEL DEPLOYMENT STEPS**

### Step 1: Prepare Repository
```bash
# Make sure .env.local is in .gitignore
cat .gitignore | grep ".env.local"

# If not found, add it
echo ".env.local" >> .gitignore

# Don't commit .env.local!
git add .gitignore
git commit -m "Secure: Add environment files to gitignore"
git push origin main
```

### Step 2: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Click "New Project"
3. Select your GitHub repository
4. Click "Import"

### Step 3: Add Environment Variables in Vercel

**Click "Environment Variables"** and add ONLY:

#### Firebase (Public)
```
NEXT_PUBLIC_FIREBASE_API_KEY = AIzaSyAZCHQpX6IMONGeECKOhQLJlhyfY5osbkY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = seilerstubb-6731f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID = seilerstubb-6731f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = seilerstubb-6731f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 951021513285
NEXT_PUBLIC_FIREBASE_APP_ID = 1:951021513285:web:4cf7bacdea3da39698512c
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = G-CW6K221EJE
```

#### Firebase Admin (Private - Server-side only)
```
FIREBASE_SERVICE_ACCOUNT_TYPE = service_account
FIREBASE_PROJECT_ID = seilerstubb-6731f
FIREBASE_PRIVATE_KEY_ID = 1b239659ce7e633b9f80640d63f31926e7c79290
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\nMIIEvAIBADA...
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-fbsvc@seilerstubb-6731f.iam.gserviceaccount.com
FIREBASE_CLIENT_ID = 111608460237837100871
FIREBASE_AUTH_URI = https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI = https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL = https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL = https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40seilerstubb-6731f.iam.gserviceaccount.com
```

#### Gmail (Private)
```
GMAIL_USER_EMAIL = your-gmail@gmail.com
GMAIL_APP_PASSWORD = xxxx xxxx xxxx xxxx
```

#### Google OAuth (Private)
```
GOOGLE_CLIENT_ID = xxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_REDIRECT_URI = https://www.seilerstubb.com/api/auth/gmail/callback
```

#### ImageKit (Private)
```
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY = public_xxxxxxxxxxxxxxxxxxxxxxxx=
IMAGEKIT_PRIVATE_KEY = private_xxxxxxxxxxxxxxxxxxxxxxxx=
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT = https://ik.imagekit.io/xxxxxxxxxx
```

#### Encryption (Private)
```
ENCRYPTION_MASTER_KEY = your-32-byte-hex-encryption-key-here
HASH_SECRET = VGhpcyBpcyBhIDMyIGJ5dGUgaGFzaiBzZWNyZXQga2V5IQ==
```

### Step 4: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. Your site is live! 🎉

---

## 🛡️ **Security Best Practices**

### ✅ DO
- ✅ Use strong, randomly generated keys
- ✅ Rotate keys every 3-6 months
- ✅ Use environment variables for secrets
- ✅ Enable 2FA on your Vercel account
- ✅ Keep backups of encryption keys in safe location
- ✅ Monitor access logs
- ✅ Use service accounts with minimal permissions
- ✅ Encrypt database backups

### ❌ DON'T
- ❌ Commit `.env.local` to GitHub
- ❌ Share API keys via email/chat
- ❌ Use the same key for all environments
- ❌ Hardcode secrets in source code
- ❌ Push credentials to public repositories
- ❌ Store passwords in plaintext
- ❌ Log sensitive values to console
- ❌ Commit Firebase private keys

---

## 🔄 **Rotating Keys (Every 6 months)**

### Step 1: Generate New Keys

**Firebase:**
1. Go to Firebase Console
2. Project Settings → Service Accounts
3. Click "Generate New Private Key"
4. Download new JSON

**Gmail:**
1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Regenerate app password

**Google OAuth:**
1. Go to Google Cloud Console
2. APIs & Services → OAuth consent screen
3. Reset secret

### Step 2: Update in Vercel
1. Update env variables in Vercel dashboard
2. Redeploy

### Step 3: Archive Old Keys
1. Backup old keys securely
2. Mark with date and deprecation notice

---

## 🚨 **If Keys are Leaked**

### IMMEDIATE ACTIONS (within 5 minutes)
1. Disable leaked key in Firebase/Google Cloud
2. Update env variables in Vercel
3. Redeploy application
4. Monitor logs for suspicious activity

### REMEDIATION (within 24 hours)
1. Generate new keys everywhere
2. Audit recent access logs
3. Check Firebase for unauthorized writes
4. Update documentation
5. Notify team members

---

## 📊 **Monitoring & Alerts**

### Setup Firebase Alerts
- [ ] Enable Google Cloud Security Command Center
- [ ] Setup alerts for unusual API activity
- [ ] Monitor authentication failures
- [ ] Watch database writes

### Setup Vercel Alerts
- [ ] Enable deployment notifications
- [ ] Setup error tracking
- [ ] Monitor performance metrics

---

## 🔍 **Verification Checklist**

After deployment, verify:
- [ ] ✅ Website loads at `https://www.seilerstubb.com/`
- [ ] ✅ Firebase Firestore working (can create reservations)
- [ ] ✅ Authentication working (login/signup)
- [ ] ✅ OTP emails sending
- [ ] ✅ Admin dashboard accessible
- [ ] ✅ Menu loading from Firebase
- [ ] ✅ Reservations saving to Firestore
- [ ] ✅ No errors in Vercel logs
- [ ] ✅ No secrets exposed in logs
- [ ] ✅ `.env.local` not in git history

---

## 📞 **Support & Troubleshooting**

### Common Issues

**Issue: "Cannot find module" errors**
```bash
npm install
npm run build
```

**Issue: Firebase authentication fails**
- Check FIREBASE_PROJECT_ID in Vercel env variables
- Verify Firestore rules are correct
- Check Firebase Console for errors

**Issue: Gmail not sending emails**
- Verify GMAIL_USER_EMAIL and GMAIL_APP_PASSWORD
- Check Gmail Security settings
- Verify SMTP is enabled

**Issue: Secrets are exposed**
- Immediately rotate all keys
- Check Vercel logs for leaks
- Update GitHub private key (https://github.com/settings/security)

---

## ✨ **Summary**

✅ All API keys are encrypted  
✅ Secrets stored securely in Vercel  
✅ No hardcoded credentials in code  
✅ Production-ready deployment  
✅ Secure from leaks and hacks  

**Your restaurant app is now deployed securely!** 🎉

---

**Last Updated:** November 15, 2025  
**Domain:** https://www.seilerstubb.com/
