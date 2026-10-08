import { adminAPI } from './api';
import { supabase } from '../config/supabase';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY });

// ─── Session persistence ─────────────────────────────────────────────────────

const makeId = () =>
  crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export const saveSession = async (sessionId, messages, title = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const sessionTitle = title ||
      messages.find(m => m.role === 'user')?.parts?.[0]?.text?.slice(0, 60) || 'AI Chat Session';

    const { error } = await supabase
      .from('ai_chats')
      .upsert({
        user_id: user.id,
        session_id: sessionId,
        title: sessionTitle,
        messages,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_id' });

    if (error) console.warn('[AI Session Save Error]', error.message);
  } catch (err) {
    console.warn('[AI Session Save Exception]', err.message);
  }
};

export const getSessionHistory = async (limit = 20) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('ai_chats')
      .select('session_id, title, updated_at, messages')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[AI Session Load Error]', err.message);
    return [];
  }
};

export const deleteSession = async (sessionId) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('ai_chats')
      .delete()
      .eq('user_id', user.id)
      .eq('session_id', sessionId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('[AI Session Delete Error]', err.message);
    return false;
  }
};

export const deleteAllSessions = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('ai_chats')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('[AI Clear History Error]', err.message);
    return false;
  }
};

// ─── System Knowledge Base ────────────────────────────────────────────────────
// Describes the actual navigation and workflows of the Student Nexus system.
// Used to generate accurate step-by-step instructions for officer users.

const SYSTEM_KNOWLEDGE = `
You are the Student Nexus Intelligent Agent — a professional, friendly, and highly knowledgeable assistant for the Student Nexus platform.
The platform has THREE components:
1. MOBILE APP (React Native/Expo) — Used by Student Organization Officers
2. ADMIN DASHBOARD (Electron Desktop App) — Used by OSAS Administrators and office staff
3. PUBLIC WEBSITE — Used by students and the public to view events, organizations, and announcements

You are responding to an OSAS Administrator on the Admin Dashboard.
When answering HOW-TO questions, you MUST:
- Always provide clear, numbered step-by-step instructions
- Use the EXACT navigation labels and terms from the actual system (listed below)
- Be concise but thorough
- Format using markdown with numbered steps and bold key terms

ACTUAL SYSTEM NAVIGATION FOR OFFICERS (Mobile App):
- Home Tab: Dashboard with stats, announcements, upcoming events
- Events Tab: List of events with "+" FAB button to propose an event → CreateEvent screen
- Compliance Tab: Two sub-tabs — "Accreditation" and "Clearance"
- Portfolio Tab: Student achievements and portfolio items
- Calendar Tab: Monthly calendar showing approved/pending events
- Messages Tab: Direct messaging with other users and OSAS Admin
- Profile Tab: User info, edit profile, upload profile picture, change password

ACTUAL EVENT PROPOSAL WORKFLOW (Mobile App):
1. Events tab → tap "+" (FAB button at bottom right)
2. Fill in: Event Title, Event Date, Start Time, End Time, Venue, Expected Attendees, Budget, Description
3. Attach supporting documents (optional)
4. Tap "Submit Proposal"
5. Status = "Pending" — awaiting OSAS review
6. OSAS Admin reviews and Approves/Rejects/Requests Revision
7. Officer receives notification + in-app notification
8. If approved, event appears on the shared Event Calendar

ACTUAL COMPLIANCE WORKFLOW (Mobile App):
ACCREDITATION:
1. Compliance tab → tap "Accreditation"
2. View list of accreditation requirements
3. Tap a requirement card to expand it
4. Tap "Upload Document" → choose file from device
5. Document status changes to "Pending Review"
6. OSAS reviews and sets status to Approved or Rejected
7. If Rejected, view remarks → tap "Edit/Update Document" → upload revised file

CLEARANCE:
1. Compliance tab → tap "Clearance"
2. Same flow as Accreditation but for end-of-semester clearance documents

EDITING/UPDATING A COMPLIANCE DOCUMENT:
1. Compliance tab → find your submitted document
2. Tap the document card to expand it
3. Tap "Edit/Update Document"
4. Read the admin remarks (if any)
5. Upload the revised/new file
6. The system records this as a new version
7. OSAS Admin is notified of the update

ACTUAL VENUE/BOOKING WORKFLOW:
1. Events tab → tap "+" to create a new event
2. In the form, select a venue from the Venue field
3. The system checks for conflicts on the selected date and venue
4. If conflict exists, a warning is shown
5. Submit the event proposal
6. The event goes through OSAS + relevant office approvals

CHECKING EVENT STATUS:
1. Events tab → see the status badge on each event card
2. Tap the event card to open Event Details
3. View the "Approval History" section for step-by-step office decisions
4. Statuses: Pending → Approved / Rejected / Revision Required

ANNOUNCEMENTS:
- Officers see announcements on the Home screen
- Public website visitors see approved announcements on the homepage

PROFILE UPDATE:
1. Profile tab → tap your avatar/name
2. Tap "Edit Profile"
3. Change your name or contact number
4. Tap profile picture to upload/change photo
5. Tap "Save"

CONTACT AN OFFICE / MESSAGE OSAS:
1. Messages tab → tap the compose button
2. Search for the recipient (OSAS Admin, office staff)
3. Type and send your message

DATA INTENTS (for showing live database widgets):
- "dashboard" → show live stats widget
- "events" → list event proposals (filter: pending/approved/rejected/completed)
- "orgs" → list organizations
- "users" → list user accounts
- "compliance" → list compliance records
- "logs" → show recent audit logs

For data queries, ALWAYS include the intent in your JSON response.
For how-to/procedural questions, set intent to "how_to" and write clear step-by-step instructions in the text field.
For general conversation, set intent to "unknown".

RESPONSE FORMAT — Always respond with this exact JSON (no code block wrapping):
{
  "text": "Your professional markdown-formatted response with step-by-step instructions if applicable...",
  "intent": "intent_name",
  "filter": "filter_value or null"
}
`;

