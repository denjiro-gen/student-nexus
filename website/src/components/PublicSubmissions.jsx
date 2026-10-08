import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCalendarAlt, FaMapMarkerAlt, FaCertificate, FaCheckCircle, FaExclamationCircle, FaChevronDown } from "react-icons/fa";
import { supabase } from "../config/supabase";

const FORM_TYPES = [
  { id: "event", label: "Event Proposal", icon: FaCalendarAlt, desc: "Propose a student organization event for OSAS review and approval.", color: "#03632B" },
  { id: "venue", label: "Venue Request", icon: FaMapMarkerAlt, desc: "Request a venue or facility for your organization activity.", color: "#1d4ed8" },
  { id: "accreditation", label: "Accreditation Application", icon: FaCertificate, desc: "Apply for organization accreditation or renewal.", color: "#7c3aed" },
];

const VENUES = ["AVR (Audio Visual Room)", "Covered Court", "Open Grounds", "Function Hall", "Gymnasium", "Library Conference Room", "Campus Chapel", "Other (specify in notes)"];

const blank = { org_name:"", org_acronym:"", contact_email:"", contact_name:"", contact_number:"", title:"", description:"", event_date:"", event_time_start:"", event_time_end:"", venue:"", expected_attendees:"", notes:"", org_type:"", adviser_name:"", adviser_email:"", year_established:"" };

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
function Input(props) { return <input className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-osas-primary/30 focus:border-osas-primary transition-colors bg-white" {...props} />; }
function Textarea(props) { return <textarea rows={4} className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-osas-primary/30 focus:border-osas-primary transition-colors bg-white resize-none" {...props} />; }
function Sel({ children, ...props }) { return <div className="relative"><select className="w-full appearance-none border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-osas-primary/30 focus:border-osas-primary transition-colors bg-white pr-9" {...props}>{children}</select><FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" /></div>; }

export default function PublicSubmissions() {
  const [activeType, setActiveType] = useState(null);
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => { setForm(blank); setErrors({}); setStatus(null); }, [activeType]);
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  function validate() {
    const e = {};
    if (!form.org_name.trim()) e.org_name = "Organization name is required.";
    if (!form.contact_email.trim()) e.contact_email = "Contact email is required.";
    if (!form.contact_name.trim()) e.contact_name = "Contact person is required.";
    if (activeType === "event" || activeType === "venue") {
      if (!form.title.trim()) e.title = "Title is required.";
      if (!form.event_date) e.event_date = "Event date is required.";
      if (!form.venue.trim()) e.venue = "Venue is required.";
    }
    if (activeType === "accreditation" && !form.adviser_name.trim()) e.adviser_name = "Adviser name is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true); setStatus(null);
    try {
      let error;
      const note = `[Public Submission] Contact: ${form.contact_name} <${form.contact_email}>${form.contact_number ? " / " + form.contact_number : ""}${form.notes ? "\n\nNotes: " + form.notes : ""}`;
      if (activeType === "event") {
        const { data: org } = await supabase.from("organizations").select("id").ilike("name", "%" + form.org_name.trim() + "%").maybeSingle();
        ({ error } = await supabase.from("event_proposals").insert({ title: form.title.trim(), description: form.description.trim(), event_date: form.event_date, event_time_start: form.event_time_start || null, event_time_end: form.event_time_end || null, venue: form.venue.trim(), expected_attendees: form.expected_attendees ? parseInt(form.expected_attendees) : null, organization_id: org?.id || null, status: "pending", submitted_by: null, notes: note }));
      } else {
        const msg = activeType === "venue"
          ? `[VENUE REQUEST]\nOrg: ${form.org_name}${form.org_acronym ? " (" + form.org_acronym + ")" : ""}\nTitle: ${form.title}\nVenue: ${form.venue}\nDate: ${form.event_date}${form.event_time_start ? "\nTime: " + form.event_time_start + " - " + form.event_time_end : ""}\nAttendees: ${form.expected_attendees || "N/A"}\n\n${form.notes || ""}`
          : `[ACCREDITATION APPLICATION]\nOrg: ${form.org_name}${form.org_acronym ? " (" + form.org_acronym + ")" : ""}\nType: ${form.org_type}\nYear Est: ${form.year_established}\nContact: ${form.contact_name} / ${form.contact_email}\nAdviser: ${form.adviser_name}${form.adviser_email ? " <" + form.adviser_email + ">" : ""}\n\n${form.notes || ""}`;
        ({ error } = await supabase.from("contact_messages").insert({ first_name: form.contact_name.split(" ")[0] || form.contact_name, last_name: form.contact_name.split(" ").slice(1).join(" ") || "", email: form.contact_email.trim(), student_id: form.org_acronym || "", course: activeType === "venue" ? "Venue Request" : "Accreditation Application", message: msg }));
      }
      if (error) throw error;
      setStatus("success");
      setStatusMsg(activeType === "event" ? "Event proposal submitted! OSAS will review it shortly." : activeType === "venue" ? "Venue request sent! Our team will contact you soon." : "Accreditation application received! OSAS will contact you for next steps.");
      setForm(blank);
    } catch (err) { console.error(err); setStatus("error"); setStatusMsg("Something went wrong. Please try again or contact OSAS directly."); }
    finally { setSubmitting(false); }
  }

  return (
    <section id="submissions" className="py-24 section-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.span className="section-label" initial={{ opacity:0,y:16 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }}>Submit a Request</motion.span>
          <motion.h2 className="section-title" initial={{ opacity:0,y:16 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:0.05 }}>Online <span className="text-osas-primary">Submissions</span></motion.h2>
          <motion.p className="section-subtitle" initial={{ opacity:0,y:16 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:0.1 }}>Submit your event proposals, venue requests, and accreditation applications online. All submissions go directly to OSAS for review.</motion.p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {FORM_TYPES.map((type, i) => (
            <motion.button key={type.id} onClick={() => setActiveType(p => p === type.id ? null : type.id)} className={`card p-6 text-left flex flex-col gap-3 transition-all duration-200 border-2 ${activeType === type.id ? "border-osas-primary shadow-lg" : "border-transparent hover:border-gray-200"}`} initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.07 }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl" style={{ background: type.color }}><type.icon /></div>
              <div><h3 className="font-bold text-osas-text text-base font-poppins mb-1">{type.label}</h3><p className="text-gray-500 text-xs leading-relaxed">{type.desc}</p></div>
              <div className="mt-auto text-xs font-semibold" style={{ color: type.color }}>{activeType === type.id ? "▲ Close Form" : "▼ Open Form"}</div>
            </motion.button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {activeType && (
            <motion.div key={activeType} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} className="card p-8">
              {status && (
                <div className={`mb-6 flex items-start gap-3 p-4 rounded-xl text-sm font-medium ${status === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {status === "success" ? <FaCheckCircle className="mt-0.5 shrink-0 text-green-600" /> : <FaExclamationCircle className="mt-0.5 shrink-0 text-red-500" />}{statusMsg}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Organization Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Organization Name" required error={errors.org_name}><Input value={form.org_name} onChange={set("org_name")} placeholder="e.g., Computer Science Society" /></Field>
                    <Field label="Acronym / Short Name"><Input value={form.org_acronym} onChange={set("org_acronym")} placeholder="e.g., CSS" /></Field>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Contact Person</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Full Name" required error={errors.contact_name}><Input value={form.contact_name} onChange={set("contact_name")} placeholder="Juan Dela Cruz" /></Field>
                    <Field label="Email Address" required error={errors.contact_email}><Input type="email" value={form.contact_email} onChange={set("contact_email")} placeholder="juan@email.com" /></Field>
                    <Field label="Contact Number"><Input value={form.contact_number} onChange={set("contact_number")} placeholder="09xx-xxx-xxxx" /></Field>
                  </div>
                </div>
                {(activeType === "event" || activeType === "venue") && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{activeType === "event" ? "Event Details" : "Venue Request Details"}</p>
                    <div className="space-y-4">
                      <Field label={activeType === "event" ? "Event Title" : "Activity Title"} required error={errors.title}><Input value={form.title} onChange={set("title")} placeholder="Enter the event/activity title" /></Field>
                      <Field label="Description"><Textarea value={form.description} onChange={set("description")} placeholder="Brief description..." /></Field>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Event Date" required error={errors.event_date}><Input type="date" value={form.event_date} onChange={set("event_date")} min={new Date().toISOString().split("T")[0]} /></Field>
                        <Field label="Start Time"><Input type="time" value={form.event_time_start} onChange={set("event_time_start")} /></Field>
                        <Field label="End Time"><Input type="time" value={form.event_time_end} onChange={set("event_time_end")} /></Field>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Requested Venue" required error={errors.venue}><Sel value={form.venue} onChange={set("venue")}><option value="">Select a venue...</option>{VENUES.map(v => <option key={v} value={v}>{v}</option>)}</Sel></Field>
                        <Field label="Expected Attendees"><Input type="number" min="1" value={form.expected_attendees} onChange={set("expected_attendees")} placeholder="e.g., 50" /></Field>
                      </div>
                      <Field label="Additional Notes"><Textarea rows={3} value={form.notes} onChange={set("notes")} placeholder="Special requirements, setup instructions, etc." /></Field>
                    </div>
                  </div>
                )}
                {activeType === "accreditation" && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Accreditation Details</p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Organization Type"><Sel value={form.org_type} onChange={set("org_type")}><option value="">Select type...</option><option>Academic / Departmental</option><option>Socio-Civic</option><option>Religious / Spiritual</option><option>Cultural / Arts</option><option>Sports</option><option>Other</option></Sel></Field>
                        <Field label="Year Established"><Input type="number" min="1900" max={new Date().getFullYear()} value={form.year_established} onChange={set("year_established")} placeholder="e.g., 2015" /></Field>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Faculty Adviser Name" required error={errors.adviser_name}><Input value={form.adviser_name} onChange={set("adviser_name")} placeholder="Full name of faculty adviser" /></Field>
                        <Field label="Faculty Adviser Email"><Input type="email" value={form.adviser_email} onChange={set("adviser_email")} placeholder="adviser@school.edu" /></Field>
                      </div>
                      <Field label="Additional Notes / Message to OSAS"><Textarea value={form.notes} onChange={set("notes")} placeholder="Any additional context or questions..." /></Field>
                    </div>
                  </div>
                )}
                <div className="pt-2 flex items-center justify-between flex-wrap gap-4">
                  <p className="text-xs text-gray-400">All submissions are reviewed by OSAS. You will be contacted via the email you provided.</p>
                  <button type="submit" disabled={submitting || status === "success"} className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Submitting…</> : status === "success" ? <><FaCheckCircle />Submitted!</> : "Submit Request"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
