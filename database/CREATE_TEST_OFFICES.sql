-- ============================================================
-- SQL SCRIPT: CREATE TEST ACCOUNTS FOR NEW ROLES
-- Run this in your Supabase SQL Editor
-- This bypasses the email rate limit exceeded error!
-- ============================================================

-- Replace these variables if you want a different password
-- Default Password: password123 (encrypted below)

-- 1. Insert GSO
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gso@school.edu', crypt('password123', gen_salt('bf')), now(), NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "GSO Office", "role": "gso"}', now(), now(), '', '', '', '')
ON CONFLICT (email) DO NOTHING;

-- 2. Insert PSO
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pso@school.edu', crypt('password123', gen_salt('bf')), now(), NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "PSO Office", "role": "pso"}', now(), now(), '', '', '', '')
ON CONFLICT (email) DO NOTHING;

-- 3. Insert Supply
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'supply@school.edu', crypt('password123', gen_salt('bf')), now(), NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Supply Office", "role": "supply"}', now(), now(), '', '', '', '')
ON CONFLICT (email) DO NOTHING;

-- 4. Insert Venue
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'venue@school.edu', crypt('password123', gen_salt('bf')), now(), NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Venue Office", "role": "venue"}', now(), now(), '', '', '', '')
ON CONFLICT (email) DO NOTHING;

-- 5. Insert Admin Assistant
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (uuid_generate_v4(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin_assistant@school.edu', crypt('password123', gen_salt('bf')), now(), NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"full_name": "Admin Assistant", "role": "admin_assistant"}', now(), now(), '', '', '', '')
ON CONFLICT (email) DO NOTHING;

-- Wait a moment to ensure triggers sync to the public.users table, then update the roles to be absolutely sure.
UPDATE public.users SET role = 'gso', office_name = 'General Services Office' WHERE email = 'gso@school.edu';
UPDATE public.users SET role = 'pso', office_name = 'Physical Sports Office' WHERE email = 'pso@school.edu';
UPDATE public.users SET role = 'supply', office_name = 'Supply Office' WHERE email = 'supply@school.edu';
UPDATE public.users SET role = 'venue', office_name = 'Venue Management Office' WHERE email = 'venue@school.edu';
UPDATE public.users SET role = 'admin_assistant', office_name = 'Admin Assistant Office' WHERE email = 'admin_assistant@school.edu';

