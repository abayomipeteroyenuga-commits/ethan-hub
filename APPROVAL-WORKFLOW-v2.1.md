# Ethan Hub v2.1 — Super Admin Approval Required

Flow:
1. User creates Ethan ID.
2. Database creates `ethan_profiles` row with `approved = false`.
3. User may confirm email, but cannot enter Hub yet.
4. Super Admin approves the profile.
5. Only then can the user enter the Hub and create SSO handoffs to connected Ethan services.

Public signup remains Student, Professional or Business Owner only.
Instructor/Admin/Super Admin roles are assigned administratively.
