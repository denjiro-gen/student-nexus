-- ============================================================
-- File: SECURITY_SCHEMA.sql
-- ============================================================
-- ============================================
-- STUDENT NEXUS - SECURITY SCHEMA
-- ============================================
-- Run this script in your Supabase SQL Editor.
-- This script adds the missing tables for Security Features:
-- 1. Audit Logs (for Session & Accountability Tracking)
-- 2. Document Hashes (for Cryptographic Integrity Verification)

BEGIN;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. AUDIT LOGS TABLE
-- Tracks all major system actions to maintain accountability and trace transactions.
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g., 'LOGIN_FAILED', 'UPDATE_EVENT_STATUS'
    entity_type VARCHAR(100),     -- e.g., 'auth', 'event_proposal'
    entity_id UUID,               -- The ID of the record affected
    old_values JSONB,             -- State before change
    new_values JSONB,             -- State after change
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster filtering by entity or user
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- 2. DOCUMENT HASHES TABLE
-- Stores SHA-256 hashes of uploaded files to ensure they are not tampered with.
CREATE TABLE IF NOT EXISTS document_hashes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL, -- e.g., 'event_proposal', 'portfolio'
    entity_id UUID NOT NULL,           -- The ID of the related record
    file_name TEXT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,    -- 64-character SHA-256 hex string
    file_url TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure we only have one hash per file per entity
    CONSTRAINT unique_document_hash UNIQUE (entity_id, file_name)
);

CREATE INDEX IF NOT EXISTS idx_document_hashes_entity ON document_hashes(entity_type, entity_id);

COMMIT;



-- ============================================================
-- File: INNOVATIVE_FEATURES_SCHEMA.sql
-- ============================================================
-- ============================================
-- STUDENT NEXUS - 1.8.6 INNOVATIVE FEATURES SCHEMA
-- ============================================
-- Run this script in your Supabase SQL Editor.
-- This script adds the missing tables for:
-- 1. Approval-First Communication Workflow (Official Announcements)

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. OFFICIAL ANNOUNCEMENTS TABLE
-- Ensures that official announcements undergo OSAS review and approval prior to publication.
CREATE TABLE IF NOT EXISTS official_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Student Leader who drafted it
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    review_notes TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL, -- OSAS Admin who reviewed it
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_org ON official_announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON official_announcements(status);

COMMIT;



-- ============================================================
-- File: SETUP_STORAGE.sql
-- ============================================================
-- ============================================================
-- STUDENT NEXUS - Storage Bucket Setup
-- Run in: Supabase SQL Editor
-- Purpose:
--   Creates the 'documents' storage bucket if it doesn't exist,
--   makes it public, and sets up security policies so users
--   can upload files and anyone can read them.
-- ============================================================

-- 1. Create the 'documents' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Update to ensure it is public (in case it existed but wasn't public)
UPDATE storage.buckets
SET public = true
WHERE id = 'documents';

-- 3. Allow public access to view/download documents
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- 4. Allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documents' 
    AND auth.role() = 'authenticated'
);

-- 5. Allow users to update/overwrite their own documents
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'documents' 
    AND auth.uid() = owner
);

-- 6. Allow users to delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'documents' 
    AND auth.uid() = owner
);



-- ============================================================
-- File: UPDATE_SCHEMA_V4.sql
-- ============================================================
-- ============================================================
-- STUDENT NEXUS - Schema Patch v4
-- Run in: Supabase SQL Editor
-- Purpose:
--   1. Ensure event_attachments table has all required columns
--      (file_name, file_url, file_type, uploaded_by, uploaded_at)
--   2. Ensure organization_members position column allows longer strings
-- ============================================================

BEGIN;

-- 1. Ensure event_attachments has file_name column
ALTER TABLE event_attachments ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 2. Ensure event_attachments has file_url column
ALTER TABLE event_attachments ADD COLUMN IF NOT EXISTS file_url TEXT;

-- 3. Ensure event_attachments has file_type column
ALTER TABLE event_attachments ADD COLUMN IF NOT EXISTS file_type TEXT;

