"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTheme, ThemeName } from "@/lib/theme/ThemeContext";
import { useToast } from "@/components/ui/Toast";

// ─── Role hierarchy ─────────────────────────────────────────────────────────────
const ROLE_WEIGHT: Record<string, number> = {
  SUPERADMIN: 6, FIRMADMIN: 5, MANAGER: 4, AGENT: 3,
  MARKETING: 2, OFFICE_SUPPORT: 2, ATTORNEY: 1, LENDER: 1, TITLECO: 1,
};

// ─── CSS constants ──────────────────────────────────────────────────────────────
const INPUT_CLS =
  "px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none transition-colors";
const SELECT_CLS =
  "px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none cursor-pointer";
const TEXTAREA_CLS =
  "px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none resize-none transition-colors w-full";
const LOCKED_BADGE =
  "inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-500/80 shrink-0";

// ─── Reusable inline components ─────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!checked)} disabled={disabled}
      className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-primary" : "bg-border"} ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-background rounded-full shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function SectionHeader({ title, description, badge }: { title: string; description: string; badge?: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-border">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {badge && <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-xs text-primary font-medium">{badge}</span>}
      </div>
      <p className="text-sm text-foreground/50 mt-1">{description}</p>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-border/40 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && <div className="text-xs text-foreground/50 mt-0.5">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function LockedRow({ label, description, minRoleLabel, canEdit, children }: {
  label: string; description?: string; minRoleLabel: string; canEdit: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`flex items-start justify-between gap-6 py-4 border-b border-border/40 last:border-0 ${!canEdit ? "opacity-75" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {!canEdit && <span className={LOCKED_BADGE}>🔒 {minRoleLabel}+</span>}
        </div>
        {description && <div className="text-xs text-foreground/50 mt-0.5">{description}</div>}
      </div>
      <div className={`shrink-0 ${!canEdit ? "pointer-events-none opacity-50" : ""}`}>{children}</div>
    </div>
  );
}

function SubTabs({ tabs, active, onChange }: {
  tabs: { key: string; label: string; locked?: boolean }[]; active: string; onChange: (k: string) => void;
}) {
  return (
    <div className="flex mb-6 border-b border-border">
      {tabs.map((tab) => (
        <button key={tab.key} onClick={() => onChange(tab.key)}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            active === tab.key ? "border-primary text-primary" : "border-transparent text-foreground/50 hover:text-foreground"
          }`}>
          {tab.label}
          {tab.locked && <span className="text-amber-500/70">🔒</span>}
        </button>
      ))}
    </div>
  );
}

// ─── Permission level types ─────────────────────────────────────────────────────
type PermLevel = "full" | "team" | "own" | "read" | "none";
const MATRIX_ROLES = ["MANAGER", "AGENT", "OFFICE_SUPPORT", "MARKETING", "ATTORNEY", "LENDER", "TITLECO"];

const DEFAULT_ACCESS: Record<string, Record<string, PermLevel>> = {
  crm:          { MANAGER: "team", AGENT: "own",  OFFICE_SUPPORT: "read", MARKETING: "read", ATTORNEY: "read", LENDER: "none", TITLECO: "none" },
  properties:   { MANAGER: "team", AGENT: "own",  OFFICE_SUPPORT: "read", MARKETING: "full", ATTORNEY: "read", LENDER: "none", TITLECO: "none" },
  transactions: { MANAGER: "team", AGENT: "own",  OFFICE_SUPPORT: "read", MARKETING: "none", ATTORNEY: "read", LENDER: "read", TITLECO: "read" },
  finance:      { MANAGER: "team", AGENT: "own",  OFFICE_SUPPORT: "none", MARKETING: "none", ATTORNEY: "none", LENDER: "none", TITLECO: "none" },
  appointments: { MANAGER: "full", AGENT: "own",  OFFICE_SUPPORT: "full", MARKETING: "own",  ATTORNEY: "read", LENDER: "none", TITLECO: "none" },
  documents:    { MANAGER: "team", AGENT: "own",  OFFICE_SUPPORT: "full", MARKETING: "own",  ATTORNEY: "full", LENDER: "read", TITLECO: "full" },
  marketing:    { MANAGER: "team", AGENT: "own",  OFFICE_SUPPORT: "read", MARKETING: "full", ATTORNEY: "none", LENDER: "none", TITLECO: "none" },
  reports:      { MANAGER: "team", AGENT: "own",  OFFICE_SUPPORT: "none", MARKETING: "read", ATTORNEY: "none", LENDER: "none", TITLECO: "none" },
};

// ─── Default state ───────────────────────────────────────────────────────────────
const DEFAULT_PROFILE    = { name: "", phone: "", title: "", timezone: "America/New_York", bio: "", licenseNumber: "", linkedIn: "" };
const DEFAULT_NOTIF      = { emailNewClient: true, emailAppointmentReminder: true, emailTransactionUpdate: true, emailOfferReceived: true, emailCommissionPaid: false, emailWeeklyReport: true, inAppAll: true, inAppMentions: true, smsUrgent: false, digestFrequency: "daily" };
const DEFAULT_CRM_ORG    = { requiredFields: "firstName,lastName,phone", maxClientsPerAgent: "100", leadSources: "Referral,Zillow,StreetEasy,Website,Cold Call,Open House", clientVisibility: "own", autoArchiveDays: "180", duplicateEmailCheck: true, allowAgentSelfAssign: true };
const DEFAULT_CRM_PREF   = { defaultClientType: "BUYER", autoAssignToMe: true, defaultFunnelStage: "LEAD", showBudgetField: true, compactView: false };
const DEFAULT_PROP_ORG   = { listingApprovalRequired: false, whoCanCreateListing: "AGENT", requiredFields: "address,city,state,zip,price,beds,baths", photoMinRequired: "3", photoLimit: "25", mlsSyncEnabled: false, descMaxChars: "1500" };
const DEFAULT_PROP_PREF  = { defaultStatus: "ACTIVE", priceFormat: "full", defaultAgentSelf: true, requireSqft: false };
const DEFAULT_FIN_ORG    = { defaultCommissionRate: "2.5", firmSplitPercent: "25", overridePercent: "5", fiscalYearStart: "1", currency: "USD", showGrossInLeaderboard: false, requireExpenseReceipts: true, taxReportingEnabled: true };
const DEFAULT_FIN_PREF   = { showNetInDashboard: true, showLeaderboard: true, preferredCurrency: "USD" };
const DEFAULT_APPT_ORG   = { workdayStart: "09:00", workdayEnd: "18:00", showWeekends: false, cancellationNoticehours: "24", allowClientBooking: false, bufferBetween: "15", maxAdvanceBookingDays: "60" };
const DEFAULT_APPT_PREF  = { defaultDuration: "60", reminderBefore: "24", personalBuffer: "10", autoConfirm: true, colorCode: "blue" };
const DEFAULT_DOC_ORG    = { allowedTypes: "PDF,DOCX,XLSX,PNG,JPG", maxFileSizeMb: "25", retentionDays: "365", autoOrganizeByTransaction: true, requireSignatureForContract: true, versionControlEnabled: true, auditTrailEnabled: true };
const DEFAULT_DOC_PREF   = { defaultFolderView: "transaction", showThumbnails: true, autoTagEnabled: true };
const DEFAULT_MKT_ORG    = { aiContentEnabled: true, allowedChannels: "email,instagram,facebook", brandVoice: "Professional, sophisticated, and trustworthy.", requireManagerApproval: false, autoCloseCampaignDays: "30", defaultHashtags: "#NYCRealEstate #LuxuryHomes" };
const DEFAULT_MKT_PREF   = { emailSignature: "", defaultListingTemplate: "", preferredChannel: "email", autoScheduleEnabled: false };

