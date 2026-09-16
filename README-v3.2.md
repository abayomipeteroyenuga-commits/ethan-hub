# Ethan Hub v3.2 — Local Preview Fixed

Fixes the unstyled page and broken logo when opening index.html directly from a Windows Downloads folder.

Cause: v3.1 used root-relative paths such as /styles.css and /ethan-digital-academy-logo.jpg. Under file:// those resolve from the drive root instead of the extracted Ethan Hub folder.

v3.2 uses relative asset paths, while remaining deployable to Vercel.
Authentication itself should be tested on the deployed HTTPS domain because Supabase redirect/auth flows are web-origin based.
