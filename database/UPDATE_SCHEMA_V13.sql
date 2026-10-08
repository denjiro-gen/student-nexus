-- ============================================================
-- STUDENT NEXUS - Schema Patch V13
-- Features: Event Approval Logs, Compliance Categories,
--           Compliance Version History, Profile Pictures,
--           New Office Roles (GSO, PSO, Supply, Venue, etc.)
-- Run in: Supabase SQL Editor
-- ============================================================

BEGIN;

-- ============================================================
-- 1. EVENT APPROVAL LOGS TABLE
-- Tracks per-office approval/rejection history for each event.
-- Every admin action on an event is recorded here.
-- ============================================================
CREATE TABLE IF NOT EXISTS event_approval_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES event_proposals(id) ON DELETE CASCADE,
    office_name VARCHAR(255) NOT NULL,          -- e.g., 'Supply Office', 'Academic Affairs Office', 'OSAS'
    action_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL,                -- 'approved', 'rejected', 'pending', 'noted', 'revision'
    remarks TEXT,                               -- Required for rejected/completed; optional otherwise
    actioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_approval_logs_event ON event_approval_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_event_approval_logs_user  ON event_approval_logs(action_by_user_id);

-- RLS for event_approval_logs
ALTER TABLE event_approval_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view (officers need to see their event history)
DROP POLICY IF EXISTS "Approval logs viewable by authenticated" ON event_approval_logs;
CREATE POLICY "Approval logs viewable by authenticated" ON event_approval_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins/offices can insert
DROP POLICY IF EXISTS "Approval logs insertable by admins" ON event_approval_logs;
CREATE POLICY "Approval logs insertable by admins" ON event_approval_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- ============================================================
-- 2. ADD CATEGORY TO COMPLIANCE REQUIREMENTS
-- Distinguishes Accreditation vs Clearance documents.
-- ============================================================
ALTER TABLE compliance_requirements
    ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'accreditation';
    -- Values: 'accreditation', 'clearance'

-- Update existing requirements: categorize by keyword
UPDATE compliance_requirements
    SET category = 'accreditation'
    WHERE name ILIKE ANY (ARRAY[
        '%constitution%', '%by-laws%', '%officer%', '%members list%',
        '%annual plan%', '%profile%', '%adviser%', '%accreditation%'
    ]);

UPDATE compliance_requirements
    SET category = 'clearance'
    WHERE name ILIKE ANY (ARRAY[
        '%clearance%', '%financial%', '%audit%', '%liquidation%',
        '%accountability%', '%property%', '%return%'
    ]);

-- Seed clearance requirements if none exist
INSERT INTO compliance_requirements (name, description, deadline_type, category)
SELECT * FROM (VALUES
    ('Financial Liquidation Report', 'Complete financial liquidation report for all activities conducted during the semester.', 'End of Semester', 'clearance'),
    ('Property Accountability Form', 'Signed accountability form for all equipment and properties borrowed from OSAS or Supply Office.', 'End of Semester', 'clearance'),
    ('Organization Clearance Form', 'Signed clearance form from all required offices (OSAS, Supply, Venue, Academic Affairs).', 'End of Semester', 'clearance'),
    ('Post-Event Reports (All Events)', 'Compiled post-event narrative and financial reports for all conducted events.', 'End of Semester', 'clearance'),
    ('Final Audit Report', 'Audited financial report signed by the organization auditor and adviser.', 'End of Semester', 'clearance')
) AS v(name, description, deadline_type, category)
WHERE NOT EXISTS (
    SELECT 1 FROM compliance_requirements cr WHERE cr.name = v.name
);


-- ============================================================
-- 3. UPGRADE ORGANIZATION_COMPLIANCE TABLE
-- Add uploaded_by, updated_by, version_history for full audit trail.
-- ============================================================
ALTER TABLE organization_compliance
    ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS category    VARCHAR(50) DEFAULT 'accreditation',
    ADD COLUMN IF NOT EXISTS version_history JSONB DEFAULT '[]'::jsonb;
    -- version_history format: [{ version: 1, uploaded_by_name: "...", uploaded_by_id: "...", document_url: "...", action: "upload"|"update", actioned_at: "ISO_DATE" }]

-- Create index for faster org+category queries
CREATE INDEX IF NOT EXISTS idx_org_compliance_org_cat ON organization_compliance(organization_id, category);


-- ============================================================
-- 4. PROFILE PICTURES STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

UPDATE storage.buckets SET public = true WHERE id = 'profile-pictures';

DROP POLICY IF EXISTS "Profile pictures public read" ON storage.objects;
CREATE POLICY "Profile pictures public read" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-pictures');

DROP POLICY IF EXISTS "Profile pictures authenticated upload" ON storage.objects;
CREATE POLICY "Profile pictures authenticated upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Profile pictures authenticated update" ON storage.objects;
CREATE POLICY "Profile pictures authenticated update" ON storage.objects
    FOR UPDATE USING (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Profile pictures authenticated delete" ON storage.objects;
CREATE POLICY "Profile pictures authenticated delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'profile-pictures' AND auth.role() = 'authenticated');


-- ============================================================
-- 5. NEW ROLES — GSO, PSO, SUPPLY, VENUE, ADMIN_ASSISTANT
-- ============================================================

-- Drop old role check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_user_role;
ALTER TABLE users DROP CONSTRAINT IF EXISTS user_role_check;

-- Drop any dynamically named role constraints
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
    END LOOP;
END;
$$;

-- Add updated constraint with all new roles
ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN (
        'osas_admin',
        'student_leader',
        'student',
        'advisor',
        'faculty',
        'gso',
        'pso',
        'supply',
        'venue',
        'academic_affairs',
        'admin_assistant'
    ));


-- ============================================================
-- 6. ADD office_name COLUMN TO USERS TABLE
-- So each office user can have a display office name.
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS office_name VARCHAR(255);


-- ============================================================
-- 7. CALENDAR EVENTS VIEW (convenience)
-- Makes it easy to query all calendar-visible events.
-- ============================================================
CREATE OR REPLACE VIEW public.calendar_events AS
SELECT
    ep.id,
    ep.title,
    ep.event_date,
    ep.event_time_start,
    ep.event_time_end,
    ep.venue,
    ep.status,
    ep.description,
    ep.expected_attendees,
    ep.created_at,
    o.id   AS organization_id,
    o.name AS organization_name,
    o.acronym AS organization_acronym,
    u.full_name AS submitted_by_name
FROM event_proposals ep
LEFT JOIN organizations o ON o.id = ep.organization_id
LEFT JOIN users u ON u.id = ep.submitted_by
WHERE ep.status IN ('approved', 'pending', 'completed');

GRANT SELECT ON public.calendar_events TO authenticated;
GRANT SELECT ON public.calendar_events TO anon;

COMMIT;
