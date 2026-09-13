import { supabase } from '../config/supabase';
import { secureUploadDocument } from '../config/security';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export const authAPI = {
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  signUp: async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: userData },
    });
    return { data, error };
  },

  signOut: async () => { const { error } = await supabase.auth.signOut(); return { error }; },
  getSession: async () => { const { data, error } = await supabase.auth.getSession(); return { data, error }; },
  getCurrentUser: async () => { const { data, error } = await supabase.auth.getUser(); return { data, error }; },
};

export const facultyAPI = {
  createRequest: async (userId, title, description, documentUrl) => {
    const { data, error } = await supabase
      .from('faculty_requests')
      .insert({
        user_id: userId,
        title,
        description,
        document_url: documentUrl,
        status: 'pending',
      })
      .select()
      .single();
    return { data, error };
  },

  getRequests: async (userId) => {
    const { data, error } = await supabase
      .from('faculty_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  }
};

export const userAPI = {
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, student_id, contact_number, profile_picture_url, is_active, created_at, last_login')
      .eq('id', userId)
      .maybeSingle();
    return { data, error };
  },

  updateProfile: async (userId, updates) => {

    const allowed = ['full_name', 'contact_number', 'profile_picture_url'];
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );
    const { data, error } = await supabase
      .from('users')
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, email, full_name, role, student_id, contact_number, profile_picture_url')
      .maybeSingle();
    return { data, error };
  },

  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, is_active')
      .eq('is_active', true)
      .order('full_name', { ascending: true });
    return { data, error };
  },

  getUserOrganizations: async (userId) => {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        id, position, joined_at, is_active,
        organization:organizations(id, name, acronym, accreditation_status, compliance_rate)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);
    return { data, error };
  },
};

