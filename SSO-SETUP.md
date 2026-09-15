# Ethan ID SSO setup

This build adds secure, short-lived SSO handoff between Ethan Hub and Ethan ERP & LMS.

## One-time Supabase setup
1. In the same Supabase project used by Hub and ERP/LMS, create/deploy the Edge Function in `supabase/functions/ethan-sso/index.ts` with the function name `ethan-sso`.
2. Add an Edge Function secret named `SSO_SECRET`. Use a long random value of at least 32 characters. Do not put this secret in frontend files or GitHub.
3. Ensure the function has access to the standard `SUPABASE_URL` and `SUPABASE_ANON_KEY` environment variables.
4. Deploy Ethan Hub to `https://hub.ethandigitalacademy.org` and ERP/LMS to `https://app.ethandigitalacademy.org`.

## Flow
- User signs in once on Ethan Hub.
- Clicking ERP & LMS asks the Edge Function for a 60-second encrypted handoff ticket.
- The browser opens ERP/LMS with the opaque ticket.
- ERP/LMS exchanges it through the Edge Function and establishes the same Supabase session.
- The ticket is removed from the address bar immediately.

No password is sent between applications and no service-role key is placed in either frontend.

## Important
Use HTTPS in production. Keep `SSO_SECRET` private. This version uses a 60-second encrypted ticket; for stricter replay prevention later, add a server-side nonce store so every ticket can be consumed only once.
