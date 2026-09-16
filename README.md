# Ethan Hub v3.8 — Confirmation Callback 404 Fixed
The 404 happened because Supabase sends confirmation to /auth/callback but Vercel had no page at that route.
This package includes BOTH:
1. vercel.json rewrite /auth/callback -> /
2. a physical auth/callback/index.html fallback
Deploy the contents at repository root.
No new SQL is required for this 404 fix.
