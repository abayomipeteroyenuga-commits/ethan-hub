# Ethan Hub v3.5 — Single File Auth Repair

Deploy the CONTENTS of this folder as the root of the Vercel project.

Why this version:
- CSS, Ethan logo, config and Ethan Hub JavaScript are embedded in index.html.
- This prevents stale/missing app.js, config.js or styles.css deployments.
- Create Ethan ID tab works independently of Supabase.
- Signup uses the existing Ethan ID Supabase project.
- /auth/callback rewrites to index.html.
- Cache is disabled while the authentication repair is being tested.

Production flow:
Create Ethan ID → verify email → sign in → Ethan Hub.
