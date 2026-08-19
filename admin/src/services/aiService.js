import { adminAPI } from './api';
import { supabase } from '../config/supabase';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.REACT_APP_GEMINI_API_KEY });

// ─── Session persistence ────────────────────────────────────────────────────

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

// ─── Intent Detection ───────────────────────────────────────────────────────

const detect = (txt) => {
  const t = txt.toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening|night)|what's up|sup)\b/.test(t))
    return { intent: 'greet' };

  // Help
  if (/\b(help|commands?|what can you|what do you know)\b/.test(t))
    return { intent: 'help' };

  // Dashboard summary
  if (/\b(dashboard|summary|overview|stats|statistics|total)\b/.test(t))
    return { intent: 'dashboard' };

  // Event proposals
  if (/\b(event|events|proposal|proposals)\b/.test(t)) {
    if (/\b(pending|for review|waiting)\b/.test(t)) return { intent: 'events', filter: 'pending' };
    if (/\b(approved?)\b/.test(t))                  return { intent: 'events', filter: 'approved' };
    if (/\b(rejected?|denied)\b/.test(t))            return { intent: 'events', filter: 'rejected' };
    if (/\b(complet(e|ed))\b/.test(t))               return { intent: 'events', filter: 'completed' };
    return { intent: 'events', filter: null };
  }

  // Organizations
  if (/\b(org|orgs|organization|organizations|club|clubs)\b/.test(t))
    return { intent: 'orgs' };

  // Users
  if (/\b(user|users|student|students|member|members)\b/.test(t))
    return { intent: 'users' };

  // Compliance
  if (/\b(compliance|comply|requirement|requirements|deadline)\b/.test(t))
    return { intent: 'compliance' };

  // Audit logs
  if (/\b(log|logs|audit|activity|recent|history)\b/.test(t))
    return { intent: 'logs' };

  return { intent: 'unknown' };
};

// ─── Response Formatters ────────────────────────────────────────────────────

const fmt = {
  greet: () => ({
    text: `### Good day, Admin! 👋\n\nI'm the **OSAS Intelligent Agent** — your live database assistant.\n\nI can help you check:\n- 📋 **Events & Proposals**\n- 🏛️ **Organizations**\n- 👥 **Users**\n- ✅ **Compliance**\n- 📜 **Audit Logs**\n- 📊 **Dashboard Summary**\n\nJust ask naturally! Try: *"show pending events"* or *"how many organizations are there?"*`,
    type: 'help',
    payload: null
  }),

  help: () => ({
    text: `### 📖 Available Commands\n\n| Command | What it does |\n|---|---|\n| \`dashboard\` or \`summary\` | Show key statistics |\n| \`events\` / \`proposals\` | List all event proposals |\n| \`pending events\` | Show events awaiting approval |\n| \`approved events\` | Show approved events |\n| \`rejected events\` | Show rejected events |\n| \`organizations\` | List all registered orgs |\n| \`users\` | Show user account summary |\n| \`compliance\` | Show compliance requirements |\n| \`audit logs\` | Show recent system activity |\n\n> 💡 You can also type naturally like *"how many events are pending?"*`,
    type: 'help',
    payload: null
  }),

  dashboard: async () => {
    const { data } = await adminAPI.getDashboardStats();
    if (!data) return { text: '⚠️ Could not load dashboard stats.', type: 'error', payload: null };
    const d = Array.isArray(data) ? data[0] : data;
    return {
      text: '### 📊 Dashboard Summary\nHere is the current overview of the system:',
      type: 'dashboard',
      payload: d
    };
  },

  events: async (filter) => {
    const { data } = await adminAPI.getEventProposals();
    if (!data || data.length === 0) return { text: '📭 No event proposals found in the database.', type: 'error', payload: null };
    const list = filter ? data.filter(e => e.status === filter) : data;
    if (list.length === 0) return { text: `📭 No **${filter}** events found.`, type: 'error', payload: null };

    const statusEmoji = { pending: '🕐', approved: '✅', rejected: '❌', completed: '🏁' };
    const header = filter
      ? `### ${statusEmoji[filter] || '📋'} ${filter.charAt(0).toUpperCase() + filter.slice(1)} Events (${list.length})\nHere are the specific events:`
      : `### 📋 All Event Proposals (${list.length})\nHere are all events in the database:`;

    return { text: header, type: 'events', payload: list };
  },

  orgs: async () => {
    const { data } = await adminAPI.getOrganizations();
    if (!data || data.length === 0) return { text: '📭 No organizations found in the database.', type: 'error', payload: null };
    return { text: `### 🏛️ Registered Organizations (${data.length})\nHere are all the student organizations:`, type: 'orgs', payload: data };
  },

  users: async () => {
    const { data } = await adminAPI.getUsers();
    if (!data || data.length === 0) return { text: '📭 No users found in the database.', type: 'error', payload: null };
    return { text: `### 👥 User Accounts (${data.length} total)\nHere is the breakdown of users:`, type: 'users', payload: data };
  },

  compliance: async () => {
    const { data } = await adminAPI.getComplianceList();
    if (!data || data.length === 0) return { text: '📭 No compliance records found.', type: 'error', payload: null };
    return { text: `### ✅ Compliance Status (${data.length} records)\nHere are the compliance requirements:`, type: 'compliance', payload: data };
  },

  logs: async () => {
    const { data } = await adminAPI.getAuditLogs(15);
    if (!data || data.length === 0) return { text: '📭 No recent audit activity found.', type: 'error', payload: null };
    return { text: `### 📜 Recent System Activity\nHere are the last 15 actions performed in the system:`, type: 'logs', payload: data };
  },

  unknown: (txt) => ({
    text: `### 🤔 I didn't quite understand that\n\nI couldn't find a matching command for: *"${txt}"*\n\nTry one of these:\n- \`show events\` / \`pending events\`\n- \`organizations\`\n- \`users\`\n- \`compliance\`\n- \`audit logs\`\n- \`dashboard summary\`\n\nType **help** to see the full command list.`,
    type: 'unknown',
    payload: null
  })
};