// ─── Main component ──────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  const S    = (t as any).settings   ?? {};
  const R    = (t as any).roles      ?? {};
  const Sc   = S.common              ?? {};

  // Role helpers
  const userWeight = ROLE_WEIGHT[user?.role || ""] || 0;
  const canEdit    = (minRole: string) => userWeight >= (ROLE_WEIGHT[minRole] || 0);
  const isFirmAdmin = canEdit("FIRMADMIN");
  const isManager   = canEdit("MANAGER");

  // Translated role labels (fall back to key)
  const roleLabel = (role: string) => R[role] ?? role;

  // Translated perm options
  const PERM_OPTIONS: { value: PermLevel; label: string; color: string }[] = [
    { value: "full",  label: S.accessControl?.permFull  ?? "Full",  color: "text-green-500" },
    { value: "team",  label: S.accessControl?.permTeam  ?? "Team",  color: "text-blue-500" },
    { value: "own",   label: S.accessControl?.permOwn   ?? "Own",   color: "text-primary" },
    { value: "read",  label: S.accessControl?.permRead  ?? "Read",  color: "text-foreground/50" },
    { value: "none",  label: S.accessControl?.permNone  ?? "None",  color: "text-red-400" },
  ];

  // Translated module names
  const MATRIX_MODULES = [
    { key: "crm",          label: S.accessControl?.modules?.crm          ?? "CRM / Clients" },
    { key: "properties",   label: S.accessControl?.modules?.properties   ?? "Properties" },
    { key: "transactions", label: S.accessControl?.modules?.transactions ?? "Transactions" },
    { key: "finance",      label: S.accessControl?.modules?.finance      ?? "Finance" },
    { key: "appointments", label: S.accessControl?.modules?.appointments ?? "Appointments" },
    { key: "documents",    label: S.accessControl?.modules?.documents    ?? "Documents" },
    { key: "marketing",    label: S.accessControl?.modules?.marketing    ?? "Marketing" },
    { key: "reports",      label: S.accessControl?.modules?.reports      ?? "Reports" },
  ];

  // ── Nav definition (translated) ─────────────────────────────────────────────
  const NAV = [
    {
      group: S.nav?.groupAccount ?? "Account",
      items: [
        { key: "profile",       label: S.nav?.profile       ?? "Profile",       icon: "👤" },
        { key: "notifications", label: S.nav?.notifications ?? "Notifications", icon: "🔔" },
      ],
    },
    {
      group: S.nav?.groupOrganization ?? "Organization",
      items: [
        { key: "org-settings",   label: S.nav?.orgSettings   ?? "Org Settings",   icon: "🏢", adminOnly: true },
        { key: "access-control", label: S.nav?.accessControl ?? "Access Control", icon: "🛡️", adminOnly: true },
        { key: "users",          label: S.nav?.users         ?? "Team & Roles",   icon: "👥", adminOnly: true },
        { key: "security",       label: S.nav?.security      ?? "Security",       icon: "🔐" },
        { key: "appearance",     label: S.nav?.appearance    ?? "Appearance",     icon: "🎨" },
        { key: "integrations",   label: S.nav?.integrations  ?? "Integrations",  icon: "🔗" },
      ],
    },
    {
      group: S.nav?.groupFeatures ?? "Features",
      items: [
        { key: "crm",          label: S.nav?.crm          ?? "CRM",          icon: "🧑‍🤝‍🧑" },
        { key: "properties",   label: S.nav?.properties   ?? "Properties",   icon: "🏠" },
        { key: "finance",      label: S.nav?.finance      ?? "Finance",      icon: "💰" },
        { key: "appointments", label: S.nav?.appointments ?? "Appointments", icon: "📅" },
        { key: "documents",    label: S.nav?.documents    ?? "Documents",    icon: "📄" },
        { key: "marketing",    label: S.nav?.marketing    ?? "Marketing",    icon: "📣" },
      ],
    },
  ];

  const [activeSection, setActiveSection] = React.useState("profile");

  // ── Sub-tab state ────────────────────────────────────────────────────────────
  const [crmTab,  setCrmTab]  = React.useState<"org"|"personal">("org");
  const [propTab, setPropTab] = React.useState<"org"|"personal">("org");
  const [finTab,  setFinTab]  = React.useState<"org"|"personal">("org");
  const [apptTab, setApptTab] = React.useState<"org"|"personal">("org");
  const [docTab,  setDocTab]  = React.useState<"org"|"personal">("org");
  const [mktTab,  setMktTab]  = React.useState<"org"|"personal">("org");

  // ── Users ────────────────────────────────────────────────────────────────────
  const [users, setUsers]               = React.useState<any[]>([]);
  const [usersLoading, setUsersLoading] = React.useState(false);
  const [inviteEmail, setInviteEmail]   = React.useState("");
  const [inviteRole,  setInviteRole]    = React.useState("AGENT");

  // ── Access matrix ────────────────────────────────────────────────────────────
  const loadMatrix = () => { try { return JSON.parse(localStorage.getItem("settings_access_matrix") || "null") || DEFAULT_ACCESS; } catch { return DEFAULT_ACCESS; } };
  const [accessMatrix, setAccessMatrix] = React.useState<Record<string, Record<string, PermLevel>>>(loadMatrix);
  const setMatrixCell = (mod: string, role: string, val: PermLevel) => setAccessMatrix((prev) => ({ ...prev, [mod]: { ...prev[mod], [role]: val } }));

  // ── Feature state ────────────────────────────────────────────────────────────
  const ls = <T,>(key: string, def: T): T => { try { return { ...def, ...JSON.parse(localStorage.getItem(key) || "{}") }; } catch { return def; } };
  const [profile,     setProfile]     = React.useState(() => ls("settings_profile",       DEFAULT_PROFILE));
  const [orgSettings, setOrgSettings] = React.useState({ companyName: "XYZ Realty Group", website: "https://xyzrealty.com", address: "350 Fifth Ave, New York, NY 10118", licenseNumber: "10401234567", phone: "+1 (212) 555-0100", logoUrl: "" });
  const [notif,       setNotif]       = React.useState(() => ls("settings_notif",         DEFAULT_NOTIF));
  const [crmOrg,      setCrmOrg]      = React.useState(() => ls("settings_crm_org",       DEFAULT_CRM_ORG));
  const [crmPersonal, setCrmPersonal] = React.useState(() => ls("settings_crm_personal",  DEFAULT_CRM_PREF));
  const [propOrg,     setPropOrg]     = React.useState(() => ls("settings_prop_org",      DEFAULT_PROP_ORG));
  const [propPersonal,setPropPersonal]= React.useState(() => ls("settings_prop_personal", DEFAULT_PROP_PREF));
  const [finOrg,      setFinOrg]      = React.useState(() => ls("settings_fin_org",       DEFAULT_FIN_ORG));
  const [finPersonal, setFinPersonal] = React.useState(() => ls("settings_fin_personal",  DEFAULT_FIN_PREF));
  const [apptOrg,     setApptOrg]     = React.useState(() => ls("settings_appt_org",      DEFAULT_APPT_ORG));
  const [apptPersonal,setApptPersonal]= React.useState(() => ls("settings_appt_personal", DEFAULT_APPT_PREF));
  const [docOrg,      setDocOrg]      = React.useState(() => ls("settings_doc_org",       DEFAULT_DOC_ORG));
  const [docPersonal, setDocPersonal] = React.useState(() => ls("settings_doc_personal",  DEFAULT_DOC_PREF));
  const [mktOrg,      setMktOrg]      = React.useState(() => ls("settings_mkt_org",       DEFAULT_MKT_ORG));
  const [mktPersonal, setMktPersonal] = React.useState(() => ls("settings_mkt_personal",  DEFAULT_MKT_PREF));
  const [security,    setSecurity]    = React.useState({ twoFAEnabled: false, sessionTimeout: "60", ipWhitelist: "", loginAlerts: true, passwordExpiry: "90", minPasswordLength: "10", requireSpecialChar: true, forceLogoutOnPwChange: true });
  const [integrations,setIntegrations]= React.useState({ stripeConnected: false, googleCalendarConnected: false, mlsConnected: false, docusignConnected: false, mailchimpConnected: false, zapierConnected: false, mapboxKey: "", openaiKey: "" });

  // ── Load team ────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (activeSection !== "users") return;
    setUsersLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/settings/users`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then((r) => r.json()).then((d) => setUsers(Array.isArray(d) ? d : [])).catch(() => setUsers([])).finally(() => setUsersLoading(false));
  }, [activeSection]);

  // ── Save helper ──────────────────────────────────────────────────────────────
  const save = (key: string, data: any) => { localStorage.setItem(key, JSON.stringify(data)); toast.success(Sc.saveChanges ?? "Settings saved"); };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/settings/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) { setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))); toast.success("Role updated"); }
      else toast.error("Failed to update role");
    } catch { toast.error("Network error"); }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/settings/invite`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) { toast.success(`Invitation sent to ${inviteEmail}`); setInviteEmail(""); }
      else { const d = await res.json(); toast.error(d.error || "Failed to send invite"); }
    } catch { toast.error("Network error"); }
  };

  // ── PolicyLockNotice ─────────────────────────────────────────────────────────
  const PolicyLockNotice = ({ minRole }: { minRole: string }) => (
    <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg mb-6">
      <span className="text-lg">🔒</span>
      <div>
        <div className="text-sm font-medium text-amber-500/90">{Sc.policyLockTitle ?? "Org Policy — View Only"}</div>
        <div className="text-xs text-foreground/50 mt-0.5">
          {(Sc.policyLockDesc ?? "These settings are controlled by your firm administrator. You need {role} access or higher to change them.").replace("{role}", roleLabel(minRole))}
        </div>
      </div>
    </div>
  );

  // ── Save button ──────────────────────────────────────────────────────────────
  const SaveBtn = ({ label, onClick }: { label: string; onClick: () => void }) => (
    <div className="mt-6">
      <button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors" onClick={onClick}>{label}</button>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Section renderers
  // ─────────────────────────────────────────────────────────────────────────────

  const renderProfile = () => {
    const P = S.profile ?? {};
    return (
      <div>
        <SectionHeader title={P.title ?? "Profile"} description={P.desc ?? "Your personal information visible to teammates"} />
        <SettingRow label={P.fullName ?? "Full Name"} description={P.fullNameDesc}>
          <input className={INPUT_CLS} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Jane Smith" />
        </SettingRow>
        <SettingRow label={P.professionalTitle ?? "Professional Title"} description={P.professionalTitleDesc}>
          <input className={INPUT_CLS} value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} placeholder="Senior Broker Associate" />
        </SettingRow>
        <SettingRow label={P.phone ?? "Phone"} description={P.phoneDesc}>
          <input className={INPUT_CLS} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+1 (212) 555-0101" />
        </SettingRow>
        <SettingRow label={P.licenseNumber ?? "License Number"} description={P.licenseNumberDesc}>
          <input className={INPUT_CLS} value={profile.licenseNumber} onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })} placeholder="10491234567" />
        </SettingRow>
        <SettingRow label={P.linkedIn ?? "LinkedIn Profile"}>
          <input className={INPUT_CLS} value={profile.linkedIn} onChange={(e) => setProfile({ ...profile, linkedIn: e.target.value })} placeholder="https://linkedin.com/in/..." />
        </SettingRow>
        <SettingRow label={P.timezone ?? "Timezone"}>
          <select className={SELECT_CLS} value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}>
            <option value="America/New_York">Eastern (ET)</option>
            <option value="America/Chicago">Central (CT)</option>
            <option value="America/Denver">Mountain (MT)</option>
            <option value="America/Los_Angeles">Pacific (PT)</option>
          </select>
        </SettingRow>
        <SettingRow label={P.bio ?? "Bio"} description={P.bioDesc}>
          <textarea className={TEXTAREA_CLS} style={{ width: 280 }} rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="NYC specialist with 10+ years..." />
        </SettingRow>
        <SaveBtn label={P.save ?? "Save Profile"} onClick={() => save("settings_profile", profile)} />
      </div>
    );
  };

  const renderNotifications = () => {
    const N = S.notifications ?? {};
    return (
      <div>
        <SectionHeader title={N.title ?? "Notifications"} description={N.desc ?? "Choose when and how you receive alerts"} />
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-2">{N.emailAlerts ?? "Email Alerts"}</div>
          <div className="space-y-0">
            <SettingRow label={N.newClient ?? "New client assigned"} description={N.newClientDesc}><Toggle checked={notif.emailNewClient} onChange={(v) => setNotif({ ...notif, emailNewClient: v })} /></SettingRow>
            <SettingRow label={N.appointmentReminder ?? "Appointment reminder"} description={N.appointmentReminderDesc}><Toggle checked={notif.emailAppointmentReminder} onChange={(v) => setNotif({ ...notif, emailAppointmentReminder: v })} /></SettingRow>
            <SettingRow label={N.transactionUpdate ?? "Transaction status update"}><Toggle checked={notif.emailTransactionUpdate} onChange={(v) => setNotif({ ...notif, emailTransactionUpdate: v })} /></SettingRow>
            <SettingRow label={N.offerReceived ?? "Offer received on listing"}><Toggle checked={notif.emailOfferReceived} onChange={(v) => setNotif({ ...notif, emailOfferReceived: v })} /></SettingRow>
            <SettingRow label={N.commissionPaid ?? "Commission payment processed"}><Toggle checked={notif.emailCommissionPaid} onChange={(v) => setNotif({ ...notif, emailCommissionPaid: v })} /></SettingRow>
            <SettingRow label={N.weeklyReport ?? "Weekly performance digest"}><Toggle checked={notif.emailWeeklyReport} onChange={(v) => setNotif({ ...notif, emailWeeklyReport: v })} /></SettingRow>
          </div>
        </div>
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-2">{N.inAppSms ?? "In-App & SMS"}</div>
          <div className="space-y-0">
            <SettingRow label={N.inAppAll ?? "In-app notifications (all)"}><Toggle checked={notif.inAppAll} onChange={(v) => setNotif({ ...notif, inAppAll: v })} /></SettingRow>
            <SettingRow label={N.mentions ?? "Mention & @tag alerts"}><Toggle checked={notif.inAppMentions} onChange={(v) => setNotif({ ...notif, inAppMentions: v })} /></SettingRow>
            <SettingRow label={N.smsUrgent ?? "Urgent SMS alerts"} description={N.smsUrgentDesc}><Toggle checked={notif.smsUrgent} onChange={(v) => setNotif({ ...notif, smsUrgent: v })} /></SettingRow>
          </div>
        </div>
        <SettingRow label={N.digestFrequency ?? "Digest Frequency"}>
          <select className={SELECT_CLS} value={notif.digestFrequency} onChange={(e) => setNotif({ ...notif, digestFrequency: e.target.value })}>
            <option value="realtime">{N.digestRealtime ?? "Real-time"}</option>
            <option value="daily">{N.digestDaily ?? "Daily"}</option>
            <option value="weekly">{N.digestWeekly ?? "Weekly"}</option>
            <option value="none">{N.digestOff ?? "Off"}</option>
          </select>
        </SettingRow>
        <SaveBtn label={N.save ?? "Save Preferences"} onClick={() => save("settings_notif", notif)} />
      </div>
    );
  };

  const renderOrgSettings = () => {
    const O = S.orgSettings ?? {};
    return (
      <div>
        <SectionHeader title={O.title ?? "Org Settings"} description={O.desc ?? "Firm-wide configuration. Changes affect all team members."} badge={Sc.firmAdminBadge} />
        {!isFirmAdmin && <PolicyLockNotice minRole="FIRMADMIN" />}
        <LockedRow label={O.companyName ?? "Company Name"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} value={orgSettings.companyName} onChange={(e) => setOrgSettings({ ...orgSettings, companyName: e.target.value })} />
        </LockedRow>
        <LockedRow label={O.website ?? "Website"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} value={orgSettings.website} onChange={(e) => setOrgSettings({ ...orgSettings, website: e.target.value })} />
        </LockedRow>
        <LockedRow label={O.officeAddress ?? "Office Address"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} style={{ width: 280 }} value={orgSettings.address} onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })} />
        </LockedRow>
        <LockedRow label={O.officePhone ?? "Office Phone"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} value={orgSettings.phone} onChange={(e) => setOrgSettings({ ...orgSettings, phone: e.target.value })} />
        </LockedRow>
        <LockedRow label={O.brokerageLicense ?? "NY State Brokerage License"} description={O.brokerageLicenseDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} value={orgSettings.licenseNumber} onChange={(e) => setOrgSettings({ ...orgSettings, licenseNumber: e.target.value })} />
        </LockedRow>
        <LockedRow label={O.logoUrl ?? "Logo URL"} description={O.logoUrlDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} style={{ width: 280 }} value={orgSettings.logoUrl} onChange={(e) => setOrgSettings({ ...orgSettings, logoUrl: e.target.value })} placeholder="https://cdn.example.com/logo.png" />
        </LockedRow>
        <div className="mt-6 pb-6 border-b border-border">
          <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-4">{O.subscription ?? "Subscription"}</div>
          <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
            <div>
              <div className="text-sm font-semibold text-foreground">{user?.tier || "CORE"} Plan</div>
              <div className="text-xs text-foreground/50 mt-0.5">{O.billedMonthly ?? "Billed monthly · Next renewal Jun 1, 2026"}</div>
            </div>
            <a href="/upgrade" className="px-3 py-1.5 bg-primary text-background rounded-lg text-xs font-medium hover:bg-primary/90">{O.upgrade ?? "Upgrade"}</a>
          </div>
        </div>
        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-4">{O.dataCompliance ?? "Data & Compliance"}</div>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-foreground hover:bg-background transition-colors" onClick={() => toast.info("GDPR data export will be emailed within 24 hours.")}>{O.exportGdpr ?? "Export All Data (GDPR)"}</button>
            <button className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-foreground hover:bg-background transition-colors" onClick={() => toast.info("Audit log download started.")}>{O.downloadAudit ?? "Download Audit Log"}</button>
          </div>
        </div>
        {isFirmAdmin && <SaveBtn label={O.save ?? "Save Org Settings"} onClick={() => toast.success("Org settings saved")} />}
      </div>
    );
  };

  const renderAccessControl = () => {
    const AC = S.accessControl ?? {};
    return (
      <div>
        <SectionHeader title={AC.title ?? "Access Control"} description={AC.desc ?? "Define what each role can see and do in each module."} badge={Sc.firmAdminBadge} />
        {!isFirmAdmin && <PolicyLockNotice minRole="FIRMADMIN" />}
        <div className="text-xs text-foreground/50 mb-4">
          {AC.permNote ?? "Permission levels:"}{" "}
          <strong className="text-green-500">{AC.permFull}</strong> = {AC.permFullDesc} ·{" "}
          <strong className="text-blue-500">{AC.permTeam}</strong> = {AC.permTeamDesc} ·{" "}
          <strong className="text-primary">{AC.permOwn}</strong> = {AC.permOwnDesc} ·{" "}
          <strong className="text-foreground/50">{AC.permRead}</strong> = {AC.permReadDesc} ·{" "}
          <strong className="text-red-400">{AC.permNone}</strong> = {AC.permNoneDesc}
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-foreground/40 w-36">{AC.moduleHeader ?? "Module"}</th>
                {MATRIX_ROLES.map((role) => (
                  <th key={role} className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-widest text-foreground/40">{roleLabel(role)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX_MODULES.map((mod, idx) => (
                <tr key={mod.key} className={`border-b border-border/50 ${idx % 2 === 0 ? "" : "bg-surface/40"}`}>
                  <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">{mod.label}</td>
                  {MATRIX_ROLES.map((role) => {
                    const val = accessMatrix[mod.key]?.[role] ?? "none";
                    const opt = PERM_OPTIONS.find((o) => o.value === val);
                    return (
                      <td key={role} className="px-2 py-3 text-center">
                        <select value={val} disabled={!isFirmAdmin} onChange={(e) => setMatrixCell(mod.key, role, e.target.value as PermLevel)}
                          className={`text-xs px-1.5 py-1 rounded border border-border bg-background outline-none cursor-pointer disabled:cursor-default ${opt?.color ?? ""}`}>
                          {PERM_OPTIONS.map((o) => <option key={o.value} value={o.value} className={o.color}>{o.label}</option>)}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 bg-surface rounded-lg border border-border/60 text-xs text-foreground/50">
          <strong>{AC.noteTitle ?? "Note:"}</strong> {AC.noteDesc ?? "SUPERADMIN and FIRMADMIN always have full access to all modules."}
        </div>
        {isFirmAdmin && (
          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90"
              onClick={() => { localStorage.setItem("settings_access_matrix", JSON.stringify(accessMatrix)); toast.success(Sc.saveChanges ?? "Saved"); }}>
              {AC.saveMatrix ?? "Save Access Matrix"}
            </button>
            <button className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-foreground hover:bg-background"
              onClick={() => { setAccessMatrix(DEFAULT_ACCESS); toast.info(Sc.resetToDefaults ?? "Reset to defaults"); }}>
              {AC.resetDefaults ?? "Reset to Defaults"}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderUsers = () => {
    const U = S.users ?? {};
    return (
      <div>
        <SectionHeader title={U.title ?? "Team & Roles"} description={U.desc ?? "Manage team members, roles and access levels"} badge={isManager ? (Sc.managerBadge ?? "Manager+") : undefined} />
        {!isManager && <PolicyLockNotice minRole="MANAGER" />}
        {isManager && (
          <div className="mb-6 p-4 bg-surface border border-border rounded-lg">
            <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3">{U.inviteTitle ?? "Invite Team Member"}</div>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-48">
                <label className="block text-xs text-foreground/50 mb-1">{U.inviteEmail ?? "Email Address"}</label>
                <input className={`${INPUT_CLS} w-full`} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@xyz.com" type="email" />
              </div>
              <div>
                <label className="block text-xs text-foreground/50 mb-1">{U.inviteRole ?? "Role"}</label>
                <select className={SELECT_CLS} value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  {Object.keys(ROLE_WEIGHT).filter((k) => k !== "SUPERADMIN" && (!isFirmAdmin ? k !== "FIRMADMIN" : true)).map((k) => (
                    <option key={k} value={k}>{roleLabel(k)}</option>
                  ))}
                </select>
              </div>
              <button className="px-4 py-1.5 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={handleInvite}>{U.sendInvite ?? "Send Invite"}</button>
            </div>
          </div>
        )}
        {usersLoading ? (
          <div className="flex items-center gap-3 py-8 text-foreground/50 text-sm"><div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" /> {U.loadingTeam ?? "Loading team..."}</div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-foreground/40">{U.memberHeader ?? "Member"}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-foreground/40">{U.roleHeader ?? "Role"}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-foreground/40">{U.tierHeader ?? "Tier"}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-foreground/40">{U.actionsHeader ?? "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-foreground/40 text-sm">{U.noMembers ?? "No team members found."}</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-b border-border/40 last:border-0 hover:bg-surface/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{u.name}</div>
                      <div className="text-xs text-foreground/50">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {isManager && u.id !== user?.id ? (
                        <select className={SELECT_CLS} value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} disabled={!canEdit("FIRMADMIN") && u.role === "FIRMADMIN"}>
                          {Object.keys(ROLE_WEIGHT).filter((k) => k !== "SUPERADMIN").map((k) => <option key={k} value={k}>{roleLabel(k)}</option>)}
                        </select>
                      ) : (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{roleLabel(u.role)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><span className="text-xs text-foreground/60">{u.tier || "CORE"}</span></td>
                    <td className="px-4 py-3">
                      {isManager && u.id !== user?.id && (
                        <button className="text-xs text-red-400 hover:text-red-300 transition-colors" onClick={() => toast.info(Sc.deactivationSoon ?? "Deactivation requires confirmation — feature coming soon")}>
                          {U.deactivate ?? "Deactivate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderSecurity = () => {
    const SC = S.security ?? {};
    return (
      <div>
        <SectionHeader title={SC.title ?? "Security"} description={SC.desc ?? "Authentication and session security settings"} />
        <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-2">{SC.personal ?? "Personal Security"}</div>
        <div className="space-y-0 mb-6">
          <SettingRow label={SC.twoFA ?? "Two-Factor Authentication"} description={SC.twoFADesc}><Toggle checked={security.twoFAEnabled} onChange={(v) => setSecurity({ ...security, twoFAEnabled: v })} /></SettingRow>
          <SettingRow label={SC.loginAlerts ?? "Login Alerts"} description={SC.loginAlertsDesc}><Toggle checked={security.loginAlerts} onChange={(v) => setSecurity({ ...security, loginAlerts: v })} /></SettingRow>
          <SettingRow label={SC.sessionTimeout ?? "Session Timeout (minutes)"} description={SC.sessionTimeoutDesc}>
            <select className={SELECT_CLS} value={security.sessionTimeout} onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}>
              <option value="15">15 min</option><option value="30">30 min</option><option value="60">60 min</option>
              <option value="120">2 hours</option><option value="480">8 hours</option>
            </select>
          </SettingRow>
          <SettingRow label={SC.changePassword ?? "Change Password"}>
            <button className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-foreground hover:bg-background" onClick={() => toast.info("Password change email sent")}>{SC.sendResetLink ?? "Send Reset Link"}</button>
          </SettingRow>
        </div>
        <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-2">{SC.orgPolicy ?? "Org Security Policy"}</div>
        <div className="space-y-0 mb-6">
          <LockedRow label={SC.minPasswordLength ?? "Minimum Password Length"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
            <select className={SELECT_CLS} value={security.minPasswordLength} onChange={(e) => setSecurity({ ...security, minPasswordLength: e.target.value })}>
              {["8","10","12","14","16"].map((n) => <option key={n} value={n}>{n} {SC.characters ?? "characters"}</option>)}
            </select>
          </LockedRow>
          <LockedRow label={SC.requireSpecialChar ?? "Require Special Character"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
            <Toggle checked={security.requireSpecialChar} onChange={(v) => setSecurity({ ...security, requireSpecialChar: v })} disabled={!isFirmAdmin} />
          </LockedRow>
          <LockedRow label={SC.passwordExpiry ?? "Password Expiry (days)"} description={SC.passwordExpiryDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
            <input className={INPUT_CLS} style={{ width: 80 }} value={security.passwordExpiry} onChange={(e) => setSecurity({ ...security, passwordExpiry: e.target.value })} />
          </LockedRow>
          <LockedRow label={SC.forceLogout ?? "Force Logout on Password Change"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
            <Toggle checked={security.forceLogoutOnPwChange} onChange={(v) => setSecurity({ ...security, forceLogoutOnPwChange: v })} disabled={!isFirmAdmin} />
          </LockedRow>
          <LockedRow label={SC.ipWhitelist ?? "IP Whitelist"} description={SC.ipWhitelistDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
            <input className={INPUT_CLS} style={{ width: 240 }} value={security.ipWhitelist} onChange={(e) => setSecurity({ ...security, ipWhitelist: e.target.value })} placeholder="192.168.1.0/24" />
          </LockedRow>
        </div>
        <SaveBtn label={SC.save ?? "Save Security Settings"} onClick={() => toast.success("Security settings saved")} />
      </div>
    );
  };

  const renderAppearance = () => {
    const AP = S.appearance ?? {};
    return (
      <div>
        <SectionHeader title={AP.title ?? "Appearance"} description={AP.desc ?? "Customize how the platform looks for you"} />
        <SettingRow label={AP.theme ?? "Theme"} description={AP.themeDesc}>
          <div className="flex gap-2 flex-wrap">
            {(["luxury","modern","youth","chinese","cyberpunk"] as ThemeName[]).map((th) => (
              <button key={th} onClick={() => setTheme(th)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${theme === th ? "bg-primary text-background border-primary" : "bg-surface border-border text-foreground/60 hover:border-primary/50"}`}>{th}</button>
            ))}
          </div>
        </SettingRow>
        <SettingRow label={AP.sidebarPosition ?? "Sidebar Position"} description={AP.sidebarPositionDesc}>
          <select className={SELECT_CLS}>
            <option>{AP.sidebarLeft ?? "Left (default)"}</option>
            <option>{AP.sidebarCollapsed ?? "Collapsed"}</option>
          </select>
        </SettingRow>
        <SettingRow label={AP.density ?? "Density"} description={AP.densityDesc}>
          <select className={SELECT_CLS}>
            <option value="comfortable">{AP.densityComfortable ?? "Comfortable"}</option>
            <option value="compact">{AP.densityCompact ?? "Compact"}</option>
            <option value="spacious">{AP.densitySpacious ?? "Spacious"}</option>
          </select>
        </SettingRow>
        <SettingRow label={AP.dateFormat ?? "Date Format"}>
          <select className={SELECT_CLS}>
            <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
          </select>
        </SettingRow>
        <SettingRow label={AP.numberFormat ?? "Number Format"}>
          <select className={SELECT_CLS}>
            <option value="1,234,567">1,234,567 (US)</option>
            <option value="1.234.567">1.234.567 (EU)</option>
          </select>
        </SettingRow>
      </div>
    );
  };

  const renderIntegrations = () => {
    const I = S.integrations ?? {};
    const apps = I.apps ?? {};
    const appList = [
      { key: "stripeConnected",          ...apps.stripe         ?? { label: "Stripe Payments",   desc: "Accept commission splits" },         icon: "💳", adminOnly: true },
      { key: "googleCalendarConnected",  ...apps.googleCalendar ?? { label: "Google Calendar",   desc: "Sync appointments bi-directionally" }, icon: "📆", adminOnly: false },
      { key: "mlsConnected",             ...apps.mls            ?? { label: "NYC MLS / RLS",     desc: "Auto-import listings from MLS" },     icon: "🏙️", adminOnly: true },
      { key: "docusignConnected",        ...apps.docusign       ?? { label: "DocuSign",           desc: "Send contracts for e-signature" },    icon: "✍️", adminOnly: false },
      { key: "mailchimpConnected",       ...apps.mailchimp      ?? { label: "Mailchimp",           desc: "Sync contacts and run campaigns" },  icon: "✉️", adminOnly: false },
      { key: "zapierConnected",          ...apps.zapier         ?? { label: "Zapier",              desc: "Automate workflows with 5000+ apps" },icon: "⚡", adminOnly: false },
    ];
    return (
      <div>
        <SectionHeader title={I.title ?? "Integrations"} description={I.desc ?? "Connect third-party services and APIs"} />
        {appList.map(({ key, label, desc, icon, adminOnly }) => {
          const connected = integrations[key as keyof typeof integrations] as boolean;
          const editable = !adminOnly || isFirmAdmin;
          return (
            <div key={key} className="flex items-center justify-between py-4 border-b border-border/40 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    {adminOnly && !isFirmAdmin && <span className={LOCKED_BADGE}>🔒 {Sc.firmAdminOnly ?? "Firm Admin+"}</span>}
                    {connected && <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-500">{Sc.connected ?? "Connected"}</span>}
                  </div>
                  <div className="text-xs text-foreground/50">{desc}</div>
                </div>
              </div>
              <button disabled={!editable}
                onClick={() => { if (!editable) return; setIntegrations({ ...integrations, [key]: !connected }); toast.info(connected ? `${label} disconnected` : `${label} connection flow coming soon`); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${connected ? "bg-surface border-border text-foreground/60 hover:border-red-400 hover:text-red-400" : "bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-background"} ${!editable ? "opacity-40 cursor-not-allowed" : ""}`}>
                {connected ? (Sc.disconnect ?? "Disconnect") : (Sc.connect ?? "Connect")}
              </button>
            </div>
          );
        })}
        <div className="mt-6 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40">{I.apiKeys ?? "API Keys"}</div>
          <LockedRow label={I.mapboxKey ?? "Mapbox Public Token"} description={I.mapboxKeyDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
            <input className={INPUT_CLS} style={{ width: 260 }} type="password" value={integrations.mapboxKey} onChange={(e) => setIntegrations({ ...integrations, mapboxKey: e.target.value })} placeholder="pk.eyJ1..." />
          </LockedRow>
          <LockedRow label={I.openaiKey ?? "OpenAI API Key"} description={I.openaiKeyDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
            <input className={INPUT_CLS} style={{ width: 260 }} type="password" value={integrations.openaiKey} onChange={(e) => setIntegrations({ ...integrations, openaiKey: e.target.value })} placeholder="sk-..." />
          </LockedRow>
        </div>
      </div>
    );
  };

  const renderCRM = () => {
    const C = S.crm ?? {};
    const tabs = [{ key: "org", label: Sc.orgPolicy ?? "Org Policy", locked: !isFirmAdmin }, { key: "personal", label: Sc.myPreferences ?? "My Preferences" }];
    return (
      <div>
        <SectionHeader title={C.title ?? "CRM Settings"} description={C.desc ?? "Client relationship management configuration"} />
        <SubTabs tabs={tabs} active={crmTab} onChange={(k) => setCrmTab(k as any)} />
        {crmTab === "org" && (
          <div>
            {!isFirmAdmin && <PolicyLockNotice minRole="FIRMADMIN" />}
            <LockedRow label={C.requiredFields ?? "Required Fields"} description={C.requiredFieldsDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 280 }} value={crmOrg.requiredFields} onChange={(e) => setCrmOrg({ ...crmOrg, requiredFields: e.target.value })} />
            </LockedRow>
            <LockedRow label={C.maxClients ?? "Max Clients per Agent"} description={C.maxClientsDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 80 }} value={crmOrg.maxClientsPerAgent} onChange={(e) => setCrmOrg({ ...crmOrg, maxClientsPerAgent: e.target.value })} type="number" min="0" />
            </LockedRow>
            <LockedRow label={C.clientVisibility ?? "Client Visibility"} description={C.clientVisibilityDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <select className={SELECT_CLS} value={crmOrg.clientVisibility} onChange={(e) => setCrmOrg({ ...crmOrg, clientVisibility: e.target.value })}>
                <option value="own">{C.visibilityOwn ?? "Own clients only"}</option>
                <option value="team">{C.visibilityTeam ?? "Team clients"}</option>
                <option value="all">{C.visibilityAll ?? "All org clients"}</option>
              </select>
            </LockedRow>
            <LockedRow label={C.autoArchive ?? "Auto-Archive After (days)"} description={C.autoArchiveDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 80 }} value={crmOrg.autoArchiveDays} onChange={(e) => setCrmOrg({ ...crmOrg, autoArchiveDays: e.target.value })} type="number" />
            </LockedRow>
            <LockedRow label={C.duplicateCheck ?? "Enforce Duplicate Email Check"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <Toggle checked={crmOrg.duplicateEmailCheck} onChange={(v) => setCrmOrg({ ...crmOrg, duplicateEmailCheck: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label={C.selfAssign ?? "Allow Agent Self-Assignment"} description={C.selfAssignDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <Toggle checked={crmOrg.allowAgentSelfAssign} onChange={(v) => setCrmOrg({ ...crmOrg, allowAgentSelfAssign: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label={C.leadSources ?? "Lead Sources"} description={C.leadSourcesDesc} minRoleLabel={roleLabel("MANAGER")} canEdit={isManager}>
              <input className={INPUT_CLS} style={{ width: 300 }} value={crmOrg.leadSources} onChange={(e) => setCrmOrg({ ...crmOrg, leadSources: e.target.value })} />
            </LockedRow>
            {isFirmAdmin && <SaveBtn label={Sc.saveOrgPolicy ?? "Save Org Policy"} onClick={() => save("settings_crm_org", crmOrg)} />}
          </div>
        )}
        {crmTab === "personal" && (
          <div>
            <SettingRow label={C.defaultType ?? "Default Client Type"}>
              <select className={SELECT_CLS} value={crmPersonal.defaultClientType} onChange={(e) => setCrmPersonal({ ...crmPersonal, defaultClientType: e.target.value })}>
                <option value="BUYER">Buyer</option><option value="SELLER">Seller</option><option value="RENTER">Renter</option><option value="INVESTOR">Investor</option>
              </select>
            </SettingRow>
            <SettingRow label={C.defaultFunnelStage ?? "Default Funnel Stage"}>
              <select className={SELECT_CLS} value={crmPersonal.defaultFunnelStage} onChange={(e) => setCrmPersonal({ ...crmPersonal, defaultFunnelStage: e.target.value })}>
                {["LEAD","PROSPECT","ACTIVE","UNDER_CONTRACT","CLOSED","LOST"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </SettingRow>
            <SettingRow label={C.autoAssignLeads ?? "Auto-Assign New Leads to Me"}><Toggle checked={crmPersonal.autoAssignToMe} onChange={(v) => setCrmPersonal({ ...crmPersonal, autoAssignToMe: v })} /></SettingRow>
            <SettingRow label={C.showBudget ?? "Show Budget Field on Client Card"}><Toggle checked={crmPersonal.showBudgetField} onChange={(v) => setCrmPersonal({ ...crmPersonal, showBudgetField: v })} /></SettingRow>
            <SettingRow label={C.compactView ?? "Compact List View"}><Toggle checked={crmPersonal.compactView} onChange={(v) => setCrmPersonal({ ...crmPersonal, compactView: v })} /></SettingRow>
            <SaveBtn label={Sc.saveMyPreferences ?? "Save My Preferences"} onClick={() => save("settings_crm_personal", crmPersonal)} />
          </div>
        )}
      </div>
    );
  };

  const renderProperties = () => {
    const P = S.properties ?? {};
    const tabs = [{ key: "org", label: Sc.orgPolicy ?? "Org Policy", locked: !isFirmAdmin }, { key: "personal", label: Sc.myPreferences ?? "My Preferences" }];
    return (
      <div>
        <SectionHeader title={P.title ?? "Property Settings"} description={P.desc ?? "Listing management configuration"} />
        <SubTabs tabs={tabs} active={propTab} onChange={(k) => setPropTab(k as any)} />
        {propTab === "org" && (
          <div>
            {!isFirmAdmin && <PolicyLockNotice minRole="FIRMADMIN" />}
            <LockedRow label={P.listingApproval ?? "Listing Approval Required"} description={P.listingApprovalDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <Toggle checked={propOrg.listingApprovalRequired} onChange={(v) => setPropOrg({ ...propOrg, listingApprovalRequired: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label={P.whoCanCreate ?? "Who Can Create Listings"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <select className={SELECT_CLS} value={propOrg.whoCanCreateListing} onChange={(e) => setPropOrg({ ...propOrg, whoCanCreateListing: e.target.value })}>
                <option value="AGENT">{P.whoCanCreateAgent ?? "Agent and above"}</option>
                <option value="MANAGER">{P.whoCanCreateManager ?? "Manager and above"}</option>
                <option value="FIRMADMIN">{P.whoCanCreateFirmAdmin ?? "Firm Admin only"}</option>
              </select>
            </LockedRow>
            <LockedRow label={P.requiredFields ?? "Required Listing Fields"} description={P.requiredFieldsDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 300 }} value={propOrg.requiredFields} onChange={(e) => setPropOrg({ ...propOrg, requiredFields: e.target.value })} />
            </LockedRow>
            <LockedRow label={P.minPhotos ?? "Min Photos Required"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 80 }} type="number" value={propOrg.photoMinRequired} onChange={(e) => setPropOrg({ ...propOrg, photoMinRequired: e.target.value })} />
            </LockedRow>
            <LockedRow label={P.maxPhotos ?? "Max Photos per Listing"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 80 }} type="number" value={propOrg.photoLimit} onChange={(e) => setPropOrg({ ...propOrg, photoLimit: e.target.value })} />
            </LockedRow>
            <LockedRow label={P.descMaxChars ?? "Description Max Characters"} minRoleLabel={roleLabel("MANAGER")} canEdit={isManager}>
              <input className={INPUT_CLS} style={{ width: 100 }} type="number" value={propOrg.descMaxChars} onChange={(e) => setPropOrg({ ...propOrg, descMaxChars: e.target.value })} />
            </LockedRow>
            <LockedRow label={P.mlsSync ?? "MLS Auto-Sync"} description={P.mlsSyncDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <Toggle checked={propOrg.mlsSyncEnabled} onChange={(v) => setPropOrg({ ...propOrg, mlsSyncEnabled: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            {isFirmAdmin && <SaveBtn label={Sc.saveOrgPolicy ?? "Save Org Policy"} onClick={() => save("settings_prop_org", propOrg)} />}
          </div>
        )}
        {propTab === "personal" && (
          <div>
            <SettingRow label={P.defaultStatus ?? "Default Listing Status"}>
              <select className={SELECT_CLS} value={propPersonal.defaultStatus} onChange={(e) => setPropPersonal({ ...propPersonal, defaultStatus: e.target.value })}>
                <option value="ACTIVE">Active</option><option value="PENDING">Pending</option><option value="DRAFT">Draft</option>
              </select>
            </SettingRow>
            <SettingRow label={P.priceFormat ?? "Price Display Format"}>
              <select className={SELECT_CLS} value={propPersonal.priceFormat} onChange={(e) => setPropPersonal({ ...propPersonal, priceFormat: e.target.value })}>
                <option value="full">{P.priceFull ?? "Full ($1,250,000)"}</option>
                <option value="short">{P.priceShort ?? "Short ($1.25M)"}</option>
              </select>
            </SettingRow>
            <SettingRow label={P.autoAssignAgent ?? "Auto-Assign Me as Listing Agent"}><Toggle checked={propPersonal.defaultAgentSelf} onChange={(v) => setPropPersonal({ ...propPersonal, defaultAgentSelf: v })} /></SettingRow>
            <SettingRow label={P.requireSqft ?? "Require Square Footage"}><Toggle checked={propPersonal.requireSqft} onChange={(v) => setPropPersonal({ ...propPersonal, requireSqft: v })} /></SettingRow>
            <SaveBtn label={Sc.saveMyPreferences ?? "Save My Preferences"} onClick={() => save("settings_prop_personal", propPersonal)} />
          </div>
        )}
      </div>
    );
  };

  const renderFinance = () => {
    const F = S.finance ?? {};
    const tabs = [{ key: "org", label: Sc.firmPolicy ?? "Firm Policy", locked: !isFirmAdmin }, { key: "personal", label: Sc.myView ?? "My View" }];
    return (
      <div>
        <SectionHeader title={F.title ?? "Finance Settings"} description={F.desc ?? "Commission rates, splits, and fiscal configuration"} />
        <SubTabs tabs={tabs} active={finTab} onChange={(k) => setFinTab(k as any)} />
        {finTab === "org" && (
          <div>
            {!isFirmAdmin && <PolicyLockNotice minRole="FIRMADMIN" />}
            <div className="p-3 mb-4 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-amber-500/80">⚠️ {F.rateWarning}</div>
            <LockedRow label={F.defaultCommissionRate ?? "Default Commission Rate (%)"} description={F.defaultCommissionRateDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 100 }} type="number" step="0.1" value={finOrg.defaultCommissionRate} onChange={(e) => setFinOrg({ ...finOrg, defaultCommissionRate: e.target.value })} />
            </LockedRow>
            <LockedRow label={F.firmSplit ?? "Firm Split (%)"} description={F.firmSplitDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 100 }} type="number" step="1" value={finOrg.firmSplitPercent} onChange={(e) => setFinOrg({ ...finOrg, firmSplitPercent: e.target.value })} />
            </LockedRow>
            <LockedRow label={F.overrideCap ?? "Override / Bonus Cap (%)"} description={F.overrideCapDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 100 }} type="number" step="0.5" value={finOrg.overridePercent} onChange={(e) => setFinOrg({ ...finOrg, overridePercent: e.target.value })} />
            </LockedRow>
            <LockedRow label={F.fiscalYearStart ?? "Fiscal Year Start Month"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <select className={SELECT_CLS} value={finOrg.fiscalYearStart} onChange={(e) => setFinOrg({ ...finOrg, fiscalYearStart: e.target.value })}>
                {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                  <option key={i+1} value={String(i+1)}>{m}</option>
                ))}
              </select>
            </LockedRow>
            <LockedRow label={F.currency ?? "Currency"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <select className={SELECT_CLS} value={finOrg.currency} onChange={(e) => setFinOrg({ ...finOrg, currency: e.target.value })}>
                <option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — British Pound</option>
              </select>
            </LockedRow>
            <LockedRow label={F.showGrossLeaderboard ?? "Show Gross Commission in Leaderboard"} description={F.showGrossLeaderboardDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <Toggle checked={finOrg.showGrossInLeaderboard} onChange={(v) => setFinOrg({ ...finOrg, showGrossInLeaderboard: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label={F.requireReceipts ?? "Require Receipts for Expenses"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <Toggle checked={finOrg.requireExpenseReceipts} onChange={(v) => setFinOrg({ ...finOrg, requireExpenseReceipts: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label={F.taxReporting ?? "Tax Reporting Module Enabled"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <Toggle checked={finOrg.taxReportingEnabled} onChange={(v) => setFinOrg({ ...finOrg, taxReportingEnabled: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            {isFirmAdmin && <SaveBtn label={Sc.saveFirmPolicy ?? "Save Firm Policy"} onClick={() => save("settings_fin_org", finOrg)} />}
          </div>
        )}
        {finTab === "personal" && (
          <div>
            <SettingRow label={F.showNetDashboard ?? "Show Net Commission in My Dashboard"} description={F.showNetDashboardDesc}><Toggle checked={finPersonal.showNetInDashboard} onChange={(v) => setFinPersonal({ ...finPersonal, showNetInDashboard: v })} /></SettingRow>
            <SettingRow label={F.showLeaderboard ?? "Show Team Leaderboard"}><Toggle checked={finPersonal.showLeaderboard} onChange={(v) => setFinPersonal({ ...finPersonal, showLeaderboard: v })} /></SettingRow>
            <SettingRow label={F.preferredCurrency ?? "Preferred Currency Display"}>
              <select className={SELECT_CLS} value={finPersonal.preferredCurrency} onChange={(e) => setFinPersonal({ ...finPersonal, preferredCurrency: e.target.value })}>
                <option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option>
              </select>
            </SettingRow>
            <SaveBtn label={Sc.saveMyView ?? "Save My View"} onClick={() => save("settings_fin_personal", finPersonal)} />
          </div>
        )}
      </div>
    );
  };

  const renderAppointments = () => {
    const A = S.appointments ?? {};
    const tabs = [{ key: "org", label: Sc.orgPolicy ?? "Org Policy", locked: !isManager }, { key: "personal", label: Sc.myPreferences ?? "My Preferences" }];
    return (
      <div>
        <SectionHeader title={A.title ?? "Appointments"} description={A.desc ?? "Scheduling policies and personal calendar preferences"} />
        <SubTabs tabs={tabs} active={apptTab} onChange={(k) => setApptTab(k as any)} />
        {apptTab === "org" && (
          <div>
            {!isManager && <PolicyLockNotice minRole="MANAGER" />}
            <LockedRow label={A.workdayStart ?? "Firm Working Hours Start"} minRoleLabel={roleLabel("MANAGER")} canEdit={isManager}>
              <input className={INPUT_CLS} type="time" value={apptOrg.workdayStart} onChange={(e) => setApptOrg({ ...apptOrg, workdayStart: e.target.value })} />
            </LockedRow>
            <LockedRow label={A.workdayEnd ?? "Firm Working Hours End"} minRoleLabel={roleLabel("MANAGER")} canEdit={isManager}>
              <input className={INPUT_CLS} type="time" value={apptOrg.workdayEnd} onChange={(e) => setApptOrg({ ...apptOrg, workdayEnd: e.target.value })} />
            </LockedRow>
            <LockedRow label={A.showWeekends ?? "Show Weekends"} description={A.showWeekendsDesc} minRoleLabel={roleLabel("MANAGER")} canEdit={isManager}>
              <Toggle checked={apptOrg.showWeekends} onChange={(v) => setApptOrg({ ...apptOrg, showWeekends: v })} disabled={!isManager} />
            </LockedRow>
            <LockedRow label={A.cancellationNotice ?? "Cancellation Notice Required (hours)"} description={A.cancellationNoticeDesc} minRoleLabel={roleLabel("MANAGER")} canEdit={isManager}>
              <select className={SELECT_CLS} value={apptOrg.cancellationNoticehours} onChange={(e) => setApptOrg({ ...apptOrg, cancellationNoticehours: e.target.value })}>
                <option value="0">{A.noMinimum ?? "No minimum"}</option>
                <option value="2">2 hours</option><option value="12">12 hours</option><option value="24">24 hours</option><option value="48">48 hours</option>
              </select>
            </LockedRow>
            <LockedRow label={A.clientBooking ?? "Allow Client Self-Booking"} description={A.clientBookingDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <Toggle checked={apptOrg.allowClientBooking} onChange={(v) => setApptOrg({ ...apptOrg, allowClientBooking: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label={A.bufferBetween ?? "Buffer Between Appointments (min)"} minRoleLabel={roleLabel("MANAGER")} canEdit={isManager}>
              <select className={SELECT_CLS} value={apptOrg.bufferBetween} onChange={(e) => setApptOrg({ ...apptOrg, bufferBetween: e.target.value })}>
                {["0","5","10","15","30"].map((n) => <option key={n} value={n}>{n} min</option>)}
              </select>
            </LockedRow>
            <LockedRow label={A.maxAdvanceDays ?? "Max Advance Booking (days)"} description={A.maxAdvanceDaysDesc} minRoleLabel={roleLabel("MANAGER")} canEdit={isManager}>
              <input className={INPUT_CLS} style={{ width: 80 }} type="number" value={apptOrg.maxAdvanceBookingDays} onChange={(e) => setApptOrg({ ...apptOrg, maxAdvanceBookingDays: e.target.value })} />
            </LockedRow>
            {isManager && <SaveBtn label={Sc.saveOrgPolicy ?? "Save Org Policy"} onClick={() => save("settings_appt_org", apptOrg)} />}
          </div>
        )}
        {apptTab === "personal" && (
          <div>
            <SettingRow label={A.defaultDuration ?? "Default Duration (minutes)"}>
              <select className={SELECT_CLS} value={apptPersonal.defaultDuration} onChange={(e) => setApptPersonal({ ...apptPersonal, defaultDuration: e.target.value })}>
                {["15","30","45","60","90","120"].map((n) => <option key={n} value={n}>{n} min</option>)}
              </select>
            </SettingRow>
            <SettingRow label={A.reminderBefore ?? "Send Reminder (hours before)"}>
              <select className={SELECT_CLS} value={apptPersonal.reminderBefore} onChange={(e) => setApptPersonal({ ...apptPersonal, reminderBefore: e.target.value })}>
                {["1","2","4","12","24","48"].map((n) => <option key={n} value={n}>{n}h</option>)}
              </select>
            </SettingRow>
            <SettingRow label={A.personalBuffer ?? "Personal Buffer (min)"} description={A.personalBufferDesc}>
              <select className={SELECT_CLS} value={apptPersonal.personalBuffer} onChange={(e) => setApptPersonal({ ...apptPersonal, personalBuffer: e.target.value })}>
                {["0","5","10","15","30"].map((n) => <option key={n} value={n}>{n} min</option>)}
              </select>
            </SettingRow>
            <SettingRow label={A.autoConfirm ?? "Auto-Confirm Appointments"}><Toggle checked={apptPersonal.autoConfirm} onChange={(v) => setApptPersonal({ ...apptPersonal, autoConfirm: v })} /></SettingRow>
            <SettingRow label={A.calendarColor ?? "Calendar Color"}>
              <div className="flex gap-2">
                {["blue","green","purple","orange","red"].map((c) => (
                  <button key={c} onClick={() => setApptPersonal({ ...apptPersonal, colorCode: c })} className={`w-7 h-7 rounded-full border-2 transition-transform ${apptPersonal.colorCode === c ? "scale-125 border-foreground" : "border-transparent"}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </SettingRow>
            <SaveBtn label={Sc.saveMyPreferences ?? "Save My Preferences"} onClick={() => save("settings_appt_personal", apptPersonal)} />
          </div>
        )}
      </div>
    );
  };

  const renderDocuments = () => {
    const D = S.documents ?? {};
    const tabs = [{ key: "org", label: Sc.orgPolicy ?? "Org Policy", locked: !isFirmAdmin }, { key: "personal", label: Sc.myPreferences ?? "My Preferences" }];
    return (
      <div>
        <SectionHeader title={D.title ?? "Documents"} description={D.desc ?? "File management, retention and signature policies"} />
        <SubTabs tabs={tabs} active={docTab} onChange={(k) => setDocTab(k as any)} />
        {docTab === "org" && (
          <div>
            {!isFirmAdmin && <PolicyLockNotice minRole="FIRMADMIN" />}
            <LockedRow label={D.allowedTypes ?? "Allowed File Types"} description={D.allowedTypesDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 260 }} value={docOrg.allowedTypes} onChange={(e) => setDocOrg({ ...docOrg, allowedTypes: e.target.value })} />
            </LockedRow>
            <LockedRow label={D.maxFileSize ?? "Max File Size (MB)"} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 80 }} type="number" value={docOrg.maxFileSizeMb} onChange={(e) => setDocOrg({ ...docOrg, maxFileSizeMb: e.target.value })} />
            </LockedRow>
            <LockedRow label={D.retentionDays ?? "Retention Period (days)"} description={D.retentionDaysDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 100 }} type="number" value={docOrg.retentionDays} onChange={(e) => setDocOrg({ ...docOrg, retentionDays: e.target.value })} />
            </LockedRow>
            <LockedRow label={D.autoOrganize ?? "Auto-Organize by Transaction"} description={D.autoOrganizeDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <Toggle checked={docOrg.autoOrganizeByTransaction} onChange={(v) => setDocOrg({ ...docOrg, autoOrganizeByTransaction: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label={D.requireSignature ?? "Require E-Signature for Contracts"} description={D.requireSignatureDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <Toggle checked={docOrg.requireSignatureForContract} onChange={(v) => setDocOrg({ ...docOrg, requireSignatureForContract: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label={D.versionControl ?? "Version Control Enabled"} description={D.versionControlDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <Toggle checked={docOrg.versionControlEnabled} onChange={(v) => setDocOrg({ ...docOrg, versionControlEnabled: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label={D.auditTrail ?? "Audit Trail"} description={D.auditTrailDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <Toggle checked={docOrg.auditTrailEnabled} onChange={(v) => setDocOrg({ ...docOrg, auditTrailEnabled: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            {isFirmAdmin && <SaveBtn label={Sc.saveOrgPolicy ?? "Save Org Policy"} onClick={() => save("settings_doc_org", docOrg)} />}
          </div>
        )}
        {docTab === "personal" && (
          <div>
            <SettingRow label={D.defaultFolderView ?? "Default Folder View"}>
              <select className={SELECT_CLS} value={docPersonal.defaultFolderView} onChange={(e) => setDocPersonal({ ...docPersonal, defaultFolderView: e.target.value })}>
                <option value="transaction">{D.byTransaction ?? "By Transaction"}</option>
                <option value="type">{D.byType ?? "By Document Type"}</option>
                <option value="date">{D.byDate ?? "By Date"}</option>
                <option value="client">{D.byClient ?? "By Client"}</option>
              </select>
            </SettingRow>
            <SettingRow label={D.showThumbnails ?? "Show Thumbnails"} description={D.showThumbnailsDesc}><Toggle checked={docPersonal.showThumbnails} onChange={(v) => setDocPersonal({ ...docPersonal, showThumbnails: v })} /></SettingRow>
            <SettingRow label={D.autoTag ?? "Auto-Tag Documents with AI"} description={D.autoTagDesc}><Toggle checked={docPersonal.autoTagEnabled} onChange={(v) => setDocPersonal({ ...docPersonal, autoTagEnabled: v })} /></SettingRow>
            <SaveBtn label={Sc.saveMyPreferences ?? "Save My Preferences"} onClick={() => save("settings_doc_personal", docPersonal)} />
          </div>
        )}
      </div>
    );
  };

  const renderMarketing = () => {
    const M = S.marketing ?? {};
    const tabs = [{ key: "org", label: Sc.orgPolicy ?? "Org Policy", locked: !isManager }, { key: "personal", label: Sc.myPreferences ?? "My Preferences" }];
    return (
      <div>
        <SectionHeader title={M.title ?? "Marketing"} description={M.desc ?? "Campaign management, AI content, and brand guidelines"} />
        <SubTabs tabs={tabs} active={mktTab} onChange={(k) => setMktTab(k as any)} />
        {mktTab === "org" && (
          <div>
            {!isManager && <PolicyLockNotice minRole="MANAGER" />}
            <LockedRow label={M.aiContent ?? "AI Content Generation"} description={M.aiContentDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <Toggle checked={mktOrg.aiContentEnabled} onChange={(v) => setMktOrg({ ...mktOrg, aiContentEnabled: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label={M.allowedChannels ?? "Allowed Channels"} description={M.allowedChannelsDesc} minRoleLabel={roleLabel("MANAGER")} canEdit={isManager}>
              <input className={INPUT_CLS} style={{ width: 280 }} value={mktOrg.allowedChannels} onChange={(e) => setMktOrg({ ...mktOrg, allowedChannels: e.target.value })} />
            </LockedRow>
            <LockedRow label={M.brandVoice ?? "Brand Voice Guidelines"} description={M.brandVoiceDesc} minRoleLabel={roleLabel("MANAGER")} canEdit={isManager}>
              <textarea className={TEXTAREA_CLS} style={{ width: 320 }} rows={3} value={mktOrg.brandVoice} onChange={(e) => setMktOrg({ ...mktOrg, brandVoice: e.target.value })} />
            </LockedRow>
            <LockedRow label={M.requireApproval ?? "Require Manager Approval"} description={M.requireApprovalDesc} minRoleLabel={roleLabel("FIRMADMIN")} canEdit={isFirmAdmin}>
              <Toggle checked={mktOrg.requireManagerApproval} onChange={(v) => setMktOrg({ ...mktOrg, requireManagerApproval: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label={M.defaultHashtags ?? "Default Hashtags"} description={M.defaultHashtagsDesc} minRoleLabel={roleLabel("MANAGER")} canEdit={isManager}>
              <input className={INPUT_CLS} style={{ width: 280 }} value={mktOrg.defaultHashtags} onChange={(e) => setMktOrg({ ...mktOrg, defaultHashtags: e.target.value })} />
            </LockedRow>
            <LockedRow label={M.autoClose ?? "Auto-Close Campaigns After (days)"} description={M.autoCloseDesc} minRoleLabel={roleLabel("MANAGER")} canEdit={isManager}>
              <input className={INPUT_CLS} style={{ width: 80 }} type="number" value={mktOrg.autoCloseCampaignDays} onChange={(e) => setMktOrg({ ...mktOrg, autoCloseCampaignDays: e.target.value })} />
            </LockedRow>
            {isManager && <SaveBtn label={Sc.saveOrgPolicy ?? "Save Org Policy"} onClick={() => save("settings_mkt_org", mktOrg)} />}
          </div>
        )}
        {mktTab === "personal" && (
          <div>
            <SettingRow label={M.emailSignature ?? "Email Signature"} description={M.emailSignatureDesc}>
              <textarea className={TEXTAREA_CLS} style={{ width: 300 }} rows={4} value={mktPersonal.emailSignature} onChange={(e) => setMktPersonal({ ...mktPersonal, emailSignature: e.target.value })} placeholder="Jane Smith | Senior Broker | +1 (212) 555-0101" />
            </SettingRow>
            <SettingRow label={M.defaultTemplate ?? "Default Listing Template"}>
              <select className={SELECT_CLS} value={mktPersonal.defaultListingTemplate} onChange={(e) => setMktPersonal({ ...mktPersonal, defaultListingTemplate: e.target.value })}>
                <option value="">{M.templateNone ?? "None (blank)"}</option>
                <option value="luxury">{M.templateLuxury ?? "Luxury Residential"}</option>
                <option value="commercial">{M.templateCommercial ?? "Commercial"}</option>
                <option value="rental">{M.templateRental ?? "Rental"}</option>
                <option value="newdev">{M.templateNewDev ?? "New Development"}</option>
              </select>
            </SettingRow>
            <SettingRow label={M.preferredChannel ?? "Preferred Channel"}>
              <select className={SELECT_CLS} value={mktPersonal.preferredChannel} onChange={(e) => setMktPersonal({ ...mktPersonal, preferredChannel: e.target.value })}>
                <option value="email">Email</option><option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option><option value="linkedin">LinkedIn</option><option value="twitter">Twitter / X</option>
              </select>
            </SettingRow>
            <SettingRow label={M.autoSchedule ?? "Auto-Schedule Posts"} description={M.autoScheduleDesc}><Toggle checked={mktPersonal.autoScheduleEnabled} onChange={(v) => setMktPersonal({ ...mktPersonal, autoScheduleEnabled: v })} /></SettingRow>
            <SaveBtn label={Sc.saveMyPreferences ?? "Save My Preferences"} onClick={() => save("settings_mkt_personal", mktPersonal)} />
          </div>
        )}
      </div>
    );
  };

  // ── Section router ────────────────────────────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {
      case "profile":        return renderProfile();
      case "notifications":  return renderNotifications();
      case "org-settings":   return renderOrgSettings();
      case "access-control": return renderAccessControl();
      case "users":          return renderUsers();
      case "security":       return renderSecurity();
      case "appearance":     return renderAppearance();
      case "integrations":   return renderIntegrations();
      case "crm":            return renderCRM();
      case "properties":     return renderProperties();
      case "finance":        return renderFinance();
      case "appointments":   return renderAppointments();
      case "documents":      return renderDocuments();
      case "marketing":      return renderMarketing();
      default:               return null;
    }
  };

  // ── Layout ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-surface overflow-y-auto flex flex-col gap-1 py-4 px-2">
        {NAV.map((group) => {
          const visibleItems = group.items.filter((item: any) => !(item as any).adminOnly || isManager);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.group} className="mb-4">
              <div className="px-3 py-1 text-xs font-semibold uppercase tracking-widest text-foreground/30 mb-1">{group.group}</div>
              {visibleItems.map((item: any) => (
                <button key={item.key} onClick={() => setActiveSection(item.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    activeSection === item.key ? "bg-primary/10 text-primary font-medium" : "text-foreground/60 hover:text-foreground hover:bg-background"
                  }`}>
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {(item as any).adminOnly && !isFirmAdmin && <span className="text-xs text-foreground/30">🔒</span>}
                </button>
              ))}
            </div>
          );
        })}
        {/* Signed-in user */}
        <div className="mt-auto px-3 pt-4 border-t border-border">
          <div className="text-xs text-foreground/40 mb-1">{S.signedInAs ?? "Signed in as"}</div>
          <div className="text-xs font-medium text-foreground truncate">{user?.name || user?.email}</div>
          <div className="mt-1 inline-flex items-center px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-xs text-primary font-medium">
            {roleLabel(user?.role || "")}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8 max-w-3xl">
        {renderSection()}
      </main>
    </div>
  );
}