export const eventAPI = {
  getEventsByUser: async (userId) => {
    if (!userId) return { data: [], error: null };
    
    // Get user's organizations first
    const { data: userOrgs } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .eq('is_active', true);
      
    const orgIds = userOrgs?.map(o => o.organization_id) || [];
    const orgFilter = orgIds.length > 0 ? `,organization_id.in.(${orgIds.join(',')})` : '';
    
    const { data, error } = await supabase
      .from('event_proposals')
      .select('id, title, description, event_date, event_time_start, event_time_end, venue, status, created_at, organization_id')
      .or(`submitted_by.eq.${userId}${orgFilter}`)
      .order('event_date', { ascending: false });
    return { data: data?.map(e => ({ ...e, proposal_id: e.id })) || [], error };
  },

  getEventsByStatus: async (status) => {
    const { data, error } = await supabase
      .from('event_proposals')
      .select('id, title, description, event_date, event_time_start, event_time_end, venue, status, organization_id')
      .eq('status', status)
      .order('event_date', { ascending: true });
    return { data: data?.map(e => ({ ...e, proposal_id: e.id })) || [], error };
  },

  getAllEvents: async () => {
    const { data, error } = await supabase
      .from('event_proposals')
      .select(`
        id, title, description, event_date, event_time_start, event_time_end,
        venue, status, expected_attendees, budget_amount, created_at,
        organization:organizations(id, name, acronym)
      `)
      .order('event_date', { ascending: false });
    return { data: data?.map(e => ({ ...e, proposal_id: e.id })) || [], error };
  },

  getEventById: async (eventId) => {
    const { data, error } = await supabase
      .from('event_proposals')
      .select(`
        *,
        organization:organizations(id, name, acronym),
        submitter:users!event_proposals_submitted_by_fkey(full_name, email)
      `)
      .eq('id', eventId)
      .single();
    return { data, error };
  },

  getEventAttachments: async (eventId) => {
    const { data, error } = await supabase
      .from('event_attachments')
      .select('*')
      .eq('event_id', eventId);
    return { data, error };
  },

  updateEvent: async (eventId, eventData) => {
    const { data, error } = await supabase
      .from('event_proposals')
      .update({ ...eventData, updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select()
      .single();
    return { data, error };
  },

  createEvent: async (eventData) => {
    const { data, error } = await supabase
      .from('event_proposals')
      .insert([{
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.event_date,
        event_time_start: eventData.event_time_start || null,
        event_time_end: eventData.event_time_end || null,
        venue: eventData.venue || null,
        expected_attendees: eventData.expected_attendees || null,
        budget_amount: eventData.budget_amount || null,
        organization_id: eventData.organization_id || null,
        submitted_by: eventData.submitted_by,
        status: 'pending',
      }])
      .select()
      .single();
    return { data, error };
  },



  deleteEvent: async (proposalId) => {
    const { error } = await supabase
      .from('event_proposals')
      .delete()
      .eq('id', proposalId);
    return { error };
  },

  checkEventConflict: async (eventDate, venue) => {
    const { data, error } = await supabase
      .from('event_proposals')
      .select('id, title, status')
      .eq('event_date', eventDate)
      .eq('venue', venue)
      .in('status', ['pending', 'approved']);
    return { conflict: data && data.length > 0, conflictData: data || [], error };
  },

  uploadEventAttachment: async (eventId, fileUri, fileName, mimeType, userId, category = 'proposal') => {
    try {
      const ext = (fileName.split('.').pop() || 'pdf').toLowerCase();
      const mime = mimeType || (
        ext === 'pdf' ? 'application/pdf' :
        ext === 'png' ? 'image/png' :
        ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
        'application/octet-stream'
      );

      const folderPath = `${eventId}/${Date.now()}_${fileName}`;
      
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
      const arrayBuffer = decode(base64);

      const { data: storageData, error: uploadError } = await supabase.storage
        .from('event_attachments')
        .upload(folderPath, arrayBuffer, {
          contentType: mime,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('event_attachments')
        .getPublicUrl(folderPath);
      const url = urlData.publicUrl;

      const { error: insertErr } = await supabase
        .from('event_attachments')
        .insert({
          event_id:    eventId,
          file_name:   fileName,
          file_url:    url,
          file_type:   mime,
          uploaded_by: userId,
          uploaded_at: new Date().toISOString(),
          category:    category,
        });
      if (insertErr) console.warn('event_attachments insert error:', insertErr.message);

      if (category === 'proposal') {
        await supabase
          .from('event_proposals')
          .update({ file_name: fileName, file_url: url, file_type: mime })
          .eq('id', eventId);
      }

      return { error: null };
    } catch (error) {
      console.error('uploadEventAttachment error:', error);
      return { error };
    }
  },
};

export const organizationAPI = {
  checkPositionAvailability: async (orgId, position) => {
    if (position === 'Member') return { available: true };
    const { data, error } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('position', position)
      .limit(1);
    if (error) return { available: false, error };
    return { available: data.length === 0 };
  },
  getAllOrganizations: async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, acronym, description, accreditation_status, compliance_rate, logo_url, background_image_url, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });
    return {
      data: data?.map(o => ({ ...o, org_id: o.id, org_name: o.name })) || [],
      error,
    };
  },

  getOrganization: async (orgId) => {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        id, name, acronym, description, mission, vision, background, advisor_name, accreditation_status, compliance_rate, logo_url, background_image_url, president_id,
        president:users!organizations_president_id_fkey(full_name, email),
        advisor:users!organizations_advisor_id_fkey(full_name, email)
      `)
      .eq('id', orgId)
      .maybeSingle();
    return { data, error };
  },

  updateOrganizationDetails: async (orgId, updates) => {
    const allowed = ['mission', 'vision', 'background', 'advisor_name'];
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );
    const { data, error } = await supabase
      .from('organizations')
      .update(safeUpdates)
      .eq('id', orgId)
      .select()
      .single();
    return { data, error };
  },

  uploadOrganizationLogo: async (orgId, fileUri, fileName, mimeType) => {
    try {
      const ext = (fileName.split('.').pop() || 'png').toLowerCase();
      const mime = mimeType || (
        ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
        ext === 'png' ? 'image/png' :
        'application/octet-stream'
      );
      
      const folderPath = `logos/${orgId}_${Date.now()}.${ext}`;
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
      const arrayBuffer = decode(base64);

      const { data: storageData, error: storageError } = await supabase.storage
        .from('organizations')
        .upload(folderPath, arrayBuffer, {
          contentType: mime,
          upsert: true,
        });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage
        .from('organizations')
        .getPublicUrl(folderPath);

      // Update the organization record with the new logo URL
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', orgId);

      return { publicUrl: urlData.publicUrl, error: updateError };
    } catch (error) {
      console.warn('uploadOrganizationLogo error:', error);
      return { publicUrl: null, error };
    }
  },

  uploadOrganizationBackground: async (orgId, fileUri, fileName, mimeType) => {
    try {
      const ext = (fileName.split('.').pop() || 'png').toLowerCase();
      const mime = mimeType || (
        ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
        ext === 'png' ? 'image/png' :
        'application/octet-stream'
      );
      
      const folderPath = `backgrounds/${orgId}_${Date.now()}.${ext}`;
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
      const arrayBuffer = decode(base64);

      const { data: storageData, error: storageError } = await supabase.storage
        .from('organizations')
        .upload(folderPath, arrayBuffer, {
          contentType: mime,
          upsert: true,
        });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage
        .from('organizations')
        .getPublicUrl(folderPath);

      const { error: updateError } = await supabase
        .from('organizations')
        .update({ background_image_url: urlData.publicUrl })
        .eq('id', orgId);

      return { publicUrl: urlData.publicUrl, error: updateError };
    } catch (error) {
      console.warn('uploadOrganizationBackground error:', error);
      return { publicUrl: null, error };
    }
  },


  getLeaderOrganizations: async (userId) => {
    const { data, error } = await supabase
      .from('organization_members')
      .select('organization:organizations(id, name, acronym)')
      .eq('user_id', userId)
      .in('position', ['President', 'Vice-President', 'Secretary', 'Treasurer', 'Auditor', 'Public Relations Officer'])
      .eq('is_active', true);
    // map it so it returns flat organizations array
    return { data: data?.map(d => d.organization) || [], error };
  },

  getOrgMembers: async (orgId) => {
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        id, position, joined_at, is_active,
        user:users(id, full_name, email, role)
      `)
      .eq('organization_id', orgId)
      .eq('is_active', true);
    return { data, error };
  },
};

