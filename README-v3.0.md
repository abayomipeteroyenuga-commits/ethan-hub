# Ethan Hub v3.0 — Clean Ethan ID Approval System

Flow:
1. Public registration: Student / Professional / Business Owner only.
2. Supabase sends confirmation email.
3. User confirms email.
4. Callback marks the Ethan profile as email verified.
5. User remains Pending.
6. Approved Super Admin sees the user in User Management.
7. Super Admin assigns role and approves.
8. Only verified + approved users can enter Ethan Hub.
9. Instructor/Admin/Super Admin cannot be self-selected publicly.

Run `SUPABASE-ETHAN-HUB-v3.0-CLEAN-AUTH.sql` once in Supabase SQL Editor before deploying/testing v3.0.
