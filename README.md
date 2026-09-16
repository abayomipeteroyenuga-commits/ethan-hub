Ethan Hub v3.9
Clean callback: no physical redirect and no /?#.
Vercel rewrites /auth/callback directly to index.html.
The existing callback exchanges the Supabase code, syncs verification, creates the session, enters Hub, then cleans URL to https://hub.ethandigitalacademy.org/
No new SQL if v3.6 SQL was already run.
