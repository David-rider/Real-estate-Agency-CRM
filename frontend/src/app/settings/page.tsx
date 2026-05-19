"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTheme, ThemeName } from "@/lib/theme/ThemeContext";
import { useToast } from "@/components/ui/Toast";

// ─── Role hierarchy ─────────────────────────────────────────────────────────────
const ROLE_WEIGHT: Record<string, number> = {
  SUPERADMIN: 6,
  FIRMADMIN: 5,
  MANAGER: 4,
  AGENT: 3,
  MARKETING: 2,
  OFFICE_SUPPORT: 2,
  ATTORNEY: 1,
  LENDER: 1,
  TITLECO: 1,
};

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Super Admin",
  FIRMADMIN: "Firm Admin",
  MANAGER: "Manager",
  AGENT: "Agent",
  MARKETING: "Marketing",
  OFFICE_SUPPORT: "Office Support",
  ATTORNEY: "Attorney",
  LENDER: "Lender",
  TITLECO: "Title Co",
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

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-border"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-background rounded-full shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SectionHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="mb-6 pb-4 border-b border-border">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        {badge && (
          <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-xs text-primary font-medium">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-foreground/50 mt-1">{description}</p>
    </div>
  );
}

/** A standard settings row — label + optional description on the left, control on the right */
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-border/40 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && (
          <div className="text-xs text-foreground/50 mt-0.5">{description}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

/** A role-locked settings row — shows 🔒 badge and disables controls for insufficient roles */
function LockedRow({
  label,
  description,
  minRole,
  canEdit,
  children,
}: {
  label: string;
  description?: string;
  minRole: string;
  canEdit: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-6 py-4 border-b border-border/40 last:border-0 ${
        !canEdit ? "opacity-75" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {!canEdit && (
            <span className={LOCKED_BADGE}>
              🔒 {ROLE_LABELS[minRole] ?? minRole}+
            </span>
          )}
        </div>
        {description && (
          <div className="text-xs text-foreground/50 mt-0.5">{description}</div>
        )}
      </div>
      <div className={`shrink-0 ${!canEdit ? "pointer-events-none opacity-50" : ""}`}>
        {children}
      </div>
    </div>
  );
}

/** Sub-tab bar used inside each feature section */
function SubTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; locked?: boolean }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex mb-6 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            active === tab.key
              ? "border-primary text-primary"
              : "border-transparent text-foreground/50 hover:text-foreground"
          }`}
        >
          {tab.label}
          {tab.locked && <span className="text-amber-500/70">🔒</span>}
        </button>
      ))}
    </div>
  );
}

/** Info callout for locked org-policy sections */
function PolicyLockNotice({ role }: { role: string }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg mb-6">
      <span className="text-lg">🔒</span>
      <div>
        <div className="text-sm font-medium text-amber-500/90">Org Policy — View Only</div>
        <div className="text-xs text-foreground/50 mt-0.5">
          These settings are controlled by your firm administrator. You need{" "}
          <strong>{ROLE_LABELS[role] ?? role}</strong> access or higher to change them.
        </div>
      </div>
    </div>
  );
}

// ─── Permission level types ─────────────────────────────────────────────────────
type PermLevel = "full" | "team" | "own" | "read" | "none";

const PERM_OPTIONS: { value: PermLevel; label: string; color: string }[] = [
  { value: "full",  label: "Full",  color: "text-green-500" },
  { value: "team",  label: "Team",  color: "text-blue-500" },
  { value: "own",   label: "Own",   color: "text-primary" },
  { value: "read",  label: "Read",  color: "text-foreground/50" },
  { value: "none",  label: "None",  color: "text-red-400" },
];

const MATRIX_MODULES = [
  { key: "crm",          label: "CRM / Clients" },
  { key: "properties",   label: "Properties" },
  { key: "transactions", label: "Transactions" },
  { key: "finance",      label: "Finance" },
  { key: "appointments", label: "Appointments" },
  { key: "documents",    label: "Documents" },
  { key: "marketing",    label: "Marketing" },
  { key: "reports",      label: "Reports" },
];

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

// ─── Nav definition ─────────────────────────────────────────────────────────────
const NAV = [
  {
    group: "Account",
    items: [
      { key: "profile",       label: "Profile",        icon: "👤" },
      { key: "notifications", label: "Notifications",  icon: "🔔" },
    ],
  },
  {
    group: "Organization",
    items: [
      { key: "org-settings",  label: "Org Settings",   icon: "🏢", adminOnly: true },
      { key: "access-control",label: "Access Control", icon: "🛡️", adminOnly: true },
      { key: "users",         label: "Team & Roles",   icon: "👥", adminOnly: true },
      { key: "security",      label: "Security",       icon: "🔐" },
      { key: "appearance",    label: "Appearance",     icon: "🎨" },
      { key: "integrations",  label: "Integrations",   icon: "🔗" },
    ],
  },
  {
    group: "Features",
    items: [
      { key: "crm",          label: "CRM",          icon: "🧑‍🤝‍🧑" },
      { key: "properties",   label: "Properties",   icon: "🏠" },
      { key: "finance",      label: "Finance",      icon: "💰" },
      { key: "appointments", label: "Appointments", icon: "📅" },
      { key: "documents",    label: "Documents",    icon: "📄" },
      { key: "marketing",    label: "Marketing",    icon: "📣" },
    ],
  },
];

// ─── Default state ───────────────────────────────────────────────────────────────
const DEFAULT_PROFILE = { name: "", phone: "", title: "", timezone: "America/New_York", bio: "", licenseNumber: "", linkedIn: "" };

const DEFAULT_NOTIF = {
  emailNewClient: true, emailAppointmentReminder: true, emailTransactionUpdate: true,
  emailOfferReceived: true, emailCommissionPaid: false, emailWeeklyReport: true,
  inAppAll: true, inAppMentions: true, smsUrgent: false, digestFrequency: "daily",
};

// Org-level CRM policy (FIRMADMIN+)
const DEFAULT_CRM_ORG = {
  requiredFields: "firstName,lastName,phone",
  maxClientsPerAgent: "100",
  leadSources: "Referral,Zillow,StreetEasy,Website,Cold Call,Open House",
  clientVisibility: "own", // own | team | all
  autoArchiveDays: "180",
  duplicateEmailCheck: true,
  allowAgentSelfAssign: true,
};

// Personal CRM prefs
const DEFAULT_CRM_PERSONAL = {
  defaultClientType: "BUYER",
  autoAssignToMe: true,
  defaultFunnelStage: "LEAD",
  showBudgetField: true,
  compactView: false,
};

// Org-level property policy
const DEFAULT_PROP_ORG = {
  listingApprovalRequired: false,
  whoCanCreateListing: "AGENT", // AGENT | MANAGER | FIRMADMIN
  requiredFields: "address,city,state,zip,price,beds,baths",
  photoMinRequired: "3",
  photoLimit: "25",
  mlsSyncEnabled: false,
  descMaxChars: "1500",
};

// Personal property prefs
const DEFAULT_PROP_PERSONAL = {
  defaultStatus: "ACTIVE",
  priceFormat: "full",
  defaultAgentSelf: true,
  requireSqft: false,
};

// Finance (org policy only — locked to FIRMADMIN+)
const DEFAULT_FINANCE_ORG = {
  defaultCommissionRate: "2.5",
  firmSplitPercent: "25",
  overridePercent: "5",
  fiscalYearStart: "1",
  currency: "USD",
  showGrossInLeaderboard: false,
  requireExpenseReceipts: true,
  taxReportingEnabled: true,
};

// Finance personal prefs (agents can adjust their own view)
const DEFAULT_FINANCE_PERSONAL = {
  showNetInDashboard: true,
  showLeaderboard: true,
  preferredCurrency: "USD",
};

// Org-level appointment policy
const DEFAULT_APPT_ORG = {
  workdayStart: "09:00",
  workdayEnd: "18:00",
  showWeekends: false,
  cancellationNoticehours: "24",
  allowClientBooking: false,
  bufferBetween: "15",
  maxAdvanceBookingDays: "60",
};

// Personal appointment prefs
const DEFAULT_APPT_PERSONAL = {
  defaultDuration: "60",
  reminderBefore: "24",
  personalBuffer: "10",
  autoConfirm: true,
  colorCode: "blue",
};

// Documents org policy
const DEFAULT_DOC_ORG = {
  allowedTypes: "PDF,DOCX,XLSX,PNG,JPG",
  maxFileSizeMb: "25",
  retentionDays: "365",
  autoOrganizeByTransaction: true,
  requireSignatureForContract: true,
  versionControlEnabled: true,
  auditTrailEnabled: true,
};

// Documents personal prefs
const DEFAULT_DOC_PERSONAL = {
  defaultFolderView: "transaction",
  showThumbnails: true,
  autoTagEnabled: true,
};

// Marketing org policy
const DEFAULT_MKT_ORG = {
  aiContentEnabled: true,
  allowedChannels: "email,instagram,facebook",
  brandVoice: "Professional, sophisticated, and trustworthy. Highlight luxury and exclusivity.",
  requireManagerApproval: false,
  autoCloseCampaignDays: "30",
  defaultHashtags: "#NYCRealEstate #LuxuryHomes #Manhattan",
};

// Marketing personal prefs
const DEFAULT_MKT_PERSONAL = {
  emailSignature: "",
  defaultListingTemplate: "",
  preferredChannel: "email",
  autoScheduleEnabled: false,
};

// ─── Main component ──────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  // Role-based helpers
  const userWeight = ROLE_WEIGHT[user?.role || ""] || 0;
  const canEdit = (minRole: string) => userWeight >= (ROLE_WEIGHT[minRole] || 0);
  const isFirmAdmin = canEdit("FIRMADMIN");
  const isManager   = canEdit("MANAGER");

  const [activeSection, setActiveSection] = React.useState("profile");

  // ── Sub-tab state for each feature section ──────────────────────────────────
  const [crmTab,  setCrmTab]  = React.useState<"org" | "personal">("org");
  const [propTab, setPropTab] = React.useState<"org" | "personal">("org");
  const [finTab,  setFinTab]  = React.useState<"org" | "personal">("org");
  const [apptTab, setApptTab] = React.useState<"org" | "personal">("org");
  const [docTab,  setDocTab]  = React.useState<"org" | "personal">("org");
  const [mktTab,  setMktTab]  = React.useState<"org" | "personal">("org");

  // ── Users / Team state ──────────────────────────────────────────────────────
  const [users, setUsers] = React.useState<any[]>([]);
  const [usersLoading, setUsersLoading] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("AGENT");

  // ── Permissions matrix ──────────────────────────────────────────────────────
  const loadMatrix = () => {
    try {
      return JSON.parse(localStorage.getItem("settings_access_matrix") || "null") || DEFAULT_ACCESS;
    } catch { return DEFAULT_ACCESS; }
  };
  const [accessMatrix, setAccessMatrix] = React.useState<Record<string, Record<string, PermLevel>>>(loadMatrix);

  const setMatrixCell = (mod: string, role: string, val: PermLevel) => {
    setAccessMatrix((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [role]: val },
    }));
  };

  // ── Profile state ───────────────────────────────────────────────────────────
  const [profile, setProfile] = React.useState(() => {
    try { return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem("settings_profile") || "{}") }; }
    catch { return DEFAULT_PROFILE; }
  });

  // ── Org settings state ──────────────────────────────────────────────────────
  const [orgSettings, setOrgSettings] = React.useState({
    companyName: "XYZ Realty Group",
    website: "https://xyzrealty.com",
    address: "350 Fifth Ave, New York, NY 10118",
    licenseNumber: "10401234567",
    phone: "+1 (212) 555-0100",
    logoUrl: "",
  });

  // ── Notifications ───────────────────────────────────────────────────────────
  const [notif, setNotif] = React.useState(() => {
    try { return { ...DEFAULT_NOTIF, ...JSON.parse(localStorage.getItem("settings_notif") || "{}") }; }
    catch { return DEFAULT_NOTIF; }
  });

  // ── CRM ─────────────────────────────────────────────────────────────────────
  const [crmOrg, setCrmOrg] = React.useState(() => {
    try { return { ...DEFAULT_CRM_ORG, ...JSON.parse(localStorage.getItem("settings_crm_org") || "{}") }; }
    catch { return DEFAULT_CRM_ORG; }
  });
  const [crmPersonal, setCrmPersonal] = React.useState(() => {
    try { return { ...DEFAULT_CRM_PERSONAL, ...JSON.parse(localStorage.getItem("settings_crm_personal") || "{}") }; }
    catch { return DEFAULT_CRM_PERSONAL; }
  });

  // ── Properties ──────────────────────────────────────────────────────────────
  const [propOrg, setPropOrg] = React.useState(() => {
    try { return { ...DEFAULT_PROP_ORG, ...JSON.parse(localStorage.getItem("settings_prop_org") || "{}") }; }
    catch { return DEFAULT_PROP_ORG; }
  });
  const [propPersonal, setPropPersonal] = React.useState(() => {
    try { return { ...DEFAULT_PROP_PERSONAL, ...JSON.parse(localStorage.getItem("settings_prop_personal") || "{}") }; }
    catch { return DEFAULT_PROP_PERSONAL; }
  });

  // ── Finance ─────────────────────────────────────────────────────────────────
  const [finOrg, setFinOrg] = React.useState(() => {
    try { return { ...DEFAULT_FINANCE_ORG, ...JSON.parse(localStorage.getItem("settings_fin_org") || "{}") }; }
    catch { return DEFAULT_FINANCE_ORG; }
  });
  const [finPersonal, setFinPersonal] = React.useState(() => {
    try { return { ...DEFAULT_FINANCE_PERSONAL, ...JSON.parse(localStorage.getItem("settings_fin_personal") || "{}") }; }
    catch { return DEFAULT_FINANCE_PERSONAL; }
  });

  // ── Appointments ─────────────────────────────────────────────────────────────
  const [apptOrg, setApptOrg] = React.useState(() => {
    try { return { ...DEFAULT_APPT_ORG, ...JSON.parse(localStorage.getItem("settings_appt_org") || "{}") }; }
    catch { return DEFAULT_APPT_ORG; }
  });
  const [apptPersonal, setApptPersonal] = React.useState(() => {
    try { return { ...DEFAULT_APPT_PERSONAL, ...JSON.parse(localStorage.getItem("settings_appt_personal") || "{}") }; }
    catch { return DEFAULT_APPT_PERSONAL; }
  });

  // ── Documents ────────────────────────────────────────────────────────────────
  const [docOrg, setDocOrg] = React.useState(() => {
    try { return { ...DEFAULT_DOC_ORG, ...JSON.parse(localStorage.getItem("settings_doc_org") || "{}") }; }
    catch { return DEFAULT_DOC_ORG; }
  });
  const [docPersonal, setDocPersonal] = React.useState(() => {
    try { return { ...DEFAULT_DOC_PERSONAL, ...JSON.parse(localStorage.getItem("settings_doc_personal") || "{}") }; }
    catch { return DEFAULT_DOC_PERSONAL; }
  });

  // ── Marketing ────────────────────────────────────────────────────────────────
  const [mktOrg, setMktOrg] = React.useState(() => {
    try { return { ...DEFAULT_MKT_ORG, ...JSON.parse(localStorage.getItem("settings_mkt_org") || "{}") }; }
    catch { return DEFAULT_MKT_ORG; }
  });
  const [mktPersonal, setMktPersonal] = React.useState(() => {
    try { return { ...DEFAULT_MKT_PERSONAL, ...JSON.parse(localStorage.getItem("settings_mkt_personal") || "{}") }; }
    catch { return DEFAULT_MKT_PERSONAL; }
  });

  // ── Security ─────────────────────────────────────────────────────────────────
  const [security, setSecurity] = React.useState({
    twoFAEnabled: false,
    sessionTimeout: "60",
    ipWhitelist: "",
    loginAlerts: true,
    passwordExpiry: "90",
    minPasswordLength: "10",
    requireSpecialChar: true,
    forceLogoutOnPwChange: true,
  });

  // ── Integrations ─────────────────────────────────────────────────────────────
  const [integrations, setIntegrations] = React.useState({
    stripeConnected: false,
    googleCalendarConnected: false,
    mlsConnected: false,
    docusignConnected: false,
    mailchimpConnected: false,
    zapierConnected: false,
    mapboxKey: "",
    openaiKey: "",
  });

  // ── Load team users ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (activeSection !== "users") return;
    setUsersLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/settings/users`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, [activeSection]);

  // ── Save helpers ─────────────────────────────────────────────────────────────
  const save = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
    toast.success("Settings saved");
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/settings/users/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
        toast.success("Role updated");
      } else {
        toast.error("Failed to update role");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/settings/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        }
      );
      if (res.ok) {
        toast.success(`Invitation sent to ${inviteEmail}`);
        setInviteEmail("");
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to send invite");
      }
    } catch {
      toast.error("Network error");
    }
  };

  // ── Rendered sections ────────────────────────────────────────────────────────

  const renderProfile = () => (
    <div>
      <SectionHeader title="Profile" description="Your personal information visible to teammates" />
      <div className="space-y-0">
        <SettingRow label="Full Name" description="Displayed across the platform">
          <input className={INPUT_CLS} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Jane Smith" />
        </SettingRow>
        <SettingRow label="Professional Title" description="e.g. Licensed Real Estate Salesperson">
          <input className={INPUT_CLS} value={profile.title} onChange={(e) => setProfile({ ...profile, title: e.target.value })} placeholder="Senior Broker Associate" />
        </SettingRow>
        <SettingRow label="Phone" description="Client-facing contact number">
          <input className={INPUT_CLS} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+1 (212) 555-0101" />
        </SettingRow>
        <SettingRow label="License Number" description="NY State real estate license">
          <input className={INPUT_CLS} value={profile.licenseNumber} onChange={(e) => setProfile({ ...profile, licenseNumber: e.target.value })} placeholder="10491234567" />
        </SettingRow>
        <SettingRow label="LinkedIn Profile">
          <input className={INPUT_CLS} value={profile.linkedIn} onChange={(e) => setProfile({ ...profile, linkedIn: e.target.value })} placeholder="https://linkedin.com/in/..." />
        </SettingRow>
        <SettingRow label="Timezone">
          <select className={SELECT_CLS} value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}>
            <option value="America/New_York">Eastern (ET)</option>
            <option value="America/Chicago">Central (CT)</option>
            <option value="America/Denver">Mountain (MT)</option>
            <option value="America/Los_Angeles">Pacific (PT)</option>
          </select>
        </SettingRow>
        <SettingRow label="Bio" description="Shown on your public profile page">
          <textarea className={TEXTAREA_CLS} style={{ width: 280 }} rows={3} value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="NYC specialist with 10+ years..." />
        </SettingRow>
      </div>
      <div className="mt-6 flex gap-3">
        <button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors" onClick={() => save("settings_profile", profile)}>
          Save Profile
        </button>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div>
      <SectionHeader title="Notifications" description="Choose when and how you receive alerts" />
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-2">Email Alerts</div>
        <div className="space-y-0">
          <SettingRow label="New client assigned" description="When a lead is assigned to you"><Toggle checked={notif.emailNewClient} onChange={(v) => setNotif({ ...notif, emailNewClient: v })} /></SettingRow>
          <SettingRow label="Appointment reminder" description="24h before scheduled appointment"><Toggle checked={notif.emailAppointmentReminder} onChange={(v) => setNotif({ ...notif, emailAppointmentReminder: v })} /></SettingRow>
          <SettingRow label="Transaction status update"><Toggle checked={notif.emailTransactionUpdate} onChange={(v) => setNotif({ ...notif, emailTransactionUpdate: v })} /></SettingRow>
          <SettingRow label="Offer received on listing"><Toggle checked={notif.emailOfferReceived} onChange={(v) => setNotif({ ...notif, emailOfferReceived: v })} /></SettingRow>
          <SettingRow label="Commission payment processed"><Toggle checked={notif.emailCommissionPaid} onChange={(v) => setNotif({ ...notif, emailCommissionPaid: v })} /></SettingRow>
          <SettingRow label="Weekly performance digest"><Toggle checked={notif.emailWeeklyReport} onChange={(v) => setNotif({ ...notif, emailWeeklyReport: v })} /></SettingRow>
        </div>
      </div>
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-2">In-App &amp; SMS</div>
        <div className="space-y-0">
          <SettingRow label="In-app notifications (all)"><Toggle checked={notif.inAppAll} onChange={(v) => setNotif({ ...notif, inAppAll: v })} /></SettingRow>
          <SettingRow label="Mention &amp; @tag alerts"><Toggle checked={notif.inAppMentions} onChange={(v) => setNotif({ ...notif, inAppMentions: v })} /></SettingRow>
          <SettingRow label="Urgent SMS alerts" description="Requires verified phone number"><Toggle checked={notif.smsUrgent} onChange={(v) => setNotif({ ...notif, smsUrgent: v })} /></SettingRow>
        </div>
      </div>
      <SettingRow label="Digest Frequency">
        <select className={SELECT_CLS} value={notif.digestFrequency} onChange={(e) => setNotif({ ...notif, digestFrequency: e.target.value })}>
          <option value="realtime">Real-time</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="none">Off</option>
        </select>
      </SettingRow>
      <div className="mt-6">
        <button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={() => save("settings_notif", notif)}>
          Save Preferences
        </button>
      </div>
    </div>
  );

  const renderOrgSettings = () => (
    <div>
      <SectionHeader title="Org Settings" description="Firm-wide configuration. Changes affect all team members." badge="Firm Admin" />
      {!isFirmAdmin && <PolicyLockNotice role="FIRMADMIN" />}
      <div className="space-y-0">
        <LockedRow label="Company Name" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} value={orgSettings.companyName} onChange={(e) => setOrgSettings({ ...orgSettings, companyName: e.target.value })} />
        </LockedRow>
        <LockedRow label="Website" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} value={orgSettings.website} onChange={(e) => setOrgSettings({ ...orgSettings, website: e.target.value })} />
        </LockedRow>
        <LockedRow label="Office Address" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} style={{ width: 280 }} value={orgSettings.address} onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })} />
        </LockedRow>
        <LockedRow label="Office Phone" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} value={orgSettings.phone} onChange={(e) => setOrgSettings({ ...orgSettings, phone: e.target.value })} />
        </LockedRow>
        <LockedRow label="NY State Brokerage License" description="Displayed on all public materials" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} value={orgSettings.licenseNumber} onChange={(e) => setOrgSettings({ ...orgSettings, licenseNumber: e.target.value })} />
        </LockedRow>
        <LockedRow label="Logo URL" description="Square PNG or SVG, min 256×256" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} style={{ width: 280 }} value={orgSettings.logoUrl} onChange={(e) => setOrgSettings({ ...orgSettings, logoUrl: e.target.value })} placeholder="https://cdn.example.com/logo.png" />
        </LockedRow>
      </div>
      <div className="mt-6 pb-6 border-b border-border">
        <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-4">Subscription</div>
        <div className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
          <div>
            <div className="text-sm font-semibold text-foreground">{user?.tier || "CORE"} Plan</div>
            <div className="text-xs text-foreground/50 mt-0.5">Billed monthly · Next renewal Jun 1, 2026</div>
          </div>
          <a href="/upgrade" className="px-3 py-1.5 bg-primary text-background rounded-lg text-xs font-medium hover:bg-primary/90">
            Upgrade
          </a>
        </div>
      </div>
      <div className="mt-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-4">Data &amp; Compliance</div>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-foreground hover:bg-background transition-colors" onClick={() => toast.info("GDPR data export will be emailed within 24 hours.")}>
            Export All Data (GDPR)
          </button>
          <button className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-foreground hover:bg-background transition-colors" onClick={() => toast.info("Audit log download started.")}>
            Download Audit Log
          </button>
        </div>
      </div>
      {isFirmAdmin && (
        <div className="mt-6">
          <button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={() => toast.success("Org settings saved")}>
            Save Org Settings
          </button>
        </div>
      )}
    </div>
  );

  const renderAccessControl = () => (
    <div>
      <SectionHeader title="Access Control" description="Define what each role can see and do in each module." badge="Firm Admin" />
      {!isFirmAdmin && <PolicyLockNotice role="FIRMADMIN" />}

      <div className="text-xs text-foreground/50 mb-4">
        Permission levels: <strong className="text-green-500">Full</strong> = all records &amp; admin actions ·{" "}
        <strong className="text-blue-500">Team</strong> = team records ·{" "}
        <strong className="text-primary">Own</strong> = own records only ·{" "}
        <strong className="text-foreground/50">Read</strong> = view only ·{" "}
        <strong className="text-red-400">None</strong> = hidden
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-foreground/40 w-36">Module</th>
              {MATRIX_ROLES.map((role) => (
                <th key={role} className="text-center px-2 py-3 text-xs font-semibold uppercase tracking-widest text-foreground/40">
                  {ROLE_LABELS[role]}
                </th>
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
                      <select
                        value={val}
                        disabled={!isFirmAdmin}
                        onChange={(e) => setMatrixCell(mod.key, role, e.target.value as PermLevel)}
                        className={`text-xs px-1.5 py-1 rounded border border-border bg-background outline-none cursor-pointer disabled:cursor-default ${opt?.color ?? ""}`}
                      >
                        {PERM_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value} className={o.color}>
                            {o.label}
                          </option>
                        ))}
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
        <strong>Note:</strong> SUPERADMIN and FIRMADMIN always have full access to all modules. MANAGER inherits at least the permissions shown here. These settings take effect immediately upon save.
      </div>

      {isFirmAdmin && (
        <div className="mt-6 flex gap-3">
          <button
            className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90"
            onClick={() => { localStorage.setItem("settings_access_matrix", JSON.stringify(accessMatrix)); toast.success("Access matrix saved"); }}
          >
            Save Access Matrix
          </button>
          <button
            className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-foreground hover:bg-background"
            onClick={() => { setAccessMatrix(DEFAULT_ACCESS); toast.info("Reset to defaults"); }}
          >
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div>
      <SectionHeader title="Team &amp; Roles" description="Manage team members, roles and access levels" badge={isManager ? "Manager+" : undefined} />
      {!isManager && <PolicyLockNotice role="MANAGER" />}

      {isManager && (
        <div className="mb-6 p-4 bg-surface border border-border rounded-lg">
          <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3">Invite Team Member</div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-foreground/50 mb-1">Email Address</label>
              <input className={`${INPUT_CLS} w-full`} value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@xyz.com" type="email" />
            </div>
            <div>
              <label className="block text-xs text-foreground/50 mb-1">Role</label>
              <select className={SELECT_CLS} value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                {Object.entries(ROLE_LABELS).filter(([k]) => k !== "SUPERADMIN" && (!isFirmAdmin ? k !== "FIRMADMIN" : true)).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <button className="px-4 py-1.5 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={handleInvite}>
              Send Invite
            </button>
          </div>
        </div>
      )}

      {usersLoading ? (
        <div className="flex items-center gap-3 py-8 text-foreground/50 text-sm"><div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" /> Loading team...</div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-foreground/40">Member</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-foreground/40">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-foreground/40">Tier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-foreground/40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-foreground/40 text-sm">No team members found.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-b border-border/40 last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{u.name}</div>
                    <div className="text-xs text-foreground/50">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {isManager && u.id !== user?.id ? (
                      <select
                        className={SELECT_CLS}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={!canEdit("FIRMADMIN") && u.role === "FIRMADMIN"}
                      >
                        {Object.entries(ROLE_LABELS).filter(([k]) => k !== "SUPERADMIN").map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{ROLE_LABELS[u.role] ?? u.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-foreground/60">{u.tier || "CORE"}</span>
                  </td>
                  <td className="px-4 py-3">
                    {isManager && u.id !== user?.id && (
                      <button className="text-xs text-red-400 hover:text-red-300 transition-colors" onClick={() => toast.info(`Deactivation requires confirmation — feature coming soon`)}>
                        Deactivate
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

  const renderSecurity = () => (
    <div>
      <SectionHeader title="Security" description="Authentication and session security settings" />

      <div className="mb-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-2">Personal Security</div>
      </div>
      <div className="space-y-0 mb-6">
        <SettingRow label="Two-Factor Authentication" description="Adds SMS or authenticator-app verification">
          <Toggle checked={security.twoFAEnabled} onChange={(v) => setSecurity({ ...security, twoFAEnabled: v })} />
        </SettingRow>
        <SettingRow label="Login Alerts" description="Email me when a new device logs in">
          <Toggle checked={security.loginAlerts} onChange={(v) => setSecurity({ ...security, loginAlerts: v })} />
        </SettingRow>
        <SettingRow label="Session Timeout (minutes)" description="Auto-logout after inactivity">
          <select className={SELECT_CLS} value={security.sessionTimeout} onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}>
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="60">60 min</option>
            <option value="120">2 hours</option>
            <option value="480">8 hours</option>
          </select>
        </SettingRow>
        <SettingRow label="Change Password">
          <button className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs text-foreground hover:bg-background" onClick={() => toast.info("Password change email sent")}>
            Send Reset Link
          </button>
        </SettingRow>
      </div>

      <div className="mb-2">
        <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-2">Org Security Policy</div>
      </div>
      <div className="space-y-0 mb-6">
        <LockedRow label="Minimum Password Length" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
          <select className={SELECT_CLS} value={security.minPasswordLength} onChange={(e) => setSecurity({ ...security, minPasswordLength: e.target.value })}>
            {["8","10","12","14","16"].map((n) => <option key={n} value={n}>{n} characters</option>)}
          </select>
        </LockedRow>
        <LockedRow label="Require Special Character" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
          <Toggle checked={security.requireSpecialChar} onChange={(v) => setSecurity({ ...security, requireSpecialChar: v })} disabled={!isFirmAdmin} />
        </LockedRow>
        <LockedRow label="Password Expiry (days)" description="0 = never expire" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} style={{ width: 80 }} value={security.passwordExpiry} onChange={(e) => setSecurity({ ...security, passwordExpiry: e.target.value })} />
        </LockedRow>
        <LockedRow label="Force Logout on Password Change" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
          <Toggle checked={security.forceLogoutOnPwChange} onChange={(v) => setSecurity({ ...security, forceLogoutOnPwChange: v })} disabled={!isFirmAdmin} />
        </LockedRow>
        <LockedRow label="IP Whitelist" description="Comma-separated CIDR ranges. Leave blank to allow all." minRole="FIRMADMIN" canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} style={{ width: 240 }} value={security.ipWhitelist} onChange={(e) => setSecurity({ ...security, ipWhitelist: e.target.value })} placeholder="192.168.1.0/24" />
        </LockedRow>
      </div>

      <div className="flex gap-3">
        <button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={() => toast.success("Security settings saved")}>
          Save Security Settings
        </button>
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div>
      <SectionHeader title="Appearance" description="Customize how the platform looks for you" />
      <SettingRow label="Theme" description="Affects your view only">
        <div className="flex gap-2">
          {(["light", "dark", "midnight", "sepia"] as ThemeName[]).map((t) => (
            <button key={t} onClick={() => setTheme(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${theme === t ? "bg-primary text-background border-primary" : "bg-surface border-border text-foreground/60 hover:border-primary/50"}`}>
              {t}
            </button>
          ))}
        </div>
      </SettingRow>
      <SettingRow label="Sidebar Position" description="Navigation placement">
        <select className={SELECT_CLS}>
          <option>Left (default)</option>
          <option>Collapsed</option>
        </select>
      </SettingRow>
      <SettingRow label="Density" description="Compact vs comfortable spacing">
        <select className={SELECT_CLS}>
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
          <option value="spacious">Spacious</option>
        </select>
      </SettingRow>
      <SettingRow label="Date Format">
        <select className={SELECT_CLS}>
          <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
          <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
        </select>
      </SettingRow>
      <SettingRow label="Number Format">
        <select className={SELECT_CLS}>
          <option value="1,234,567">1,234,567 (US)</option>
          <option value="1.234.567">1.234.567 (EU)</option>
        </select>
      </SettingRow>
    </div>
  );

  const renderIntegrations = () => (
    <div>
      <SectionHeader title="Integrations" description="Connect third-party services and APIs" />

      {[
        { key: "stripeConnected", label: "Stripe Payments", desc: "Accept commission splits and manage billing", icon: "💳", adminOnly: true },
        { key: "googleCalendarConnected", label: "Google Calendar", desc: "Sync appointments bi-directionally", icon: "📆", adminOnly: false },
        { key: "mlsConnected", label: "NYC MLS / RLS", desc: "Auto-import and sync listings from MLS", icon: "🏙️", adminOnly: true },
        { key: "docusignConnected", label: "DocuSign", desc: "Send contracts for e-signature", icon: "✍️", adminOnly: false },
        { key: "mailchimpConnected", label: "Mailchimp", desc: "Sync contacts and run email campaigns", icon: "✉️", adminOnly: false },
        { key: "zapierConnected", label: "Zapier", desc: "Automate workflows with 5000+ apps", icon: "⚡", adminOnly: false },
      ].map(({ key, label, desc, icon, adminOnly }) => {
        const connected = integrations[key as keyof typeof integrations] as boolean;
        const editable = !adminOnly || isFirmAdmin;
        return (
          <div key={key} className="flex items-center justify-between py-4 border-b border-border/40 last:border-0">
            <div className="flex items-center gap-3">
              <span className="text-xl w-8 text-center">{icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  {adminOnly && !isFirmAdmin && <span className={LOCKED_BADGE}>🔒 Firm Admin+</span>}
                  {connected && <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-500">Connected</span>}
                </div>
                <div className="text-xs text-foreground/50">{desc}</div>
              </div>
            </div>
            <button
              disabled={!editable}
              onClick={() => {
                if (!editable) return;
                setIntegrations({ ...integrations, [key]: !connected });
                toast.info(connected ? `${label} disconnected` : `${label} connection flow coming soon`);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                connected
                  ? "bg-surface border-border text-foreground/60 hover:border-red-400 hover:text-red-400"
                  : "bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-background"
              } ${!editable ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        );
      })}

      <div className="mt-6 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40">API Keys</div>
        <LockedRow label="Mapbox Public Token" description="For property map features" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} style={{ width: 260 }} type="password" value={integrations.mapboxKey} onChange={(e) => setIntegrations({ ...integrations, mapboxKey: e.target.value })} placeholder="pk.eyJ1..." />
        </LockedRow>
        <LockedRow label="OpenAI API Key" description="Powers AI content and analysis features" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
          <input className={INPUT_CLS} style={{ width: 260 }} type="password" value={integrations.openaiKey} onChange={(e) => setIntegrations({ ...integrations, openaiKey: e.target.value })} placeholder="sk-..." />
        </LockedRow>
      </div>
    </div>
  );

  const renderCRM = () => {
    const tabs = [
      { key: "org",      label: "Org Policy",     locked: !isFirmAdmin },
      { key: "personal", label: "My Preferences" },
    ];
    return (
      <div>
        <SectionHeader title="CRM Settings" description="Client relationship management configuration" />
        <SubTabs tabs={tabs} active={crmTab} onChange={(k) => setCrmTab(k as any)} />

        {crmTab === "org" && (
          <div>
            {!isFirmAdmin && <PolicyLockNotice role="FIRMADMIN" />}
            <LockedRow label="Required Fields" description="Comma-separated field names agents must fill" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 280 }} value={crmOrg.requiredFields} onChange={(e) => setCrmOrg({ ...crmOrg, requiredFields: e.target.value })} />
            </LockedRow>
            <LockedRow label="Max Clients per Agent" description="0 = unlimited" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 80 }} value={crmOrg.maxClientsPerAgent} onChange={(e) => setCrmOrg({ ...crmOrg, maxClientsPerAgent: e.target.value })} type="number" min="0" />
            </LockedRow>
            <LockedRow label="Client Visibility" description="What records can agents see?" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <select className={SELECT_CLS} value={crmOrg.clientVisibility} onChange={(e) => setCrmOrg({ ...crmOrg, clientVisibility: e.target.value })}>
                <option value="own">Own clients only</option>
                <option value="team">Team clients</option>
                <option value="all">All org clients</option>
              </select>
            </LockedRow>
            <LockedRow label="Auto-Archive After (days)" description="Move inactive clients to archive" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 80 }} value={crmOrg.autoArchiveDays} onChange={(e) => setCrmOrg({ ...crmOrg, autoArchiveDays: e.target.value })} type="number" />
            </LockedRow>
            <LockedRow label="Enforce Duplicate Email Check" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <Toggle checked={crmOrg.duplicateEmailCheck} onChange={(v) => setCrmOrg({ ...crmOrg, duplicateEmailCheck: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label="Allow Agent Self-Assignment" description="Agents can claim unassigned leads" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <Toggle checked={crmOrg.allowAgentSelfAssign} onChange={(v) => setCrmOrg({ ...crmOrg, allowAgentSelfAssign: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label="Lead Sources" description="Comma-separated list shown in dropdown" minRole="MANAGER" canEdit={isManager}>
              <input className={INPUT_CLS} style={{ width: 300 }} value={crmOrg.leadSources} onChange={(e) => setCrmOrg({ ...crmOrg, leadSources: e.target.value })} />
            </LockedRow>
            {isFirmAdmin && (
              <div className="mt-6"><button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={() => save("settings_crm_org", crmOrg)}>Save Org Policy</button></div>
            )}
          </div>
        )}

        {crmTab === "personal" && (
          <div>
            <SettingRow label="Default Client Type">
              <select className={SELECT_CLS} value={crmPersonal.defaultClientType} onChange={(e) => setCrmPersonal({ ...crmPersonal, defaultClientType: e.target.value })}>
                <option value="BUYER">Buyer</option>
                <option value="SELLER">Seller</option>
                <option value="RENTER">Renter</option>
                <option value="INVESTOR">Investor</option>
              </select>
            </SettingRow>
            <SettingRow label="Default Funnel Stage">
              <select className={SELECT_CLS} value={crmPersonal.defaultFunnelStage} onChange={(e) => setCrmPersonal({ ...crmPersonal, defaultFunnelStage: e.target.value })}>
                {["LEAD","PROSPECT","ACTIVE","UNDER_CONTRACT","CLOSED","LOST"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </SettingRow>
            <SettingRow label="Auto-Assign New Leads to Me">
              <Toggle checked={crmPersonal.autoAssignToMe} onChange={(v) => setCrmPersonal({ ...crmPersonal, autoAssignToMe: v })} />
            </SettingRow>
            <SettingRow label="Show Budget Field on Client Card">
              <Toggle checked={crmPersonal.showBudgetField} onChange={(v) => setCrmPersonal({ ...crmPersonal, showBudgetField: v })} />
            </SettingRow>
            <SettingRow label="Compact List View">
              <Toggle checked={crmPersonal.compactView} onChange={(v) => setCrmPersonal({ ...crmPersonal, compactView: v })} />
            </SettingRow>
            <div className="mt-6"><button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={() => save("settings_crm_personal", crmPersonal)}>Save My Preferences</button></div>
          </div>
        )}
      </div>
    );
  };

  const renderProperties = () => {
    const tabs = [
      { key: "org",      label: "Org Policy", locked: !isFirmAdmin },
      { key: "personal", label: "My Preferences" },
    ];
    return (
      <div>
        <SectionHeader title="Property Settings" description="Listing management configuration" />
        <SubTabs tabs={tabs} active={propTab} onChange={(k) => setPropTab(k as any)} />

        {propTab === "org" && (
          <div>
            {!isFirmAdmin && <PolicyLockNotice role="FIRMADMIN" />}
            <LockedRow label="Listing Approval Required" description="New listings need manager approval before going live" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <Toggle checked={propOrg.listingApprovalRequired} onChange={(v) => setPropOrg({ ...propOrg, listingApprovalRequired: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label="Who Can Create Listings" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <select className={SELECT_CLS} value={propOrg.whoCanCreateListing} onChange={(e) => setPropOrg({ ...propOrg, whoCanCreateListing: e.target.value })}>
                <option value="AGENT">Agent and above</option>
                <option value="MANAGER">Manager and above</option>
                <option value="FIRMADMIN">Firm Admin only</option>
              </select>
            </LockedRow>
            <LockedRow label="Required Listing Fields" description="Comma-separated field names" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 300 }} value={propOrg.requiredFields} onChange={(e) => setPropOrg({ ...propOrg, requiredFields: e.target.value })} />
            </LockedRow>
            <LockedRow label="Min Photos Required" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 80 }} type="number" value={propOrg.photoMinRequired} onChange={(e) => setPropOrg({ ...propOrg, photoMinRequired: e.target.value })} />
            </LockedRow>
            <LockedRow label="Max Photos per Listing" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 80 }} type="number" value={propOrg.photoLimit} onChange={(e) => setPropOrg({ ...propOrg, photoLimit: e.target.value })} />
            </LockedRow>
            <LockedRow label="Description Max Characters" minRole="MANAGER" canEdit={isManager}>
              <input className={INPUT_CLS} style={{ width: 100 }} type="number" value={propOrg.descMaxChars} onChange={(e) => setPropOrg({ ...propOrg, descMaxChars: e.target.value })} />
            </LockedRow>
            <LockedRow label="MLS Auto-Sync" description="Requires MLS integration to be connected" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <Toggle checked={propOrg.mlsSyncEnabled} onChange={(v) => setPropOrg({ ...propOrg, mlsSyncEnabled: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            {isFirmAdmin && (
              <div className="mt-6"><button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={() => save("settings_prop_org", propOrg)}>Save Org Policy</button></div>
            )}
          </div>
        )}

        {propTab === "personal" && (
          <div>
            <SettingRow label="Default Listing Status">
              <select className={SELECT_CLS} value={propPersonal.defaultStatus} onChange={(e) => setPropPersonal({ ...propPersonal, defaultStatus: e.target.value })}>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="DRAFT">Draft</option>
              </select>
            </SettingRow>
            <SettingRow label="Price Display Format">
              <select className={SELECT_CLS} value={propPersonal.priceFormat} onChange={(e) => setPropPersonal({ ...propPersonal, priceFormat: e.target.value })}>
                <option value="full">Full ($1,250,000)</option>
                <option value="short">Short ($1.25M)</option>
              </select>
            </SettingRow>
            <SettingRow label="Auto-Assign Me as Listing Agent">
              <Toggle checked={propPersonal.defaultAgentSelf} onChange={(v) => setPropPersonal({ ...propPersonal, defaultAgentSelf: v })} />
            </SettingRow>
            <SettingRow label="Require Square Footage">
              <Toggle checked={propPersonal.requireSqft} onChange={(v) => setPropPersonal({ ...propPersonal, requireSqft: v })} />
            </SettingRow>
            <div className="mt-6"><button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={() => save("settings_prop_personal", propPersonal)}>Save My Preferences</button></div>
          </div>
        )}
      </div>
    );
  };

  const renderFinance = () => {
    const tabs = [
      { key: "org",      label: "Firm Policy", locked: !isFirmAdmin },
      { key: "personal", label: "My View" },
    ];
    return (
      <div>
        <SectionHeader title="Finance Settings" description="Commission rates, splits, and fiscal configuration" />
        <SubTabs tabs={tabs} active={finTab} onChange={(k) => setFinTab(k as any)} />

        {finTab === "org" && (
          <div>
            {!isFirmAdmin && <PolicyLockNotice role="FIRMADMIN" />}
            <div className="p-3 mb-4 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-amber-500/80">
              ⚠️ Commission and split rates are firm-level policies. Changing them affects all future transactions. Historical records are not affected.
            </div>
            <LockedRow label="Default Commission Rate (%)" description="Buyer or seller side commission default" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 100 }} type="number" step="0.1" value={finOrg.defaultCommissionRate} onChange={(e) => setFinOrg({ ...finOrg, defaultCommissionRate: e.target.value })} />
            </LockedRow>
            <LockedRow label="Firm Split (%)" description="Percentage retained by the brokerage" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 100 }} type="number" step="1" value={finOrg.firmSplitPercent} onChange={(e) => setFinOrg({ ...finOrg, firmSplitPercent: e.target.value })} />
            </LockedRow>
            <LockedRow label="Override / Bonus Cap (%)" description="Max additional commission an agent can negotiate" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 100 }} type="number" step="0.5" value={finOrg.overridePercent} onChange={(e) => setFinOrg({ ...finOrg, overridePercent: e.target.value })} />
            </LockedRow>
            <LockedRow label="Fiscal Year Start Month" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <select className={SELECT_CLS} value={finOrg.fiscalYearStart} onChange={(e) => setFinOrg({ ...finOrg, fiscalYearStart: e.target.value })}>
                {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                  <option key={i+1} value={String(i+1)}>{m}</option>
                ))}
              </select>
            </LockedRow>
            <LockedRow label="Currency" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <select className={SELECT_CLS} value={finOrg.currency} onChange={(e) => setFinOrg({ ...finOrg, currency: e.target.value })}>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </LockedRow>
            <LockedRow label="Show Gross Commission in Leaderboard" description="Visible to all team members" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <Toggle checked={finOrg.showGrossInLeaderboard} onChange={(v) => setFinOrg({ ...finOrg, showGrossInLeaderboard: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label="Require Receipts for Expenses" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <Toggle checked={finOrg.requireExpenseReceipts} onChange={(v) => setFinOrg({ ...finOrg, requireExpenseReceipts: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label="Tax Reporting Module Enabled" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <Toggle checked={finOrg.taxReportingEnabled} onChange={(v) => setFinOrg({ ...finOrg, taxReportingEnabled: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            {isFirmAdmin && (
              <div className="mt-6"><button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={() => save("settings_fin_org", finOrg)}>Save Firm Policy</button></div>
            )}
          </div>
        )}

        {finTab === "personal" && (
          <div>
            <SettingRow label="Show Net Commission in My Dashboard" description="Displays after firm split">
              <Toggle checked={finPersonal.showNetInDashboard} onChange={(v) => setFinPersonal({ ...finPersonal, showNetInDashboard: v })} />
            </SettingRow>
            <SettingRow label="Show Team Leaderboard">
              <Toggle checked={finPersonal.showLeaderboard} onChange={(v) => setFinPersonal({ ...finPersonal, showLeaderboard: v })} />
            </SettingRow>
            <SettingRow label="Preferred Currency Display">
              <select className={SELECT_CLS} value={finPersonal.preferredCurrency} onChange={(e) => setFinPersonal({ ...finPersonal, preferredCurrency: e.target.value })}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </SettingRow>
            <div className="mt-6"><button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={() => save("settings_fin_personal", finPersonal)}>Save My View</button></div>
          </div>
        )}
      </div>
    );
  };

  const renderAppointments = () => {
    const tabs = [
      { key: "org",      label: "Org Policy", locked: !isManager },
      { key: "personal", label: "My Preferences" },
    ];
    return (
      <div>
        <SectionHeader title="Appointments" description="Scheduling policies and personal calendar preferences" />
        <SubTabs tabs={tabs} active={apptTab} onChange={(k) => setApptTab(k as any)} />

        {apptTab === "org" && (
          <div>
            {!isManager && <PolicyLockNotice role="MANAGER" />}
            <LockedRow label="Firm Working Hours Start" minRole="MANAGER" canEdit={isManager}>
              <input className={INPUT_CLS} type="time" value={apptOrg.workdayStart} onChange={(e) => setApptOrg({ ...apptOrg, workdayStart: e.target.value })} />
            </LockedRow>
            <LockedRow label="Firm Working Hours End" minRole="MANAGER" canEdit={isManager}>
              <input className={INPUT_CLS} type="time" value={apptOrg.workdayEnd} onChange={(e) => setApptOrg({ ...apptOrg, workdayEnd: e.target.value })} />
            </LockedRow>
            <LockedRow label="Show Weekends" description="Allow weekend appointments firm-wide" minRole="MANAGER" canEdit={isManager}>
              <Toggle checked={apptOrg.showWeekends} onChange={(v) => setApptOrg({ ...apptOrg, showWeekends: v })} disabled={!isManager} />
            </LockedRow>
            <LockedRow label="Cancellation Notice Required (hours)" description="Minimum notice for client cancellations" minRole="MANAGER" canEdit={isManager}>
              <select className={SELECT_CLS} value={apptOrg.cancellationNoticehours} onChange={(e) => setApptOrg({ ...apptOrg, cancellationNoticehours: e.target.value })}>
                <option value="0">No minimum</option>
                <option value="2">2 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
              </select>
            </LockedRow>
            <LockedRow label="Allow Client Self-Booking" description="Clients can book via public link" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <Toggle checked={apptOrg.allowClientBooking} onChange={(v) => setApptOrg({ ...apptOrg, allowClientBooking: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label="Buffer Between Appointments (min)" minRole="MANAGER" canEdit={isManager}>
              <select className={SELECT_CLS} value={apptOrg.bufferBetween} onChange={(e) => setApptOrg({ ...apptOrg, bufferBetween: e.target.value })}>
                {["0","5","10","15","30"].map((n) => <option key={n} value={n}>{n} min</option>)}
              </select>
            </LockedRow>
            <LockedRow label="Max Advance Booking (days)" description="How far ahead clients can book" minRole="MANAGER" canEdit={isManager}>
              <input className={INPUT_CLS} style={{ width: 80 }} type="number" value={apptOrg.maxAdvanceBookingDays} onChange={(e) => setApptOrg({ ...apptOrg, maxAdvanceBookingDays: e.target.value })} />
            </LockedRow>
            {isManager && (
              <div className="mt-6"><button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={() => save("settings_appt_org", apptOrg)}>Save Org Policy</button></div>
            )}
          </div>
        )}

        {apptTab === "personal" && (
          <div>
            <SettingRow label="Default Duration (minutes)">
              <select className={SELECT_CLS} value={apptPersonal.defaultDuration} onChange={(e) => setApptPersonal({ ...apptPersonal, defaultDuration: e.target.value })}>
                {["15","30","45","60","90","120"].map((n) => <option key={n} value={n}>{n} min</option>)}
              </select>
            </SettingRow>
            <SettingRow label="Send Reminder (hours before)">
              <select className={SELECT_CLS} value={apptPersonal.reminderBefore} onChange={(e) => setApptPersonal({ ...apptPersonal, reminderBefore: e.target.value })}>
                {["1","2","4","12","24","48"].map((n) => <option key={n} value={n}>{n}h before</option>)}
              </select>
            </SettingRow>
            <SettingRow label="Personal Buffer (min)" description="Extra time blocked after each of your appointments">
              <select className={SELECT_CLS} value={apptPersonal.personalBuffer} onChange={(e) => setApptPersonal({ ...apptPersonal, personalBuffer: e.target.value })}>
                {["0","5","10","15","30"].map((n) => <option key={n} value={n}>{n} min</option>)}
              </select>
            </SettingRow>
            <SettingRow label="Auto-Confirm Appointments">
              <Toggle checked={apptPersonal.autoConfirm} onChange={(v) => setApptPersonal({ ...apptPersonal, autoConfirm: v })} />
            </SettingRow>
            <SettingRow label="Calendar Color">
              <div className="flex gap-2">
                {["blue","green","purple","orange","red"].map((c) => (
                  <button key={c} onClick={() => setApptPersonal({ ...apptPersonal, colorCode: c })} className={`w-7 h-7 rounded-full border-2 transition-transform ${apptPersonal.colorCode === c ? "scale-125 border-foreground" : "border-transparent"}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </SettingRow>
            <div className="mt-6"><button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={() => save("settings_appt_personal", apptPersonal)}>Save My Preferences</button></div>
          </div>
        )}
      </div>
    );
  };

  const renderDocuments = () => {
    const tabs = [
      { key: "org",      label: "Org Policy", locked: !isFirmAdmin },
      { key: "personal", label: "My Preferences" },
    ];
    return (
      <div>
        <SectionHeader title="Documents" description="File management, retention and signature policies" />
        <SubTabs tabs={tabs} active={docTab} onChange={(k) => setDocTab(k as any)} />

        {docTab === "org" && (
          <div>
            {!isFirmAdmin && <PolicyLockNotice role="FIRMADMIN" />}
            <LockedRow label="Allowed File Types" description="Comma-separated extensions" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 260 }} value={docOrg.allowedTypes} onChange={(e) => setDocOrg({ ...docOrg, allowedTypes: e.target.value })} />
            </LockedRow>
            <LockedRow label="Max File Size (MB)" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 80 }} type="number" value={docOrg.maxFileSizeMb} onChange={(e) => setDocOrg({ ...docOrg, maxFileSizeMb: e.target.value })} />
            </LockedRow>
            <LockedRow label="Retention Period (days)" description="0 = keep indefinitely" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <input className={INPUT_CLS} style={{ width: 100 }} type="number" value={docOrg.retentionDays} onChange={(e) => setDocOrg({ ...docOrg, retentionDays: e.target.value })} />
            </LockedRow>
            <LockedRow label="Auto-Organize by Transaction" description="Files automatically sorted into transaction folders" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <Toggle checked={docOrg.autoOrganizeByTransaction} onChange={(v) => setDocOrg({ ...docOrg, autoOrganizeByTransaction: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label="Require E-Signature for Contracts" description="Blocks contract finalization without DocuSign" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <Toggle checked={docOrg.requireSignatureForContract} onChange={(v) => setDocOrg({ ...docOrg, requireSignatureForContract: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label="Version Control Enabled" description="Track document revision history" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <Toggle checked={docOrg.versionControlEnabled} onChange={(v) => setDocOrg({ ...docOrg, versionControlEnabled: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label="Audit Trail" description="Log all document views, downloads, and edits" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <Toggle checked={docOrg.auditTrailEnabled} onChange={(v) => setDocOrg({ ...docOrg, auditTrailEnabled: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            {isFirmAdmin && (
              <div className="mt-6"><button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={() => save("settings_doc_org", docOrg)}>Save Org Policy</button></div>
            )}
          </div>
        )}

        {docTab === "personal" && (
          <div>
            <SettingRow label="Default Folder View">
              <select className={SELECT_CLS} value={docPersonal.defaultFolderView} onChange={(e) => setDocPersonal({ ...docPersonal, defaultFolderView: e.target.value })}>
                <option value="transaction">By Transaction</option>
                <option value="type">By Document Type</option>
                <option value="date">By Date</option>
                <option value="client">By Client</option>
              </select>
            </SettingRow>
            <SettingRow label="Show Thumbnails" description="Preview images and PDFs in grid view">
              <Toggle checked={docPersonal.showThumbnails} onChange={(v) => setDocPersonal({ ...docPersonal, showThumbnails: v })} />
            </SettingRow>
            <SettingRow label="Auto-Tag Documents with AI" description="Automatically categorize uploaded files">
              <Toggle checked={docPersonal.autoTagEnabled} onChange={(v) => setDocPersonal({ ...docPersonal, autoTagEnabled: v })} />
            </SettingRow>
            <div className="mt-6"><button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={() => save("settings_doc_personal", docPersonal)}>Save My Preferences</button></div>
          </div>
        )}
      </div>
    );
  };

  const renderMarketing = () => {
    const tabs = [
      { key: "org",      label: "Org Policy", locked: !isManager },
      { key: "personal", label: "My Preferences" },
    ];
    return (
      <div>
        <SectionHeader title="Marketing" description="Campaign management, AI content, and brand guidelines" />
        <SubTabs tabs={tabs} active={mktTab} onChange={(k) => setMktTab(k as any)} />

        {mktTab === "org" && (
          <div>
            {!isManager && <PolicyLockNotice role="MANAGER" />}
            <LockedRow label="AI Content Generation" description="Enable AI-assisted listing descriptions and social posts org-wide" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <Toggle checked={mktOrg.aiContentEnabled} onChange={(v) => setMktOrg({ ...mktOrg, aiContentEnabled: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label="Allowed Channels" description="Comma-separated: email, instagram, facebook, twitter, linkedin" minRole="MANAGER" canEdit={isManager}>
              <input className={INPUT_CLS} style={{ width: 280 }} value={mktOrg.allowedChannels} onChange={(e) => setMktOrg({ ...mktOrg, allowedChannels: e.target.value })} />
            </LockedRow>
            <LockedRow label="Brand Voice Guidelines" description="Included as context for AI-generated content" minRole="MANAGER" canEdit={isManager}>
              <textarea className={TEXTAREA_CLS} style={{ width: 320 }} rows={3} value={mktOrg.brandVoice} onChange={(e) => setMktOrg({ ...mktOrg, brandVoice: e.target.value })} />
            </LockedRow>
            <LockedRow label="Require Manager Approval" description="Marketing content must be approved before publishing" minRole="FIRMADMIN" canEdit={isFirmAdmin}>
              <Toggle checked={mktOrg.requireManagerApproval} onChange={(v) => setMktOrg({ ...mktOrg, requireManagerApproval: v })} disabled={!isFirmAdmin} />
            </LockedRow>
            <LockedRow label="Default Hashtags" description="Pre-filled on all new campaigns" minRole="MANAGER" canEdit={isManager}>
              <input className={INPUT_CLS} style={{ width: 280 }} value={mktOrg.defaultHashtags} onChange={(e) => setMktOrg({ ...mktOrg, defaultHashtags: e.target.value })} />
            </LockedRow>
            <LockedRow label="Auto-Close Campaigns After (days)" description="0 = manual close only" minRole="MANAGER" canEdit={isManager}>
              <input className={INPUT_CLS} style={{ width: 80 }} type="number" value={mktOrg.autoCloseCampaignDays} onChange={(e) => setMktOrg({ ...mktOrg, autoCloseCampaignDays: e.target.value })} />
            </LockedRow>
            {isManager && (
              <div className="mt-6"><button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={() => save("settings_mkt_org", mktOrg)}>Save Org Policy</button></div>
            )}
          </div>
        )}

        {mktTab === "personal" && (
          <div>
            <SettingRow label="Email Signature" description="Appended to all outgoing emails">
              <textarea className={TEXTAREA_CLS} style={{ width: 300 }} rows={4} value={mktPersonal.emailSignature} onChange={(e) => setMktPersonal({ ...mktPersonal, emailSignature: e.target.value })} placeholder="Jane Smith | Senior Broker | +1 (212) 555-0101" />
            </SettingRow>
            <SettingRow label="Default Listing Template">
              <select className={SELECT_CLS} value={mktPersonal.defaultListingTemplate} onChange={(e) => setMktPersonal({ ...mktPersonal, defaultListingTemplate: e.target.value })}>
                <option value="">None (blank)</option>
                <option value="luxury">Luxury Residential</option>
                <option value="commercial">Commercial</option>
                <option value="rental">Rental</option>
                <option value="newdev">New Development</option>
              </select>
            </SettingRow>
            <SettingRow label="Preferred Channel">
              <select className={SELECT_CLS} value={mktPersonal.preferredChannel} onChange={(e) => setMktPersonal({ ...mktPersonal, preferredChannel: e.target.value })}>
                <option value="email">Email</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">Twitter / X</option>
              </select>
            </SettingRow>
            <SettingRow label="Auto-Schedule Posts" description="AI picks optimal posting time">
              <Toggle checked={mktPersonal.autoScheduleEnabled} onChange={(v) => setMktPersonal({ ...mktPersonal, autoScheduleEnabled: v })} />
            </SettingRow>
            <div className="mt-6"><button className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-medium hover:bg-primary/90" onClick={() => save("settings_mkt_personal", mktPersonal)}>Save My Preferences</button></div>
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
          const visibleItems = group.items.filter((item: any) => {
            if ((item as any).adminOnly && !isManager) return false;
            return true;
          });
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.group} className="mb-4">
              <div className="px-3 py-1 text-xs font-semibold uppercase tracking-widest text-foreground/30 mb-1">
                {group.group}
              </div>
              {visibleItems.map((item: any) => (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                    activeSection === item.key
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/60 hover:text-foreground hover:bg-background"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {(item as any).adminOnly && !isFirmAdmin && (
                    <span className="text-xs text-foreground/30">🔒</span>
                  )}
                </button>
              ))}
            </div>
          );
        })}

        {/* Role badge */}
        <div className="mt-auto px-3 pt-4 border-t border-border">
          <div className="text-xs text-foreground/40 mb-1">Signed in as</div>
          <div className="text-xs font-medium text-foreground truncate">{user?.name || user?.email}</div>
          <div className="mt-1 inline-flex items-center px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-xs text-primary font-medium">
            {ROLE_LABELS[user?.role || ""] ?? user?.role ?? "—"}
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
