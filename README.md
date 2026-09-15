# Ethan Hub v1.1

One Account. One Ecosystem. Powered by Ethan Digital Academy.

This version applies the supplied official Ethan Digital Academy logo to the Ethan Hub header, Ethan ID authentication experience, and signed-in dashboard.

## Current state
- Responsive Ethan Hub interface
- Sign In / Create Ethan ID prototype
- Ethan ecosystem app launcher
- Official Ethan Digital Academy branding
- Ready for GitHub / Vercel static deployment

## Next phase
Connect Ethan ID to production authentication (e.g. Supabase) and integrate Ethan Learn as the first SSO-enabled service.

## v1.2 ERP/LMS connection
- Ethan ERP & LMS is the first connected ecosystem service.
- Ethan Hub now uses the SAME Supabase Auth project as ERP/LMS, so an Ethan ID is an ERP/LMS-compatible account.
- Deploy Hub at hub.ethandigitalacademy.org and keep ERP/LMS at app.ethandigitalacademy.org.
- Important: browser sessions are origin-scoped. This version shares identity/accounts, but seamless cross-subdomain SSO without a second login requires a server-side one-time-code/OAuth handoff. Do not pass passwords or refresh tokens in URLs.