// ─── Intent Detection (local fallback) ────────────────────────────────────────

const detect = (txt) => {
  const t = txt.toLowerCase();

  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening|night)|what's up|sup)\b/.test(t))
    return { intent: 'greet' };

  if (/\b(help|commands?|what can you|what do you know)\b/.test(t))
    return { intent: 'help' };

  if (/\b(dashboard|summary|overview|stats|statistics|total)\b/.test(t))
    return { intent: 'dashboard' };

  // HOW-TO patterns — officer workflow questions
  if (/\b(how\s*(can|do|to|should|would)|how\s+do\s+i|steps?\s+to|guide\s+(me|for)|walk\s+me)\b/.test(t))
    return { intent: 'how_to' };

  if (/\b(schedule|propose|create|add|submit)\b/.test(t) && /\b(event|activity)\b/.test(t))
    return { intent: 'how_to', topic: 'propose_event' };

  if (/\b(book|reserve|request)\b/.test(t) && /\b(venue|avr|room|hall)\b/.test(t))
    return { intent: 'how_to', topic: 'book_venue' };

  if (/\b(accreditation|accredit)\b/.test(t))
    return { intent: 'how_to', topic: 'accreditation' };

  if (/\b(clearance)\b/.test(t))
    return { intent: 'how_to', topic: 'clearance' };

  if (/\b(profile|picture|photo|avatar)\b/.test(t))
    return { intent: 'how_to', topic: 'profile' };

  if (/\b(event|events|proposal|proposals)\b/.test(t)) {
    if (/\b(pending|for review|waiting)\b/.test(t)) return { intent: 'events', filter: 'pending' };
    if (/\b(approved?)\b/.test(t))                  return { intent: 'events', filter: 'approved' };
    if (/\b(rejected?|denied)\b/.test(t))            return { intent: 'events', filter: 'rejected' };
    if (/\b(complet(e|ed))\b/.test(t))               return { intent: 'events', filter: 'completed' };
    return { intent: 'events', filter: null };
  }

  if (/\b(org|orgs|organization|organizations|club|clubs)\b/.test(t))
    return { intent: 'orgs' };

  if (/\b(user|users|student|students|member|members)\b/.test(t))
    return { intent: 'users' };

  if (/\b(compliance|comply|requirement|requirements|deadline)\b/.test(t))
    return { intent: 'compliance' };

  if (/\b(log|logs|audit|activity|recent|history)\b/.test(t))
    return { intent: 'logs' };

  return { intent: 'unknown' };
};

// ─── Local Database Agent ─────────────────────────────────────────────────────

export class AIAssistantSession {
  constructor(existingSessionId = null) {
    this.sessionId = existingSessionId || makeId();
    this.history = [];
  }

