# Deployment Guide: Netlify (Frontend + Backend)

This guide outlines how to deploy **Tokyo Express** to **Netlify** while keeping all features (including email notifications and admin password reset) functional.

## 1. Firebase Rules Deployment
Ensure your Firestore Security Rules are deployed to your Firebase console before tracking packages.
```bash
# Example if using firebase-tools
firebase deploy --only firestore:rules
```

## 2. Netlify Deployment (Frontend + Functions)

Netlify will host both your React application and your "backend" (as serverless functions).

### Steps:
1.  **Connect Repository**: Select your GitHub repository in Netlify.
2.  **Configure Build Settings**:
    -   **Base directory**: Set to the folder containing `package.json` (or leave blank if it's at the root).
    -   **Build command**: `npm run build`
    -   **Publish directory**: `dist`
3.  **Environment Variables**:
    You **MUST** set the following variables in Netlify UI (Site settings > Build & deploy > Environment variables):
    -   `GEMINI_API_KEY`: (If using AI features)
    -   No other variables are strictly required by default as the app uses `firebase-applet-config.json` for frontend, but you can set custom ones if you modified the code.

## 3. Email Notifications (SMTP)
Email notifications (Status updates, Admin Reset) require valid SMTP settings. These are managed directly via the **Admin Settings** page in your deployed application.
1. Log in to the Admin Panel.
2. Go to **Settings**.
3. Fill in the **SMTP Configuration** section.
4. Save changes.

## 4. Troubleshooting "missing package.json"
If Netlify logs say `ENOENT: no such file or directory, open 'package.json'`:
- Verify your folder structure in GitHub.
- If your project is inside a subfolder (e.g. `express-app/package.json`), update the **Base directory** in Netlify to `express-app`.

## 5. Security Note
Your `firebase-applet-config.json` contains public identifiers. While it's generally safe to commit to a private repo, for public repos, consider moving these values to environment variables.
