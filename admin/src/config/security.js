

import { supabase } from './supabase';

export const ROLES = {
  ADMIN:          'admin',
  STUDENT_LEADER: 'student_leader',
  STUDENT:        'student',
};

export const PERMISSIONS = {
  
  VIEW_ALL_USERS:        [ROLES.ADMIN],
  MANAGE_COMPLIANCE:     [ROLES.ADMIN],
  APPROVE_EVENT:         [ROLES.ADMIN],
  VIEW_AUDIT_LOGS:       [ROLES.ADMIN],
  GENERATE_REPORTS:      [ROLES.ADMIN],
  MANAGE_ORGANIZATIONS:  [ROLES.ADMIN],

  
  SUBMIT_EVENT_PROPOSAL: [ROLES.ADMIN, ROLES.STUDENT_LEADER],
  VIEW_OWN_EVENTS:       [ROLES.ADMIN, ROLES.STUDENT_LEADER],
  UPLOAD_DOCUMENTS:      [ROLES.ADMIN, ROLES.STUDENT_LEADER],
  MANAGE_PORTFOLIO:      [ROLES.ADMIN, ROLES.STUDENT_LEADER],
  SEND_MESSAGES:         [ROLES.ADMIN, ROLES.STUDENT_LEADER],

  
  VIEW_EVENTS:           [ROLES.ADMIN, ROLES.STUDENT_LEADER, ROLES.STUDENT],
};

export function hasPermission(userRole, permission) {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(userRole);
}

export function requireRole(userRole, allowedRoles) {
  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
  }
  return true;
}

const RATE_LIMIT_WINDOW_MS  = 15 * 60 * 1000; 
const MAX_LOGIN_ATTEMPTS    = 5;               

const loginAttempts = {}; 

export const rateLimiter = {
  
  checkLogin(email) {
    const key = email.toLowerCase().trim();
    const now = Date.now();
    const record = loginAttempts[key];

    if (record) {
      
      if (record.lockedUntil && now < record.lockedUntil) {
        const lockoutSeconds = Math.ceil((record.lockedUntil - now) / 1000);
        return { allowed: false, remainingAttempts: 0, lockoutSeconds };
      }
      
      if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
        delete loginAttempts[key];
      }
    }

    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - (loginAttempts[key]?.count || 0), lockoutSeconds: 0 };
  },

  
  recordFailed(email) {
    const key = email.toLowerCase().trim();
    const now = Date.now();
    if (!loginAttempts[key]) {
      loginAttempts[key] = { count: 1, firstAttempt: now };
    } else {
      loginAttempts[key].count++;
      if (loginAttempts[key].count >= MAX_LOGIN_ATTEMPTS) {
        loginAttempts[key].lockedUntil = now + RATE_LIMIT_WINDOW_MS;
        
        supabase.from('audit_logs').insert({
          action:      'SECURITY_LOCKOUT',
          entity_type: 'auth',
          entity_id:   null,
          new_values:  { email: key, attempts: loginAttempts[key].count, locked_until: new Date(loginAttempts[key].lockedUntil).toISOString() },
        }).then(() => {});
      }
    }
    return MAX_LOGIN_ATTEMPTS - loginAttempts[key].count;
  },

  
  recordSuccess(email) {
    const key = email.toLowerCase().trim();
    delete loginAttempts[key];
  },
};

export async function computeFileHash(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1];
        const buffer = new TextEncoder().encode(base64);
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        resolve(hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function verifyFileIntegrity(file, storedHash) {
  const currentHash = await computeFileHash(file);
  return currentHash === storedHash;
}

export async function secureUploadDocument(bucket, path, file, entityType, entityId) {
  try {
    const hash = await computeFileHash(file);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const url = urlData.publicUrl;

    
    await supabase.from('document_hashes').upsert({
      entity_type: entityType,
      entity_id:   entityId,
      file_name:   file.name,
      file_hash:   hash,
      file_url:    url,
      uploaded_at: new Date().toISOString(),
    }, { onConflict: 'entity_id,file_name' });

    return { url, hash, error: null };
  } catch (error) {
    return { url: null, hash: null, error };
  }
}

export const auditTrail = {
  
  async log(action, entityType, entityId, oldValues = null, newValues = null) {
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: {} }));
    const { error } = await supabase.from('audit_logs').insert({
      user_id:     user?.id || null,
      action,
      entity_type: entityType,
      entity_id:   entityId,
      old_values:  oldValues,
      new_values:  newValues,
    });
    if (error) console.warn('Audit log error:', error.message);
  },

  
  async logLogin(email, success, ipHint = null) {
    await supabase.from('audit_logs').insert({
      action:      success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      entity_type: 'auth',
      entity_id:   null,
      new_values:  { email, timestamp: new Date().toISOString(), ip: ipHint },
    });
  },

  
  async logDocumentUpload(userId, fileName, fileHash, entityType, entityId) {
    await supabase.from('audit_logs').insert({
      user_id:     userId,
      action:      'DOCUMENT_UPLOADED',
      entity_type: entityType,
      entity_id:   entityId,
      new_values:  { file_name: fileName, file_hash: fileHash },
    });
  },
};

export const mfaHelpers = {
  
  async enrollTOTP() {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) return { error };
    return {
      factorId: data.id,
      qrUri:    data.totp.qr_code,
      secret:   data.totp.secret,
      error:    null,
    };
  },

  
  async verifyTOTP(factorId, code) {
    
    const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr) return { error: challengeErr };

    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code,
    });
    return { data, error };
  },

  
  async getFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors();
    return { factors: data?.totp || [], error };
  },

  
  async unenroll(factorId) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    return { error };
  },

  
  async getAssuranceLevel() {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return {
      currentLevel:  data?.currentLevel,   
      nextLevel:     data?.nextLevel,       
      requiresMFA:   data?.nextLevel === 'aal2',
      error,
    };
  },
};
