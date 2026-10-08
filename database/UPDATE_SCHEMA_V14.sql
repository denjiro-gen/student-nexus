-- ============================================================
-- Student Nexus - Schema Patch V14
-- Critical Fixes:
-- 1. Auth sync trigger (auto-create public.users on auth signup)
-- 2. Unique compliance constraint (prevent org duplicates)
-- 3. Compliance `notes` column (admin feedback field)
-- 4. Event proposals `notes` column (public submission context)
-- Run in: Supabase SQL Editor
-- ============================================================

BEGIN;

-- ============================================================
-- 1. AUTO-SYNC TRIGGER: auth.users -> public.users
-- Ensures every Supabase Auth account gets a matching public
-- profile row automatically, preventing 406 login errors.
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (
    id, email, full_name, role, password_hash, is_active, created_at, updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    'SUPABASE_AUTH_MANAGED',
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================
-- 2. COMPLIANCE NOTES COLUMN (admin feedback)
-- ============================================================
ALTER TABLE organization_compliance
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================
-- 3. EVENT PROPOSALS NOTES COLUMN (public submission context)
-- ============================================================
ALTER TABLE event_proposals
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================
-- 4. UNIQUE CONSTRAINT: prevent duplicate org compliance per requirement
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_org_compliance_req'
  ) THEN
    ALTER TABLE organization_compliance
      ADD CONSTRAINT unique_org_compliance_req
      UNIQUE (organization_id, requirement_id);
  END IF;
END $$;

-- ============================================================
-- 5. ORGANIZATIONS: ensure social link columns exist
-- ============================================================
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS description TEXT;

-- ============================================================
-- 6. Update RLS: office roles can read event_proposals
-- ============================================================
DROP POLICY IF EXISTS "Office roles can read events" ON event_proposals;
CREATE POLICY "Office roles can read events" ON event_proposals
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- 7. Allow public (anon) to INSERT event_proposals
-- (for public web form submissions)
-- ============================================================
DROP POLICY IF EXISTS "Public can submit event proposals" ON event_proposals;
CREATE POLICY "Public can submit event proposals" ON event_proposals
  FOR INSERT WITH CHECK (status = 'pending');

-- ============================================================
-- 8. Allow public (anon) to INSERT contact_messages
-- (for venue request and accreditation form submissions)
-- ============================================================
DROP POLICY IF EXISTS "Public can submit contact messages" ON contact_messages;
CREATE POLICY "Public can submit contact messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

COMMIT;
