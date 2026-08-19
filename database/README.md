# Database — Student Nexus

This directory contains all SQL schema files and migration patches required to set up and maintain the Student Nexus database on Supabase. The database underpins all three systems: the Mobile Application, the Website, and the Admin Dashboard.

---

## Files in This Directory

| File | Description |
|---|---|
| `MASTER_SCHEMA.sql` | Consolidated schema file containing all table definitions, indexes, row-level security policies, storage bucket configurations, and schema patches up to the latest version. This is the single source of truth for the database structure. |

---

## Initial Setup

### Requirements

- An active **Supabase** project (https://supabase.com)
- Access to the **SQL Editor** within the Supabase Dashboard

### Steps

**1. Apply the Master Schema**

Open `MASTER_SCHEMA.sql`, copy its full contents, and execute it in the Supabase SQL Editor.

This script will create all required tables, indexes, row-level security policies, storage buckets, and seed the initial compliance requirements. It is designed to be idempotent — it can be run multiple times without causing errors.

```
Navigate to: Supabase Dashboard > SQL Editor > New Query
Paste: Full contents of MASTER_SCHEMA.sql
Click: Run
```

**2. Create the Administrator Account**

After the schema is applied, create the initial OSAS Admin user through the Supabase Dashboard:

```
Navigate to: Authentication > Users > Add User
Email:    admin@studentnexus.com
Password: (set a secure password)
```

Then update the corresponding row in the `users` table to assign the admin role:

```sql
UPDATE users
SET role = 'osas_admin', is_active = true
WHERE email = 'admin@studentnexus.com';
```

---

## Table Overview

The following are the primary tables in the database:

| Table | Description |
|---|---|
| `users` | Stores all user profiles including role, student ID, and active status. |
| `organizations` | Records for each registered student organization. |
| `organization_members` | Links users to organizations with their designated position. |
| `event_proposals` | All event submissions from student leaders, including status tracking. |
| `event_attachments` | Supporting documents uploaded alongside event proposals. |
| `official_announcements` | OSAS-reviewed announcements authored by student leaders. |
| `notifications` | In-app notifications delivered to users and administrators. |
| `faculty_requests` | Equipment and facility requests submitted by faculty members. |
| `compliance_requirements` | Defines the set of compliance documents required from each organization. |
| `organization_compliance` | Tracks each organization's compliance status against requirements. |
| `organization_repository` | Document repository for constitutions, resolutions, and meeting minutes. |
| `audit_logs` | Immutable log of all major system actions for accountability. |
| `document_hashes` | SHA-256 hashes of uploaded files for integrity verification. |
| `ai_chats` | Stores AI assistant conversation history per user. |

---

## User Roles

The `users` table enforces the following valid roles via a CHECK constraint:

| Role | Description |
|---|---|
| `osas_admin` | OSAS Administrator. Full access via the Admin Dashboard. |
| `student_leader` | Registered student organization officer. Access via the Mobile App. |
| `faculty` | Faculty member. Can submit facility and equipment requests. |
| `advisor` | Organization adviser. Read-level access. |
| `student` | General student. Reserved for future use. |

---

## Row-Level Security

Row-Level Security (RLS) is enabled on all sensitive tables. The policies enforce that:

- Users can only read and modify their own records.
- Administrators have full read and write access to all records.
- Certain tables (such as `official_announcements` and `event_proposals`) are readable by the public (unauthenticated) for display on the website.

---

## Storage Buckets

The schema provisions the following Supabase Storage buckets:

| Bucket | Access | Purpose |
|---|---|---|
| `documents` | Public read, authenticated write | General document uploads (event attachments, etc.) |
| `compliance_documents` | Public read, authenticated write | Compliance requirement submissions |

---

## Schema Maintenance

All schema changes are applied incrementally and consolidated into `MASTER_SCHEMA.sql`. When making structural changes to the database:

1. Write the change as a SQL `ALTER`, `CREATE`, or `DROP` statement.
2. Test it in the Supabase SQL Editor against the development project.
3. Apply it to the production project.
4. Append the change to `MASTER_SCHEMA.sql` so the file remains the accurate full schema.

---

## Important Notes

- New user registrations from the Mobile App set `is_active = false` by default. An OSAS Administrator must activate each account through the Admin Dashboard before the user can log in.
- The `password_hash` column in the `users` table stores the literal string `SUPABASE_AUTH_MANAGED` for all accounts. Password management is handled entirely by Supabase Authentication and not the application.
- Never expose the Supabase `service_role` key in any client-side code. Only the `anon` key should be used in the Mobile App, Website, and Admin Dashboard.