  async sendMessage(userInput) {
    const txt = (userInput || '').trim();

    let responseObj;
    try {
      const prompt = `${SYSTEM_KNOWLEDGE}

User input: "${txt}"`;

      let aiResponse;
      let retries = 3;
      while (retries > 0) {
        try {
          aiResponse = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: 'OBJECT',
                properties: {
                  text:   { type: 'STRING' },
                  intent: { type: 'STRING' },
                  filter: { type: 'STRING', nullable: true }
                },
                required: ['text', 'intent']
              }
            }
          });
          break; // success
        } catch (apiErr) {
          if (apiErr?.status === 503 && retries > 1) {
            retries--;
            console.warn(`[Gemini 503] Retrying... (${retries} left)`);
            await new Promise(res => setTimeout(res, 2000)); // wait 2s before retry
          } else {
            throw apiErr;
          }
        }
      }

      const parsed = JSON.parse(aiResponse.text);

      const intent = parsed.intent || 'unknown';
      const filter = parsed.filter || null;
      let payload = null;

      // Fetch live data for data-display intents
      if (intent !== 'how_to' && intent !== 'unknown' && intent !== 'greet' && intent !== 'help') {
        try {
          switch (intent) {
            case 'dashboard':
              payload = (await adminAPI.getDashboardStats()).data;
              if (Array.isArray(payload)) payload = payload[0];
              break;
            case 'events':
              payload = (await adminAPI.getEventProposals()).data;
              if (payload && filter) payload = payload.filter(e => e.status === filter);
              break;
            case 'orgs':
              payload = (await adminAPI.getOrganizations()).data;
              break;
            case 'users':
              payload = (await adminAPI.getUsers()).data;
              break;
            case 'compliance':
              payload = (await adminAPI.getComplianceList()).data;
              break;
            case 'logs':
              payload = (await adminAPI.getAuditLogs(15)).data;
              break;
            default:
              break;
          }
        } catch (dbErr) {
          console.error('[Database Fetch Error]', dbErr);
          parsed.text += '\n\n*(Note: I encountered an error while retrieving data.)*';
        }
      }

      responseObj = {
        text: parsed.text,
        type: intent === 'unknown' ? null : intent,
        payload
      };

    } catch (err) {
      console.error('[Agent Error]', err);
      // Fallback to local detect if Gemini fails
      const detected = detect(txt);
      let payload = null;
      let textResponse = `*(Offline Mode)* I understood you want to see **${detected.intent}**. Here is the data:`;

      if (detected.intent === 'greet') {
        textResponse = `*(Offline Mode)* Hello! How can I help you today? Type **help** to see what I can do.`;
      } else if (detected.intent === 'help') {
        textResponse = `*(Offline Mode)* I can show you your dashboard, events, users, compliance records, and audit logs. Just ask!`;
      } else if (detected.intent === 'unknown') {
        textResponse = `*(Offline Mode)* I am currently running in limited offline mode and didn't understand that. Try asking for "dashboard", "events", or "users".`;
      } else if (detected.intent !== 'how_to') {
        try {
          switch (detected.intent) {
            case 'dashboard':
              payload = (await adminAPI.getDashboardStats()).data;
              if (Array.isArray(payload)) payload = payload[0];
              break;
            case 'events':
              payload = (await adminAPI.getEventProposals()).data;
              if (payload && detected.filter) payload = payload.filter(e => e.status === detected.filter);
              break;
            case 'orgs':
              payload = (await adminAPI.getOrganizations()).data;
              break;
            case 'users':
              payload = (await adminAPI.getUsers()).data;
              break;
            case 'compliance':
              payload = (await adminAPI.getComplianceList()).data;
              break;
            case 'logs':
              payload = (await adminAPI.getAuditLogs(15)).data;
              break;
            default:
              break;
          }
        } catch (dbErr) {
          console.error('[Database Fetch Error Offline]', dbErr);
          textResponse += '\n\n*(Note: I encountered an error retrieving data from the database.)*';
        }
      } else {
        textResponse = `*(Offline Mode)* I cannot answer complex how-to questions while offline.`;
      }

      responseObj = {
        text: textResponse,
        type: detected.intent === 'unknown' ? null : detected.intent,
        payload
      };
    }

    this.history.push(
      { role: 'user',  parts: [{ text: txt }] },
      { role: 'model', parts: [{ text: responseObj.text }] }
    );

    await saveSession(this.sessionId, this.history);

    return responseObj;
  }
}
