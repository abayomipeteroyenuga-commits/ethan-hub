# ETHAN HUB v5.0 — Ecosystem + Premium Framework

Upgraded from the user's working v4.3 Supabase Verify / Auto Login build.

## Dashboard apps
- Ethan ERP & LMS — Ethan ID SSO
- Ethan Learn — Hub Access
- Ethan AI — Ethan ID SSO
- Ethan Office — Ethan ID SSO
- Ethan Cloud — Hub Access
- Ethan GPS — Hub Access
- Ethan Games — Hub Access
- NEON BIKE RIDE — Ethan ID SSO
- Super Kingdom — Hub Access

**Ethan ID SSO** means the existing Hub ticket flow is enabled for that app target in this build.
**Hub Access** means the service is available from the authenticated Hub dashboard, but true cross-domain auto-login still requires that destination app to implement/accept Ethan SSO tickets.

## Premium framework
The dashboard now supports Free / Plus / Pro plan display. It safely defaults to Free if the database migration has not been run.

To store plans centrally, run `PREMIUM-PLAN-MIGRATION.sql` once in the Ethan Hub Supabase project. This does not connect payments and does not automatically upgrade users.

## Deployment
Replace the existing GitHub repository files with this package and redeploy on Vercel. Keep the existing Supabase Auth redirect for the production Hub domain.


## v5.2
Ethan Cloud is now an Ethan ID SSO target (`cloud`) and opens through the existing secure ticket handoff.


## ETHAN ID NEW SUPABASE (v5.3)
This build points Ethan Hub authentication to project `hrymakhatxjitbgpdbjk`.
The supplied REST endpoint was normalized to the Supabase project base URL; the JavaScript client adds REST/Auth paths itself.

Required Supabase Authentication URL Configuration:
- Site URL: https://hub.ethandigitalacademy.org
- Redirect URL: https://hub.ethandigitalacademy.org/**

Run PREMIUM-PLAN-MIGRATION.sql in this new ETHAN ID project if Free / Plus / Pro storage is required.
Deploy the `ethan-sso` Edge Function in this same project before relying on one-click SSO into connected apps.

## v5.5 dashboard layout fix
- Preserves the working Ethan ID/Supabase authentication and callback handling from v5.4.
- Desktop dashboard uses a compact 3 x 3 ecosystem grid so all 9 app cards are presented together.
- Reduces card height, spacing and typography on desktop without changing mobile/tablet responsiveness.

## v6.0 app launcher fix
- Only Ethan Cloud uses Ethan ID SSO while its integration is being tested.
- All other Ethan apps open directly instead of getting stuck on Connecting.
- Cloud SSO has a 6-second timeout and automatically opens Cloud normally if SSO is unavailable.