export const portfolioAPI = {
  getStudentAchievements: async (userId) => {
    if (!userId) return { data: [], error: null };
    const { data, error } = await supabase
      .from('student_portfolios')
      .select(`
        id, user_id, organization_id, achievement_type, title,
        description, achievement_date, points, verified, created_at,
        file_url, file_name, file_type,
        organization:organizations(name, acronym)
      `)
      .eq('user_id', userId)
      .order('achievement_date', { ascending: false });
    return {
      data: data?.map(p => ({
        ...p,
        portfolio_id: p.id,
        cert_title: p.title,
        upload_date: p.achievement_date,
      })) || [],
      error,
    };
  },

  getUserPortfolio: async (userId) => portfolioAPI.getStudentAchievements(userId),

  addAchievement: async (achievementData) => {
    
    const { data, error } = await supabase
      .from('student_portfolios')
      .insert([{
        user_id: achievementData.user_id,
        organization_id: achievementData.organization_id || null,
        achievement_type: achievementData.achievement_type || null,
        title: achievementData.title,
        description: achievementData.description || null,
        achievement_date: achievementData.achievement_date || null,
        points: achievementData.points || 0,
        file_url: achievementData.file_url || null,
        file_name: achievementData.file_name || null,
        file_type: achievementData.file_type || null,
      }])
      .select()
      .single();
    return { data, error };
  },

  updateAchievement: async (achievementId, achievementData) => {
    const { data, error } = await supabase
      .from('student_portfolios')
      .update(achievementData)
      .eq('id', achievementId)
      .select()
      .single();
    return { data, error };
  },

  uploadPortfolioAttachment: async (fileUri, fileName, mimeType, userId) => {
    try {
      const ext = (fileName.split('.').pop() || 'pdf').toLowerCase();
      const mime = mimeType || (
        ext === 'pdf' ? 'application/pdf' :
        ext === 'png' ? 'image/png' :
        ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
        'application/octet-stream'
      );

      const folderPath = `${userId}/${Date.now()}_${fileName}`;
      
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
      const arrayBuffer = decode(base64);

      const { data: storageData, error: storageError } = await supabase.storage
        .from('portfolio_attachments')
        .upload(folderPath, arrayBuffer, {
          contentType: mime,
          upsert: true,
        });

      if (storageError) throw storageError;

      const { data: publicUrlData } = supabase.storage
        .from('portfolio_attachments')
        .getPublicUrl(folderPath);

      return { publicUrl: publicUrlData.publicUrl, error: null };
    } catch (error) {
      console.warn('uploadPortfolioAttachment error:', error);
      return { publicUrl: null, error };
    }
  },

  deleteAchievement: async (portfolioId) => {
    const { error } = await supabase
      .from('student_portfolios')
      .delete()
      .eq('id', portfolioId);
    return { error };
  },
};

