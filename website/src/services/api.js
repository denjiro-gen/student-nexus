import { supabase } from '../config/supabase';

export const api = {
  getApprovedEvents: async () => {
    const { data, error } = await supabase
      .from('event_proposals')
      .select(`
        id, title, description, event_date, event_time_start, event_time_end, venue, expected_attendees, status, created_at,
        organization:organizations(id, name, acronym, logo_url)
      `)
      .eq('status', 'approved')
      .order('event_date', { ascending: true });
    return { data: data || [], error };
  },
  
  getOrganization: async (id) => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  getOrganizationEvents: async (id) => {
    const { data, error } = await supabase
      .from('event_proposals')
      .select(`
        id, title, description, event_date, event_time_start, event_time_end, venue, expected_attendees, status, created_at,
        organization:organizations(id, name, acronym, logo_url)
      `)
      .eq('status', 'approved')
      .eq('organization_id', id)
      .order('event_date', { ascending: false });
    return { data: data || [], error };
  },

  getEvent: async (id) => {
    const { data, error } = await supabase
      .from('event_proposals')
      .select(`
        id, title, description, event_date, event_time_start, event_time_end, venue, expected_attendees, status, created_at,
        organization:organizations(id, name, acronym, logo_url)
      `)
      .eq('id', id)
      .single();
    return { data, error };
  },

  getOrganizationMembers: async (id) => {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        id, position, is_active,
        user:users(id, full_name, email, profile_picture_url)
      `)
      .eq('organization_id', id)
      .eq('is_active', true)
      .order('position', { ascending: true }); // We might want to sort by position hierarchy later
    return { data: data || [], error };
  },
};