-- 4. Ensure event_attachments has uploaded_by (FK to users)
ALTER TABLE event_attachments ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- 5. Ensure event_attachments has uploaded_at timestamp
ALTER TABLE event_attachments ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 6. Add an index for fast lookup
CREATE INDEX IF NOT EXISTS idx_event_attachments_event_id ON event_attachments(event_id);

-- 7. Ensure event_proposals has file_name, file_url, file_type columns for quick display
ALTER TABLE event_proposals ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE event_proposals ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE event_proposals ADD COLUMN IF NOT EXISTS file_type TEXT;

COMMIT;



-- ============================================================
-- File: UPDATE_SCHEMA_V5.sql
-- ============================================================
-- ============================================================
-- STUDENT NEXUS - Schema Patch v5 (Faculty Features)
-- Run in: Supabase SQL Editor
-- Purpose:
--   1. Add 'faculty' role to user_role ENUM (if using ENUM). 
--      If the role is just a VARCHAR, this step is handled gracefully.
--   2. Create 'faculty_requests' table for equipment/chair requests.
-- ============================================================

BEGIN;

-- 1. Create the faculty requests table
CREATE TABLE IF NOT EXISTS faculty_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_url TEXT,     -- URL to supporting documents (e.g. PDF/Image)
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    review_notes TEXT,     -- For admin feedback if rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_faculty_requests_user ON faculty_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_requests_status ON faculty_requests(status);

-- 3. Set RLS (Row Level Security) - if active
ALTER TABLE faculty_requests ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own requests
CREATE POLICY "Users can view own faculty requests" 
    ON faculty_requests FOR SELECT 
    USING (auth.uid() = user_id);

-- Allow admins to see all requests
CREATE POLICY "Admins can view all faculty requests" 
    ON faculty_requests FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'osas_admin'
        )
    );

-- Allow users to insert their own requests
CREATE POLICY "Users can insert own faculty requests" 
    ON faculty_requests FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Allow admins to update status
CREATE POLICY "Admins can update faculty requests" 
    ON faculty_requests FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'osas_admin'
        )
    );

COMMIT;



-- ============================================================
-- File: UPDATE_SCHEMA_V5b.sql
-- ============================================================
-- ============================================================
-- STUDENT NEXUS - Schema Patch v5b (Fix Faculty Role Constraint)
-- Run in: Supabase SQL Editor
-- Purpose:
--   The auth signup for Faculty users fails with HTTP 500 because
--   the 'users' table role column has a CHECK constraint that doesn't
--   include 'faculty'. This script fixes that.
-- ============================================================

BEGIN;

-- 1. Drop any existing CHECK constraint on the role column
--    (safe - we recreate it below with 'faculty' included)
DO $$
DECLARE
    v_constraint_name TEXT;
BEGIN
    SELECT constraint_name INTO v_constraint_name
    FROM information_schema.constraint_column_usage
    WHERE table_name = 'users'
      AND column_name = 'role'
      AND constraint_name LIKE '%role%';

    IF v_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE users DROP CONSTRAINT IF EXISTS %I', v_constraint_name);
        RAISE NOTICE 'Dropped old role constraint: %', v_constraint_name;
    END IF;
END;
$$;

-- 2. Also try dropping the most commonly named variants directly
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role;
ALTER TABLE users DROP CONSTRAINT IF EXISTS user_role_check;

-- 3. Add the updated CHECK constraint that includes 'faculty'
ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN (
        'osas_admin',
        'student_leader',
        'student',
        'advisor',
        'faculty'
    ));

-- 4. If your role column is an ENUM type, alter it instead:
--    (This will only execute if the above fails; run manually if needed)
-- ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'faculty';

-- 5. Create faculty_requests table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS faculty_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faculty_requests_user ON faculty_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_requests_status ON faculty_requests(status);

COMMIT;



-- ============================================================
-- File: UPDATE_SCHEMA_V5c.sql
-- ============================================================
-- ============================================================
-- STUDENT NEXUS - Schema Patch v5c (Fix Faculty Role - Safe Version)
-- Run in: Supabase SQL Editor
-- 
-- The previous patch failed because existing rows in the users table
-- have role values that don't match the new constraint list.
-- This script normalizes those rows first before adding the constraint.
-- ============================================================

BEGIN;

-- Step 1: See what role values currently exist (informational)
-- SELECT DISTINCT role FROM users;