export const messageAPI = {
  getConversations: async (userId) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id, subject, body, read, created_at, sender_id, recipient_id,
        sender:users!messages_sender_id_fkey(id, full_name, email),
        recipient:users!messages_recipient_id_fkey(id, full_name, email)
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getThread: async (userId, otherId) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id, subject, body, read, created_at, sender_id, recipient_id,
        sender:users!messages_sender_id_fkey(id, full_name, email)
      `)
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${otherId}),` +
        `and(sender_id.eq.${otherId},recipient_id.eq.${userId})`
      )
      .order('created_at', { ascending: true });
    return { data, error };
  },

  sendMessage: async (senderId, recipientId, body, subject = null) => {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id: senderId,
        recipient_id: recipientId,
        body,
        subject,
        read: false,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();
      
    
    if (!error && data) {
      await supabase.from('audit_logs').insert({
        action: 'Sent Message',
        entity_type: 'Message',
        entity_id: data.id,
        user_id: senderId
      });
    }

    return { data, error };
  },

  markAsRead: async (messageId) => {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', messageId);
    return { error };
  },

  markThreadAsRead: async (userId, senderId) => {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('sender_id', senderId);
    return { error };
  },

  getUnreadCount: async (userId) => {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);
    return { count: count || 0, error };
  },
};

