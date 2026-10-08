// Admin API Service
import { supabase } from '../config/supabase';
import { computeFileHash } from '../config/security';

const today = () => new Date().toISOString().split('T')[0];

export const adminAPI = {


  getDashboardStats: async () => {
    try {
      const [due, inProc, pending, completed, totalUsers, totalOrgs] =
        await Promise.allSettled([
          supabase
            .from('event_proposals')
            .select('*', { count: 'exact', head: true })
            .eq('event_date', today()),
          supabase
            .from('event_proposals')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'approved'),
          supabase
            .from('event_proposals')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending'),
          supabase
            .from('event_proposals')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed'),
          supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true),
          supabase
            .from('organizations')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true),
        ]);

      return {
        data: {
          dueToday: due.value?.count ?? 0,
          inProgress: inProc.value?.count ?? 0,
          pendingReview: pending.value?.count ?? 0,
          completed: completed.value?.count ?? 0,
          totalUsers: totalUsers.value?.count ?? 0,
          totalOrgs: totalOrgs.value?.count ?? 0,
        },
        error: null,
      };
    } catch (err) {
      console.error('Dashboard Stats Error:', err);
      return {
        data: { dueToday: 0, inProgress: 0, pendingReview: 0, completed: 0, totalUsers: 0, totalOrgs: 0 },
        error: err,
      };
    }
  },


  getRecentEvents: async (limit = 5) => {
    const { data, error } = await supabase
      .from('event_proposals')
      .select(`
        id, title, status, event_date, created_at,
        organization:organizations(name, acronym)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  getCalendarEvents: async (year, month) => {
    // Create end date to get last day of month
    const endDate = new Date(year, month + 1, 0);
    // Format to YYYY-MM-DD to match Supabase DATE column (assuming event_date is DATE)
    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('event_proposals')
      .select('id, title, event_date, status')
      .gte('event_date', startStr)
      .lte('event_date', endStr);
    return { data, error };
  },



  getEventProposals: async () => {
    const { data, error } = await supabase
      .from('event_proposals')
      .select(`
        *,
        organization:organizations(id, name, acronym),
        submitter:users!event_proposals_submitted_by_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // ==========================================
  // ADMIN TASKS (Kanban)
  // ==========================================
  getAdminTasks: async () => {
    const { data, error } = await supabase
      .from('admin_tasks')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createAdminTask: async (task) => {
    const { data, error } = await supabase
      .from('admin_tasks')
      .insert([task])
      .select()
      .single();
    return { data, error };
  },

  updateAdminTaskStatus: async (taskId, status) => {
    const { data, error } = await supabase
      .from('admin_tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();
    return { data, error };
  },


  getEventById: async (id) => {
    const { data, error } = await supabase
      .from('event_proposals')
      .select(`
        *,
        organization:organizations(id, name, acronym, email),
        submitter:users(full_name, email)
      `)
      .eq('id', id)
      .single();
    return { data, error };
  },


  deleteEventProposal: async (eventId) => {
    const { error } = await supabase
      .from('event_proposals')
      .delete()
      .eq('id', eventId);
    return { error };
  },

  updateEventStatus: async (eventId, status, reviewNotes = null, officeName = 'OSAS') => {
    const updates = {
      status,
      updated_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
    };
    if (reviewNotes) updates.review_notes = reviewNotes;

    const { data, error } = await supabase
      .from('event_proposals')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();

    if (data && !error) {
      try {
        await adminAPI.logAction('UPDATE_EVENT_STATUS', 'event_proposal', eventId, null, { status, reviewNotes });
      } catch (logErr) { }

      // ── Write to event_approval_logs for full audit trail ──
      try {
        const { data: { user: adminUser } } = await supabase.auth.getUser();
        // Determine the office name: use provided officeName, or fall back to user's office_name, or 'OSAS'
        let resolvedOfficeName = officeName;
        if (adminUser) {
          const { data: adminProfile } = await supabase
            .from('users')
            .select('office_name, role')
            .eq('id', adminUser.id)
            .maybeSingle();
          if (adminProfile?.office_name) resolvedOfficeName = adminProfile.office_name;
          else if (adminProfile?.role === 'osas_admin') resolvedOfficeName = 'OSAS';
        }
        await supabase.from('event_approval_logs').insert({
          event_id:          eventId,
          office_name:       resolvedOfficeName,
          action_by_user_id: adminUser?.id || null,
          status,
          remarks:           reviewNotes || null,
          actioned_at:       new Date().toISOString(),
        });
      } catch (logErr) {
        console.warn('event_approval_logs insert failed (non-fatal):', logErr);
      }

      if (data.submitted_by) {
        try {
          const { data: { user: adminUser } } = await supabase.auth.getUser();

          let title = 'Event Proposal Updated';
          let body = `Your event proposal "${data.title}" status has been updated to: ${status}.`;

          if (reviewNotes) {
            body += `\n\nAdmin Message: ${reviewNotes}`;

            if (adminUser) {
              await adminAPI.sendMessage(adminUser.id, data.submitted_by, `Update on "${data.title}" (${status}):\n${reviewNotes}`);
            }
          }

          await adminAPI.sendNotification(data.submitted_by, title, body, 'event_update');

          const { data: userData } = await supabase.from('users').select('expo_push_token').eq('id', data.submitted_by).single();

          if (userData?.expo_push_token) {
            if (window.api?.sendPushNotification) {
              await window.api.sendPushNotification(userData.expo_push_token, title, body, { type: 'event_update' });
            }
          }
        } catch (notifErr) {
          console.warn('Notification failed (non-fatal):', notifErr);
        }
      }
    }

    return { data, error };
  },

  // Get full approval history for an event (multi-office trail)
  getEventApprovalHistory: async (eventId) => {
    const { data, error } = await supabase
      .from('event_approval_logs')
      .select(`
        id, office_name, status, remarks, actioned_at,
        action_by:users!event_approval_logs_action_by_user_id_fkey(full_name, role, office_name)
      `)
      .eq('event_id', eventId)
      .order('actioned_at', { ascending: true });
    return { data: data || [], error };
  },

  // Compliance — get list by category
  getComplianceByCategory: async (category = null) => {
    let query = supabase
      .from('organization_compliance')
      .select(`
        *,
        organization:organizations(name, acronym),
        requirement:compliance_requirements(name, description, deadline_type, category),
        uploader:users!organization_compliance_uploaded_by_fkey(full_name),
        updater:users!organization_compliance_updated_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false });
    if (category) {
      // Filter by requirement category via join
      query = supabase
        .from('organization_compliance')
        .select(`
          *,
          organization:organizations(name, acronym),
          requirement:compliance_requirements!inner(name, description, deadline_type, category),
          uploader:users!organization_compliance_uploaded_by_fkey(full_name),
          updater:users!organization_compliance_updated_by_fkey(full_name)
        `)
        .eq('requirement.category', category)
        .order('created_at', { ascending: false });
    }
    const { data, error } = await query;
    return { data: data || [], error };
  },


  getOrganizations: async () => {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        president:users!organizations_president_id_fkey(full_name, email),
        advisor:users!organizations_advisor_id_fkey(full_name, email),
        members:organization_members(count),
        events:event_proposals(count)
      `)
      .order('name');
    return { data, error };
  },


  getUsers: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, is_active, created_at, student_id, last_login')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  updateUserStatus: async (userId, isActive) => {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },



  getComplianceList: async () => {
    const { data, error } = await supabase
      .from('organization_compliance')
      .select(`
        *,
        organization:organizations(name, acronym),
        requirement:compliance_requirements(name, description, deadline_type)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  updateComplianceStatus: async (id, status, notes = '') => {
    const updatePayload = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (notes && notes.trim()) {
      updatePayload.notes = notes.trim();
    }

    const { data, error } = await supabase
      .from('organization_compliance')
      .update(updatePayload)
      .eq('id', id)
      .select('*, organization:organizations(name, acronym), requirement:compliance_requirements(name, category)')
      .single();

    if (data && !error) {
      // Notify all active officers of the organization, not just president
      const { data: memberRows } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', data.organization_id)
        .eq('is_active', true);

      const { data: orgData } = await supabase
        .from('organizations')
        .select('president_id, advisor_id')
        .eq('id', data.organization_id)
        .single();

      const officerIds = new Set();
      if (orgData?.president_id) officerIds.add(orgData.president_id);
      if (orgData?.advisor_id)   officerIds.add(orgData.advisor_id);
      memberRows?.forEach(m => officerIds.add(m.user_id));

      const reqCategory = data.requirement?.category || 'compliance';
      const reqName     = data.requirement?.name || 'document';
      const orgName     = data.organization?.name || 'your organization';

      let title = 'Compliance Status Updated';
      let msg = `${orgName}'s ${reqCategory} document "${reqName}" is now marked as ${status}.`;
      if (notes && notes.trim()) msg += `\n\nAdmin Remarks: ${notes}`;

      const { data: { user: adminUser } } = await supabase.auth.getUser();

      for (const recipientId of officerIds) {
        if (adminUser && notes && notes.trim()) {
          await adminAPI.sendMessage(adminUser.id, recipientId,
            `Compliance Update for ${orgName} (${status}):\n${notes}`);
        }
        await adminAPI.sendNotification(recipientId, title, msg, 'compliance_update');
        try {
          const { data: userData } = await supabase
            .from('users').select('expo_push_token').eq('id', recipientId).single();
          if (userData?.expo_push_token && window.api?.sendPushNotification) {
            await window.api.sendPushNotification(
              userData.expo_push_token, title, msg,
              { type: 'compliance_update', organizationId: data.organization_id }
            );
          }
        } catch (pushErr) { }
      }
    }

    return { data, error };
  },

  deleteCompliance: async (id) => {
    const { error } = await supabase
      .from('organization_compliance')
      .delete()
      .eq('id', id);
    return { error };
  },

  bulkDeleteCompliance: async (ids) => {
    const { error } = await supabase
      .from('organization_compliance')
      .delete()
      .in('id', ids);
    return { error };
  },




  getAuditLogs: async (limit = 50) => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        user:users(full_name, email, role)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error };
  },


  logAction: async (action, entityType, entityId, oldValues = null, newValues = null) => {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action,
        entity_type: entityType,
        entity_id: entityId,
        old_values: oldValues,
        new_values: newValues,
      });
    return { error };
  },


  verifyDocumentHash: async (entityId, fileUrl) => {
    try {

      const { data: hashRecord, error } = await supabase
        .from('document_hashes')
        .select('file_hash')
        .eq('entity_id', entityId)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !hashRecord) return { verified: false, error: 'No hash found' };


      const response = await fetch(fileUrl);
      if (!response.ok) return { verified: false, error: 'Failed to fetch file' };
      const blob = await response.blob();


      const currentHash = await computeFileHash(blob);
      return { verified: currentHash === hashRecord.file_hash, error: null };
    } catch (err) {
      return { verified: false, error: err.message };
    }
  },


  getAllPortfolios: async () => {
    const { data, error } = await supabase
      .from('student_portfolios')
      .select(`
        id, user_id, achievement_type, title, description,
        achievement_date, points, verified, created_at,
        file_url, file_name, file_type,
        user:users(full_name, email, student_id),
        organization:organizations(name, acronym)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  verifyPortfolio: async (portfolioId, isVerified) => {
    const { data, error } = await supabase
      .from('student_portfolios')
      .update({ verified: isVerified })
      .eq('id', portfolioId)
      .select()
      .single();
    return { data, error };
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  getAdminNotifications: async () => {
    // Admin notifications have user_id = null
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .is('user_id', null)
      .order('created_at', { ascending: false })
      .limit(50);
    return { data, error };
  },

  markNotificationRead: async (notificationId) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();
    return { data, error };
  },

  sendNotification: async (userId, title, message, type = 'system', actionUrl = null) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          action_url: actionUrl,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      if (error) console.warn('sendNotification error (non-fatal):', error.message);
      return { data, error };
    } catch (err) {
      console.warn('sendNotification exception (non-fatal):', err.message);
      return { data: null, error: err };
    }
  },

  // ==========================================
  // ANNOUNCEMENTS
  // ==========================================
  getOfficialAnnouncements: async () => {
    const { data, error } = await supabase
      .from('official_announcements')
      .select(`
        *,
        author:users!official_announcements_author_id_fkey(full_name, email),
        organization:organizations!official_announcements_organization_id_fkey(name, acronym),
        reviewer:users!official_announcements_reviewed_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  reviewAnnouncement: async (announcementId, status, reviewNotes, adminId) => {
    const { data, error } = await supabase
      .from('official_announcements')
      .update({
        status,
        review_notes: reviewNotes,
        reviewed_by: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('id', announcementId)
      .select()
      .single();
    return { data, error };
  },

  // ==========================================
  // FACULTY REQUESTS
  // ==========================================
  getFacultyRequests: async () => {
    const { data, error } = await supabase
      .from('faculty_requests')
      .select(`
        *,
        user:users(full_name, email)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  updateFacultyRequestStatus: async (requestId, status, reviewNotes = null) => {
    const updates = {
      status,
      updated_at: new Date().toISOString()
    };
    if (reviewNotes) updates.review_notes = reviewNotes;

    const { data, error } = await supabase
      .from('faculty_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single();

    if (data && !error && data.user_id) {
      const title = 'Faculty Request Updated';
      const msg = `Your request "${data.title}" has been updated to: ${status}.`;

      await adminAPI.sendNotification(data.user_id, title, msg, 'faculty_request');

      // Push notification to mobile APK (wake up phone even when app is closed)
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('expo_push_token')
          .eq('id', data.user_id)
          .single();
        if (userData?.expo_push_token) {
          // Use Electron IPC to send from Node.js (bypasses browser CORS)
          const pushResult = window.api?.sendPushNotification
            ? await window.api.sendPushNotification(
              userData.expo_push_token,
              title,
              msg,
              { type: 'faculty_request', requestId: data.id }
            )
            : null;
          console.log('[PUSH DEBUG] Faculty push result:', JSON.stringify(pushResult));
        }
      } catch (pushErr) {
        console.warn('Push notification failed (non-fatal):', pushErr);
      }
    }
    return { data, error };
  },

  // ==========================================
  // AI ASSISTANT CHAT
  // ==========================================
  getChatHistory: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: [], error: null };
    const { data, error } = await supabase
      .from('ai_chats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(100);
    return { data, error };
  },

  saveChatMessage: async (role, message, componentType = null, payload = null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No auth user' };

    const { error } = await supabase
      .from('ai_chats')
      .insert({
        user_id: user.id,
        role: role,
        message: message,
        component_type: componentType,
        payload: payload
      });
    return { error };
  },


  // ========================
  // MESSAGING
  // ========================
  getAdminConversations: async (adminId) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id, subject, body, read, created_at, sender_id, recipient_id,
        sender:users!messages_sender_id_fkey(id, full_name, email),
        recipient:users!messages_recipient_id_fkey(id, full_name, email)
      `)
      .or(`sender_id.eq.${adminId},recipient_id.eq.${adminId}`)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getThread: async (adminId, partnerId) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id, subject, body, read, created_at, sender_id, recipient_id,
        sender:users!messages_sender_id_fkey(id, full_name, email)
      `)
      .or(
        `and(sender_id.eq.${adminId},recipient_id.eq.${partnerId}),` +
        `and(sender_id.eq.${partnerId},recipient_id.eq.${adminId})`
      )
      .order('created_at', { ascending: true });
    return { data, error };
  },

  sendMessage: async (senderId, recipientId, body) => {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id: senderId,
        recipient_id: recipientId,
        body,
        read: false,
      }])
      .select()
      .single();
    return { data, error };
  },

  markThreadAsRead: async (adminId, partnerId) => {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('recipient_id', adminId)
      .eq('sender_id', partnerId)
      .eq('read', false);
    return { error };
  },
};

export const repositoryAPI = {
  getAllRepositories: async () => {
    const { data, error } = await supabase
      .from('organization_repository')
      .select(`
        *,
        organization:organizations(name, acronym),
        uploader:users!organization_repository_uploaded_by_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  getOrgRepository: async (orgId) => {
    const { data, error } = await supabase
      .from('organization_repository')
      .select(`
        *,
        uploader:users!organization_repository_uploaded_by_fkey(full_name, email)
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  deleteRepositoryDoc: async (docId) => {
    const { error } = await supabase
      .from('organization_repository')
      .delete()
      .eq('id', docId);
    return { error };
  },

  // ─── Contact Messages (from public website) ──────────────────────────────────
  getContactMessages: async () => {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  updateContactMessageStatus: async (id, status) => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id);
    return { error };
  },

  deleteContactMessage: async (id) => {
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);
    return { error };
  },
};