-- Step 2: Normalize any role values that are outside the valid set.
--   Anything unknown becomes 'student_leader' so no row is left invalid.
UPDATE users
SET role = 'student_leader'
WHERE role NOT IN ('osas_admin', 'student_leader', 'student', 'advisor', 'faculty');

-- Step 3: Drop ALL existing check constraints on users table (try every known name)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role;
ALTER TABLE users DROP CONSTRAINT IF EXISTS user_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_fkey;

-- Also drop any constraint whose name contains 'role' dynamically
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'users'::regclass
          AND contype = 'c'
          AND conname ILIKE '%role%'
    LOOP
        EXECUTE format('ALTER TABLE users DROP CONSTRAINT IF EXISTS %I', r.conname);
        RAISE NOTICE 'Dropped constraint: %', r.conname;
    END LOOP;
END;
$$;

-- Step 4: Add the updated CHECK constraint that now includes 'faculty'
ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN (
        'osas_admin',
        'student_leader',
        'student',
        'advisor',
        'faculty'
    ));

-- Step 5: Create faculty_requests table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS faculty_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faculty_requests_user ON faculty_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_faculty_requests_status ON faculty_requests(status);

COMMIT;



-- ============================================================
-- File: UPDATE_SCHEMA_V5_PUSH.sql
-- ============================================================
-- Update users table to store Expo Push Token
ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;



-- ============================================================
-- File: UPDATE_SCHEMA_V6.sql
-- ============================================================
-- ============================================================
-- STUDENT NEXUS - Schema Patch v6 (Notifications System)
-- Run in: Supabase SQL Editor
-- Purpose:
--   Creates a robust notifications table that can be used for 
--   both mobile users and admin alerts.
-- ============================================================

BEGIN;

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL means it's an admin notification
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'system', -- e.g., 'event_update', 'faculty_request', 'system'
    is_read BOOLEAN DEFAULT false,
    action_url TEXT, -- Optional URL or path to navigate to when clicked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- 3. Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage all notifications, particularly those where user_id IS NULL
DROP POLICY IF EXISTS "Admins can view and manage all notifications" ON notifications;
CREATE POLICY "Admins can view and manage all notifications" 
    ON notifications FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'osas_admin'
        )
    );

-- Regular users can only view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" 
    ON notifications FOR SELECT 
    USING (auth.uid() = user_id);

-- System can insert notifications (Authenticated users can trigger them via app logic)
DROP POLICY IF EXISTS "Authenticated users can trigger notifications" ON notifications;
CREATE POLICY "Authenticated users can trigger notifications"
    ON notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Users can update (mark as read) their own notifications
DROP POLICY IF EXISTS "Users can mark own notifications read" ON notifications;
CREATE POLICY "Users can mark own notifications read" 
    ON notifications FOR UPDATE 
    USING (auth.uid() = user_id);

-- 4. Fix Faculty Requests Policy (in case admin role is just 'admin' instead of 'osas_admin')
DROP POLICY IF EXISTS "Admins can view all faculty requests" ON faculty_requests;
CREATE POLICY "Admins can view all faculty requests" 
    ON faculty_requests FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('osas_admin', 'admin')
        )
    );

DROP POLICY IF EXISTS "Admins can update faculty requests" ON faculty_requests;
CREATE POLICY "Admins can update faculty requests" 
    ON faculty_requests FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('osas_admin', 'admin')
        )
    );

COMMIT;



-- ============================================================
-- File: UPDATE_SCHEMA_V7.sql
-- ============================================================
-- ============================================
-- UPDATE_SCHEMA_V7.sql
-- Description: Registration Approval Flow Updates
-- ============================================

-- 1. Change the default of `is_active` to false for new users.
-- This ensures that when a new student leader registers, they cannot log in
-- until an admin manually approves (sets is_active to true) in the dashboard.
ALTER TABLE users ALTER COLUMN is_active SET DEFAULT false;



-- ============================================================
-- File: UPDATE_SCHEMA_V8.sql
-- ============================================================
-- ============================================================
-- UPDATE_SCHEMA_V8.sql
-- Fix: Add 'revision' as a valid event_proposals status value
-- Fix: Add RLS policy to allow inserting notifications
-- ============================================================