export const notificationAPI = {
  getUserNotifications: async (userId) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, type, is_read, created_at, action_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    return { data: data || [], error };
  },

  markAsRead: async (notificationId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    return { error };
  },

  markAllAsRead: async (userId) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return { error };
  },

  getUnreadCount: async (userId) => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return { count: count || 0, error };
  },

  createNotification: async (userId, title, message, type = 'system', actionUrl = null) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ user_id: userId, title, message, type, action_url: actionUrl, is_read: false }])
      .select()
      .single();
    return { data, error };
  },

  notifyAdmins: async (message, type, additionalData = {}) => {
    // Fetch all admin user IDs
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .in('role', ['osas_admin', 'admin']);
    if (!admins || admins.length === 0) return { error: null };

    const payload = admins.map(admin => ({
      user_id: admin.id,
      title: message,
      message: JSON.stringify({ type, ...additionalData }),
      type,
      is_read: false,
    }));

    const { error } = await supabase.from('notifications').insert(payload);
    return { error };
  },

  getOfficialAnnouncements: async () => {
    const { data, error } = await supabase
      .from('official_announcements')
      .select(`
        id, title, content, created_at,
        organization:organizations(name, acronym)
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(10);
    return { data, error };
  },
};

export const dashboardAPI = {
  getUserStats: async (userId) => {
    if (!userId) return {
      data: { eventsCount: 0, achievementsCount: 0, unreadMessages: 0, unreadNotifications: 0 },
      error: null,
    };
    try {
      const [evRes, achRes, msgRes, ntfRes] = await Promise.allSettled([
        supabase
          .from('event_proposals')
          .select('*', { count: 'exact', head: true })
          .eq('submitted_by', userId),
        supabase
          .from('student_portfolios')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', userId)
          .eq('read', false),
        supabase
          .from('notification_queue')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('sent', false),
      ]);
      return {
        data: {
          eventsCount: evRes.value?.count || 0,
          achievementsCount: achRes.value?.count || 0,
          unreadMessages: msgRes.value?.count || 0,
          unreadNotifications: ntfRes.value?.count || 0,
        },
        error: null,
      };
    } catch (err) {
      console.error('Dashboard stats error:', err);
      return {
        data: { eventsCount: 0, achievementsCount: 0, unreadMessages: 0, unreadNotifications: 0 },
        error: err,
      };
    }
  },
};

export const orgAPI = {
  getMyOrganization: async (userId) => {
    // 1. Check if the user is explicitly a president or advisor
    let res = await supabase
      .from('organizations')
      .select('id, name, acronym, accreditation_status, compliance_rate')
      .or(`president_id.eq.${userId},advisor_id.eq.${userId}`)
      .maybeSingle();

    if (res.data) return res;

    // 2. Fallback to check if they are an active member/officer
    const memRes = await supabase
      .from('organization_members')
      .select('organization:organizations(id, name, acronym, accreditation_status, compliance_rate)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (memRes.data && memRes.data.organization) {
      return { data: memRes.data.organization, error: null };
    }

    return { data: null, error: res.error || memRes.error };
  },

  getComplianceRequirements: async (orgId) => {
    // Get the active semester first
    const { data: semData } = await supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .maybeSingle();

    // Get compliance requirements for the active semester (or all if no semester)
    let reqQuery = supabase.from('compliance_requirements').select('*').order('name');
    if (semData?.id) reqQuery = reqQuery.eq('semester_id', semData.id);
    const { data: reqs, error: reqErr } = await reqQuery;

    if (reqErr || !reqs) return { data: [], error: reqErr };

    // Get the org's current compliance records (filtered to active semester)
    let compQuery = supabase.from('organization_compliance').select('*').eq('organization_id', orgId);
    if (semData?.id) compQuery = compQuery.eq('semester_id', semData.id);
    const { data: records, error: recErr } = await compQuery;

    if (recErr) return { data: [], error: recErr };

    // Merge requirements with their submission status
    const merged = reqs.map(req => {
      const record = records?.find(r => r.requirement_id === req.id);
      return { ...req, record: record || null, status: record?.status || null };
    });

    return { data: merged, error: null };
  },


  submitComplianceDocument: async (orgId, requirementId, fileUri, fileName, mimeType) => {
    try {
      const ext = (fileName.split('.').pop() || 'pdf').toLowerCase();
      const mime = mimeType || (
        ext === 'pdf' ? 'application/pdf' :
        ext === 'png' ? 'image/png' :
        ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
        'application/octet-stream'
      );

      const folderPath = `compliance/${orgId}/${Date.now()}_${fileName}`;
      
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
      const arrayBuffer = decode(base64);

      const { data: storageData, error: storageError } = await supabase.storage
        .from('compliance_documents')
        .upload(folderPath, arrayBuffer, {
          contentType: mime,
          upsert: true,
        });

      if (storageError) throw storageError;

      const { data: publicUrlData } = supabase.storage
        .from('compliance_documents')
        .getPublicUrl(folderPath);
        
      const documentUrl = publicUrlData.publicUrl;

      // Check if a record already exists
      const { data: existing } = await supabase
        .from('organization_compliance')
        .select('id')
        .eq('organization_id', orgId)
        .eq('requirement_id', requirementId)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('organization_compliance')
          .update({ 
            status: 'pending', 
            document_url: documentUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        return { error };
      } else {
        // Insert
        const { error } = await supabase
          .from('organization_compliance')
          .insert({
            organization_id: orgId,
            requirement_id: requirementId,
            status: 'pending',
            document_url: documentUrl
          });
        return { error };
      }
    } catch (error) {
      console.warn('submitComplianceDocument error:', error);
      return { error };
    }
  },

  getRepositoryDocuments: async (orgId) => {
    const { data, error } = await supabase
      .from('organization_repository')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  uploadRepositoryDocument: async (orgId, fileUri, fileName, mimeType, documentType, title, userId) => {
    try {
      const ext = (fileName.split('.').pop() || 'pdf').toLowerCase();
      const mime = mimeType || (
        ext === 'pdf' ? 'application/pdf' :
        ext === 'png' ? 'image/png' :
        ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
        'application/octet-stream'
      );

      const folderPath = `repository/${orgId}/${Date.now()}_${fileName}`;
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });
      const arrayBuffer = decode(base64);

      const { error: storageError } = await supabase.storage
        .from('repository_documents')
        .upload(folderPath, arrayBuffer, { contentType: mime, upsert: true });

      if (storageError) throw storageError;

      const { data: urlData } = supabase.storage
        .from('repository_documents')
        .getPublicUrl(folderPath);

      const { error } = await supabase
        .from('organization_repository')
        .insert({
          organization_id: orgId,
          document_type: documentType,
          title: title || fileName,
          document_url: urlData.publicUrl,
          uploaded_by: userId,
        });

      return { error };
    } catch (error) {
      console.warn('uploadRepositoryDocument error:', error);
      return { error };
    }
  },

  deleteRepositoryDocument: async (docId) => {
    const { error } = await supabase
      .from('organization_repository')
      .delete()
      .eq('id', docId);
    return { error };
  },
};