// ─── Local Database Agent ───────────────────────────────────────────────────

export class AIAssistantSession {
  constructor(existingSessionId = null) {
    this.sessionId = existingSessionId || makeId();
    this.history = [];
  }

  async sendMessage(userInput) {
    const txt = (userInput || '').trim();
    
    // We will use Gemini to determine the intent and generate a professional response
    let responseObj;
    try {
      const prompt = `You are the OSAS Intelligent Agent, a highly professional, helpful, and polite virtual operations assistant for the Student Nexus administration platform.
Your job is to respond to the user professionally and intelligently. The user is an administrator.
Based on the user's input, you must determine if you need to pull data from the database to show them a widget.

Available data intents (commands):
- "greet": General greeting or asking how you are.
- "help": Asking for help or what you can do.
- "dashboard": Asking for dashboard summary, overview, or statistics.
- "events": Asking about event proposals. You can set the filter to "pending", "approved", "rejected", "completed", or null.
- "orgs": Asking about registered organizations or clubs.
- "users": Asking about user accounts or members.
- "compliance": Asking about compliance records, requirements, or deadlines.
- "logs": Asking about audit logs, recent system activity, or history.
- "unknown": If the user's request does not match any of the above intents or is conversational without needing data.

Respond ONLY with a valid JSON object in this exact format, with no markdown code blocks wrapping the JSON:
{
  "text": "Your highly professional and friendly response formatted in Markdown...",
  "intent": "intent_name",
  "filter": "filter_name or null"
}

User input: "${txt}"`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: "OBJECT",
            properties: {
              text: { type: "STRING" },
              intent: { type: "STRING" },
              filter: { type: "STRING", nullable: true }
            },
            required: ["text", "intent"]
          }
        }
      });

      const parsed = JSON.parse(aiResponse.text);

      
      const intent = parsed.intent || 'unknown';
      const filter = parsed.filter || null;
      let payload = null;

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
        }
      } catch (dbErr) {
        console.error('[Database Fetch Error]', dbErr);
        parsed.text += "\n\n*(Note: I encountered an error while retrieving the requested data from the database.)*";
      }

      responseObj = {
        text: parsed.text,
        type: intent === 'unknown' ? null : intent,
        payload
      };

    } catch (err) {
      console.error('[Agent Error]', err);
      // Fallback if Gemini fails
      responseObj = { text: `⚠️ **AI Service Error**: Could not connect to the intelligent agent.\n\n*${err.message}*`, type: 'error', payload: null };
    }

    // Append to history for session persistence (saving only the text so as not to bloat DB)
    this.history.push(
      { role: 'user',  parts: [{ text: txt }] },
      { role: 'model', parts: [{ text: responseObj.text }] }
    );

    await saveSession(this.sessionId, this.history);

    return responseObj;
  }
}