-- Drop existing status check constraints if any
ALTER TABLE event_proposals DROP CONSTRAINT IF EXISTS event_proposals_status_check;
ALTER TABLE event_proposals DROP CONSTRAINT IF EXISTS check_event_status;

-- Clean up any rogue data: forcefully reset any unknown status back to 'pending'
UPDATE event_proposals 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'approved', 'rejected', 'cancelled', 'revision');

-- Add updated constraint that includes 'revision'
ALTER TABLE event_proposals
  ADD CONSTRAINT event_proposals_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'revision'));

-- Fix RLS for notifications so the admin app can insert them
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON notifications;
DROP POLICY IF EXISTS "Enable insert for all" ON notifications;

CREATE POLICY "Enable insert for all"
ON notifications
FOR INSERT
WITH CHECK (true);



-- ============================================================
-- File: UPDATE_SCHEMA_V9_KANBAN.sql
-- ============================================================
-- UPDATE_SCHEMA_V9_KANBAN.sql
-- Fix: Add 'completed' as a valid event_proposals status value
-- ============================================================

-- Drop existing status check constraints if any
ALTER TABLE event_proposals DROP CONSTRAINT IF EXISTS event_proposals_status_check;
ALTER TABLE event_proposals DROP CONSTRAINT IF EXISTS check_event_status;

-- Add updated constraint that includes 'completed'
ALTER TABLE event_proposals
  ADD CONSTRAINT event_proposals_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'revision', 'completed'));



-- ============================================================
-- File: UPDATE_SCHEMA_V10_REQUIREMENTS.sql
-- ============================================================
-- V10: Adding Organization Repository, Seeding Compliance Requirements, and Event Documents

-- 1. Drop check constraint on deadline_type if it exists to allow new values
ALTER TABLE public.compliance_requirements DROP CONSTRAINT IF EXISTS compliance_requirements_deadline_type_check;

-- 1b. Ensure organization_compliance has notes and updated_at columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organization_compliance' AND column_name='notes') THEN
        ALTER TABLE public.organization_compliance ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='organization_compliance' AND column_name='updated_at') THEN
        ALTER TABLE public.organization_compliance ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
    END IF;
END $$;

-- 1c. Seed compliance_requirements
INSERT INTO public.compliance_requirements (name, description, deadline_type)
SELECT * FROM (VALUES
  ('Constitution and By-Laws', 'Submit the latest Constitution and By-Laws of the organization.', '1st Semester'),
  ('Organization Officers List', 'Complete list of all current officers with their positions and contact information.', '1st Semester'),
  ('Members List', 'Complete list of all registered members of the organization.', '1st Semester'),
  ('Annual Plan of Activities', 'Proposed plan of activities and events for the entire academic year.', '1st Semester'),
  ('Organization Profile', 'General profile and history of the organization.', '1st Semester'),
  ('Adviser Acceptance/Designation', 'Signed acceptance letter or designation form of the organization adviser.', '1st Semester'),
  ('Accreditation Application Form', 'Official accreditation application form for the academic year.', '1st Semester'),
  ('Event Requirements', 'General requirements for major events.', 'Per Event')
) AS v(name, description, deadline_type)
WHERE NOT EXISTS (
  SELECT 1 FROM public.compliance_requirements cr WHERE cr.name = v.name
);

-- 2. Create organization_repository table
CREATE TABLE IF NOT EXISTS public.organization_repository (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    document_type VARCHAR(255) NOT NULL, -- Constitution and By-Laws, Resolutions, Meeting Minutes, Financial Reports, Other
    title VARCHAR(255) NOT NULL,
    document_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- RLS for organization_repository
ALTER TABLE public.organization_repository ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Repository viewable by everyone" ON public.organization_repository;
CREATE POLICY "Repository viewable by everyone" ON public.organization_repository
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Repository insertable by authenticated users" ON public.organization_repository;
CREATE POLICY "Repository insertable by authenticated users" ON public.organization_repository
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Repository updatable by authenticated users" ON public.organization_repository;
CREATE POLICY "Repository updatable by authenticated users" ON public.organization_repository
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Repository deletable by authenticated users" ON public.organization_repository;
CREATE POLICY "Repository deletable by authenticated users" ON public.organization_repository
    FOR DELETE USING (auth.role() = 'authenticated');

-- 3. We will reuse event_attachments for pre-event and post-event documents.
-- If we need to classify them, we can add a document_type or category column to event_attachments.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='event_attachments' AND column_name='category') THEN
        ALTER TABLE public.event_attachments ADD COLUMN category VARCHAR(50) DEFAULT 'proposal';
    END IF;
END $$;

-- 4. Create compliance_documents storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('compliance_documents', 'compliance_documents', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Add Storage Policies for compliance_documents
DROP POLICY IF EXISTS "Give public access to compliance_documents" ON storage.objects;
CREATE POLICY "Give public access to compliance_documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'compliance_documents');

DROP POLICY IF EXISTS "Allow authenticated uploads to compliance_documents" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to compliance_documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'compliance_documents' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated updates to compliance_documents" ON storage.objects;
CREATE POLICY "Allow authenticated updates to compliance_documents" ON storage.objects
    FOR UPDATE USING (bucket_id = 'compliance_documents' AND auth.role() = 'authenticated');

-- 6. Ensure RLS allows organization_compliance inserts
ALTER TABLE public.organization_compliance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.organization_compliance;
CREATE POLICY "Enable insert for authenticated users only" ON public.organization_compliance
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.organization_compliance;
CREATE POLICY "Enable update for authenticated users only" ON public.organization_compliance
    FOR UPDATE USING (auth.role() = 'authenticated');



-- ============================================================
-- File: UPDATE_SCHEMA_AI_CHATS.sql
-- ============================================================
-- ============================================================
-- STUDENT NEXUS - Schema Patch for AI Chats (Fixes 403 Error)
-- Run in: Supabase SQL Editor
-- ============================================================

BEGIN;

-- 1. Create the ai_chats table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
    message TEXT NOT NULL,
    component_type TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow users to read their own chat history
CREATE POLICY "Users can view their own AI chats"
ON ai_chats
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own chat messages
CREATE POLICY "Users can insert their own AI chats"
ON ai_chats
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

COMMIT;


-- ============================================================
-- File: UPDATE_SCHEMA_V12_AI_SESSIONS.sql
-- ============================================================
-- STUDENT NEXUS - Schema Patch v12: Upgrade ai_chats for Per-Session Storage
-- Each open of the AI drawer = ONE row in ai_chats (not one row per message)
-- Run in: Supabase SQL Editor
-- ============================================================

BEGIN;

-- Add new columns to support session-based storage
ALTER TABLE ai_chats
  ADD COLUMN IF NOT EXISTS session_id UUID UNIQUE DEFAULT uuid_generate_v4(),
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS messages JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Allow UPSERT (UPDATE) on the ai_chats table so we can update the session row
DROP POLICY IF EXISTS "Users can update their own AI chats" ON ai_chats;
CREATE POLICY "Users can update their own AI chats"
ON ai_chats
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Index for fast session lookups by user
CREATE INDEX IF NOT EXISTS idx_ai_chats_session_id ON ai_chats(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chats_user_updated ON ai_chats(user_id, updated_at DESC);

COMMIT;

-- File: UPDATE_SCHEMA_V11_ADMIN_TASKS.sql
-- ============================================================
-- ============================================================
-- STUDENT NEXUS - Schema Patch for Admin Tasks (Kanban Fix)
-- Run in: Supabase SQL Editor
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS admin_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignee VARCHAR(100),
    due_date DATE,
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'cancelled', -- pending, approved, rejected, cancelled, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;

-- Allow ONLY osas_admin to view, insert, update, and delete
CREATE POLICY "Admin tasks viewable by admins only" ON admin_tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('osas_admin', 'admin', 'superadmin')
        )
    );

CREATE POLICY "Admin tasks insertable by admins only" ON admin_tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('osas_admin', 'admin', 'superadmin')
        )
    );

CREATE POLICY "Admin tasks updatable by admins only" ON admin_tasks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('osas_admin', 'admin', 'superadmin')
        )
    );

CREATE POLICY "Admin tasks deletable by admins only" ON admin_tasks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('osas_admin', 'admin', 'superadmin')
        )
    );

COMMIT;



