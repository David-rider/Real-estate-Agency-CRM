"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTheme, ThemeName } from "@/lib/theme/ThemeContext";
import { useToast } from "@/components/ui/Toast";

// ─── Reusable inline components ────────────────────────────────────────────────

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
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 pb-4 border-b border-border">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <p className="text-sm text-foreground/50 mt-1">{description}</p>
    </div>
  );
}

const INPUT_CLS =
  "px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none transition-colors";
const SELECT_CLS =
  "px-3 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none cursor-pointer";
const TEXTAREA_CLS =
  "px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none resize-none transition-colors";

// ─── Nav definition ────────────────────────────────────────────────────────────

const NAV = [
  {
    group: "Account",
    items: [
      { key: "profile", label: "Profile", icon: "👤" },
      { key: "notifications", label: "Notifications", icon: "🔔" },
    ],
  },
  {
    group: "Organization",
    items: [
      { key: "users", label: "Team & Roles", icon: "👥", adminOnly: true },
      { key: "security", label: "Security", icon: "🔒" },
      { key: "appearance", label: "Appearance", icon: "🎨" },
      { key: "integrations", label: "Integrations", icon: "🔗" },
    ],
  },
  {
    group: "Features",
    items: [
      { key: "crm", label: "CRM", icon: "🧑‍🤝‍🧑" },
      { key: "properties", label: "Properties", icon: "🏠" },
      { key: "finance", label: "Finance", icon: "💰" },
      { key: "appointments", label: "Appointments", icon: "📅" },
      { key: "documents", label: "Documents", icon: "📄" },
      { key: "marketing", label: "Marketing", icon: "📣" },
    ],
  },
];

// ─── Default state values ───────────────────────────────────────────────────────

const DEFAULT_PROFILE = {
  name: "",
  phone: "",
  timezone: "America/New_York",
  bio: "",
};
const DEFAULT_NOTIF = {
  emailNewClient: true,
  emailAppointmentReminder: true,
  emailTransactionUpdate: true,
  emailOfferReceived: true,
  emailCommissionPaid: false,
  inAppAll: true,
};
const DEFAULT_CRM = {
  defaultClientType: "BUYER",
  autoAssignToMe: true,
  duplicateEmailCheck: true,
  defaultFunnelStage: "LEAD",
  requiredFields: ["firstName", "lastName", "phone"],
  showBudgetField: true,
  leadSources: "Referral,Zillow,StreetEasy,Website,Cold Call,Open House",
};
const DEFAULT_PROPERTY = {
  defaultStatus: "ACTIVE",
  priceFormat: "full",
  requireBeds: true,
  requireBaths: true,
  requireSqft: false,
  defaultAgentSelf: true,
  photoLimit: 20,
  descMaxChars: 1000,
};
const DEFAULT_FINANCE = {
  defaultCommissionRate: "2.5",
  firmSplitPercent: "25",
  overridePercent: "5",
  fiscalYearStart: "1",
  currency: "USD",
  showGrossInLeaderboard: false,
};
const DEFAULT_APPOINTMENT = {
  defaultDuration: "60",
  reminderBefore: "24",
  allowClientBooking: false,
  bufferBetween: "15",
  workdayStart: "09:00",
  workdayEnd: "18:00",
  showWeekends: false,
};
const DEFAULT_DOCUMENT = {
  allowedTypes: "PDF,DOCX,XLSX,PNG,JPG",
  maxFileSizeMb: "25",
  retentionDays: "365",
  autoOrganizeByTransaction: true,
  requireSignatureForContract: true,
};
const DEFAULT_MARKETING = {
  aiContentEnabled: true,
  defaultHashtags: "#NYCRealEstate #LuxuryHomes #Manhattan",
  autoCloseCampaignDays: "30",
  emailSignature: "",
  defaultListingTemplate: "",
};

// ─── Main component ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  const isAdmin = ["FIRMADMIN", "SUPERADMIN", "MANAGER"].includes(
    user?.role || ""
  );
  const isSuperAdmin = ["FIRMADMIN", "SUPERADMIN"].includes(user?.role || "");

  const [activeSection, setActiveSection] = React.useState(
    isAdmin ? "profile" : "profile"
  );

  // ── Users / Team state ──────────────────────────────────────────────────────
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingUser, setEditingUser] = React.useState<any>(null);
  const [isSavingUser, setIsSavingUser] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── Integrations state ──────────────────────────────────────────────────────
  const [integrationsState, setIntegrationsState] = React.useState({
    google: false,
    xero: false,
    quickbooks: false,
    mls: true,
    docusign: false,
  });
  const [connectingApp, setConnectingApp] = React.useState<string | null>(null);

  // ── Security logs ───────────────────────────────────────────────────────────
  const mockSecurityLogs = [
    { id: 1, time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), risk: "HIGH", user: "Admin", actionKey: "e1" },
    { id: 2, time: new Date(Date.now() - 1000 * 60 * 120).toISOString(), risk: "MEDIUM", user: "Manager Smith", actionKey: "e2" },
    { id: 3, time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), risk: "LOW", user: "Agent Chen", actionKey: "e3" },
    { id: 4, time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), risk: "LOW", user: "Agent Doe", actionKey: "e4" },
    { id: 5, time: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), risk: "HIGH", user: "Admin", actionKey: "e5" },
  ];
  const [securityLogs, setSecurityLogs] = React.useState(mockSecurityLogs);
  const [sortKey, setSortKey] = React.useState<"TIME" | "RISK">("TIME");

  // ── Feature settings state ──────────────────────────────────────────────────
  const [profileSettings, setProfileSettings] = React.useState({
    ...DEFAULT_PROFILE,
    name: user?.name || "",
  });
  const [notifSettings, setNotifSettings] = React.useState(DEFAULT_NOTIF);
  const [crmSettings, setCrmSettings] = React.useState(DEFAULT_CRM);
  const [propertySettings, setPropertySettings] = React.useState(DEFAULT_PROPERTY);
  const [financeSettings, setFinanceSettings] = React.useState(DEFAULT_FINANCE);
  const [appointmentSettings, setAppointmentSettings] = React.useState(DEFAULT_APPOINTMENT);
  const [documentSettings, setDocumentSettings] = React.useState(DEFAULT_DOCUMENT);
  const [marketingSettings, setMarketingSettings] = React.useState(DEFAULT_MARKETING);

  // ── Change password state ───────────────────────────────────────────────────
  const [pwState, setPwState] = React.useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [pwMsg, setPwMsg] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ── Load from localStorage on mount ────────────────────────────────────────
  React.useEffect(() => {
    const load = <T extends object>(key: string, defaults: T): T => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) return { ...defaults, ...JSON.parse(raw) };
      } catch {}
      return defaults;
    };
    setProfileSettings(load("settings_profile", { ...DEFAULT_PROFILE, name: user?.name || "" }));
    setNotifSettings(load("settings_notif", DEFAULT_NOTIF));
    setCrmSettings(load("settings_crm", DEFAULT_CRM));
    setPropertySettings(load("settings_property", DEFAULT_PROPERTY));
    setFinanceSettings(load("settings_finance", DEFAULT_FINANCE));
    setAppointmentSettings(load("settings_appointment", DEFAULT_APPOINTMENT));
    setDocumentSettings(load("settings_document", DEFAULT_DOCUMENT));
    setMarketingSettings(load("settings_marketing", DEFAULT_MARKETING));
  }, []);

  // ── Fetch users when section is active ─────────────────────────────────────
  React.useEffect(() => {
    if (activeSection === "users") fetchUsers();
  }, [activeSection]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/settings/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 401) {
        alert(t.settings?.sessionExpired || "Your session has expired. Please log out and log back in.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      } else if (res.status === 403) {
        setUsers([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/settings/users/${editingUser.id}/role`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ role: editingUser.role, tier: editingUser.tier }),
        }
      );
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      } else if (res.status === 401) {
        alert(t.settings?.sessionExpired || "Your session has expired.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      } else if (res.status === 403) {
        alert("You do not have permission to perform this action.");
      } else {
        alert("Failed to update user");
      }
    } catch (error) {
      console.error("Update user failed", error);
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleExportUsers = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/settings/users/export`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "users_export.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to export users.");
      }
    } catch (error) {
      console.error("Export failed", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportUsers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/settings/users/import`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
      );
      if (res.ok) {
        alert("Users imported successfully.");
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to import users.");
      }
    } catch (error) {
      console.error("Import failed", error);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConnectIntegration = async (appId: string) => {
    if (appId !== "google") {
      setIntegrationsState((prev) => ({
        ...prev,
        [appId]: !prev[appId as keyof typeof prev],
      }));
      return;
    }
    const isConnected = integrationsState[appId as keyof typeof integrationsState];
    if (isConnected) {
      setIntegrationsState((prev) => ({ ...prev, [appId]: false }));
      return;
    }
    setConnectingApp(appId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/integrations/${appId}/connect`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        setIntegrationsState((prev) => ({ ...prev, [appId]: true }));
        alert(`${appId.toUpperCase()} Connected Successfully!`);
      } else {
        alert(`Failed to connect ${appId}`);
      }
    } catch (error) {
      console.error("Integration failed", error);
      alert("Network error connecting integration.");
    } finally {
      setConnectingApp(null);
    }
  };

  const handleSortLogs = (key: "TIME" | "RISK") => {
    setSortKey(key);
    const sorted = [...securityLogs].sort((a, b) => {
      if (key === "TIME") return new Date(b.time).getTime() - new Date(a.time).getTime();
      const w = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return (w[b.risk as keyof typeof w] || 0) - (w[a.risk as keyof typeof w] || 0);
    });
    setSecurityLogs(sorted);
  };

  const getRiskBadgeStyles = (risk: string) => {
    switch (risk) {
      case "HIGH": return "bg-red-900/10 text-red-500/80 border-red-900/20";
      case "MEDIUM": return "bg-amber-900/10 text-amber-500/80 border-amber-900/20";
      case "LOW": return "bg-primary/10 text-primary border-primary/20";
      default: return "bg-surface text-foreground/50 border-border";
    }
  };

  // ── Save handlers ──────────────────────────────────────────────────────────
  const handleSaveProfile = () => {
    localStorage.setItem("settings_profile", JSON.stringify(profileSettings));
    toast.success("Profile settings saved");
  };

  const handleSaveNotif = () => {
    localStorage.setItem("settings_notif", JSON.stringify(notifSettings));
    toast.success("Notification settings saved");
  };

  const handleSaveCrm = () => {
    localStorage.setItem("settings_crm", JSON.stringify(crmSettings));
    toast.success("CRM settings saved");
  };

  const handleSaveProperty = () => {
    localStorage.setItem("settings_property", JSON.stringify(propertySettings));
    toast.success("Property settings saved");
  };

  const handleSaveFinance = () => {
    localStorage.setItem("settings_finance", JSON.stringify(financeSettings));
    toast.success("Finance settings saved");
  };

  const handleSaveAppointment = () => {
    localStorage.setItem("settings_appointment", JSON.stringify(appointmentSettings));
    toast.success("Appointment settings saved");
  };

  const handleSaveDocument = () => {
    localStorage.setItem("settings_document", JSON.stringify(documentSettings));
    toast.success("Document settings saved");
  };

  const handleSaveMarketing = () => {
    localStorage.setItem("settings_marketing", JSON.stringify(marketingSettings));
    toast.success("Marketing settings saved");
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!pwState.current || !pwState.next || !pwState.confirm) {
      setPwMsg({ type: "err", text: "All password fields are required." });
      return;
    }
    if (pwState.next !== pwState.confirm) {
      setPwMsg({ type: "err", text: "New passwords do not match." });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ currentPassword: pwState.current, newPassword: pwState.next }),
        }
      );
      if (res.ok) {
        setPwMsg({ type: "ok", text: "Password updated successfully." });
        setPwState({ current: "", next: "", confirm: "" });
      } else {
        const data = await res.json().catch(() => ({}));
        setPwMsg({ type: "err", text: data.error || "Failed to update password." });
      }
    } catch {
      setPwMsg({ type: "err", text: "Network error. Please try again." });
    }
  };

  // ── Visible nav items ──────────────────────────────────────────────────────
  const visibleNav = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || isAdmin),
  })).filter((group) => group.items.length > 0);

  const allItems = visibleNav.flatMap((g) => g.items);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out text-foreground">
      {/* Page header (outside the split layout) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-border mb-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t.settings.title}
          </h1>
          <p className="text-foreground/50 mt-1 text-sm">{t.settings.subtitle}</p>
        </div>
      </div>

      {/* Split layout */}
      <div className="flex gap-0 min-h-screen -mx-6">
        {/* ── Desktop sidebar ── */}
        <aside className="hidden md:flex flex-col w-56 min-h-full border-r border-border bg-surface/30 py-6 px-3 shrink-0">
          {visibleNav.map((group) => (
            <div key={group.group} className="mb-4">
              <div className="px-3 py-1 text-xs font-semibold uppercase tracking-widest text-foreground/30 mb-1">
                {group.group}
              </div>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all mb-0.5
                    ${
                      activeSection === item.key
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/60 hover:text-foreground hover:bg-background"
                    }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* ── Mobile top nav ── */}
        <div className="md:hidden w-full flex overflow-x-auto border-b border-border bg-surface/30 px-2 py-2 gap-1 shrink-0 absolute left-0 right-0">
          {allItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                ${
                  activeSection === item.key
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/60 hover:text-foreground hover:bg-background"
                }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* ── Content panel ── */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">

          {/* ══ PROFILE ══════════════════════════════════════════════════════ */}
          {activeSection === "profile" && (
            <div>
              <SectionHeader
                title="Profile"
                description="Manage your personal information and preferences"
              />

              <SettingRow label="Full Name">
                <input
                  className={`${INPUT_CLS} w-48`}
                  value={profileSettings.name}
                  onChange={(e) =>
                    setProfileSettings((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </SettingRow>

              <SettingRow label="Phone Number">
                <input
                  className={`${INPUT_CLS} w-48`}
                  placeholder="+1 (212) 555-0000"
                  value={profileSettings.phone}
                  onChange={(e) =>
                    setProfileSettings((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </SettingRow>

              <SettingRow label="Time Zone">
                <select
                  className={`${SELECT_CLS} w-52`}
                  value={profileSettings.timezone}
                  onChange={(e) =>
                    setProfileSettings((p) => ({ ...p, timezone: e.target.value }))
                  }
                >
                  <option value="America/New_York">Eastern (New York)</option>
                  <option value="America/Chicago">Central (Chicago)</option>
                  <option value="America/Denver">Mountain (Denver)</option>
                  <option value="America/Los_Angeles">Pacific (Los Angeles)</option>
                  <option value="Pacific/Honolulu">Hawaii (Honolulu)</option>
                </select>
              </SettingRow>

              <SettingRow label="Bio / About">
                <textarea
                  rows={3}
                  className={`${TEXTAREA_CLS} w-64`}
                  placeholder="Licensed real estate agent specializing in..."
                  value={profileSettings.bio}
                  onChange={(e) =>
                    setProfileSettings((p) => ({ ...p, bio: e.target.value }))
                  }
                />
              </SettingRow>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  className="px-5 py-2 bg-primary text-background text-sm font-semibold rounded-lg hover:opacity-90 transition uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>

              {/* Change Password sub-section */}
              <div className="mt-10 pt-8 border-t border-border">
                <h3 className="text-base font-bold text-foreground mb-1">
                  Change Password
                </h3>
                <p className="text-xs text-foreground/50 mb-5">
                  Update your account password
                </p>

                <SettingRow label="Current Password">
                  <input
                    type="password"
                    className={`${INPUT_CLS} w-48`}
                    value={pwState.current}
                    onChange={(e) => setPwState((p) => ({ ...p, current: e.target.value }))}
                  />
                </SettingRow>

                <SettingRow label="New Password">
                  <input
                    type="password"
                    className={`${INPUT_CLS} w-48`}
                    value={pwState.next}
                    onChange={(e) => setPwState((p) => ({ ...p, next: e.target.value }))}
                  />
                </SettingRow>

                <SettingRow label="Confirm New Password">
                  <input
                    type="password"
                    className={`${INPUT_CLS} w-48`}
                    value={pwState.confirm}
                    onChange={(e) => setPwState((p) => ({ ...p, confirm: e.target.value }))}
                  />
                </SettingRow>

                {pwMsg && (
                  <div
                    className={`mt-3 text-sm font-medium ${
                      pwMsg.type === "ok" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {pwMsg.text}
                  </div>
                )}

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleChangePassword}
                    className="px-5 py-2 bg-primary text-background text-sm font-semibold rounded-lg hover:opacity-90 transition uppercase tracking-wider"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ NOTIFICATIONS ════════════════════════════════════════════════ */}
          {activeSection === "notifications" && (
            <div>
              <SectionHeader
                title="Notifications"
                description="Control when and how you receive alerts"
              />

              <div className="mb-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3">
                  Email Notifications
                </div>

                <SettingRow
                  label="New client assigned to you"
                  description="Get an email when a client is assigned to your account"
                >
                  <Toggle
                    checked={notifSettings.emailNewClient}
                    onChange={(v) => setNotifSettings((p) => ({ ...p, emailNewClient: v }))}
                  />
                </SettingRow>

                <SettingRow
                  label="Appointment reminder"
                  description="24 hours before a scheduled showing"
                >
                  <Toggle
                    checked={notifSettings.emailAppointmentReminder}
                    onChange={(v) => setNotifSettings((p) => ({ ...p, emailAppointmentReminder: v }))}
                  />
                </SettingRow>

                <SettingRow
                  label="Transaction status changed"
                  description="When a deal moves to a new stage"
                >
                  <Toggle
                    checked={notifSettings.emailTransactionUpdate}
                    onChange={(v) => setNotifSettings((p) => ({ ...p, emailTransactionUpdate: v }))}
                  />
                </SettingRow>

                <SettingRow
                  label="Offer received"
                  description="When a new offer comes in on your listing"
                >
                  <Toggle
                    checked={notifSettings.emailOfferReceived}
                    onChange={(v) => setNotifSettings((p) => ({ ...p, emailOfferReceived: v }))}
                  />
                </SettingRow>

                <SettingRow
                  label="Commission paid"
                  description="When a commission is marked as paid"
                >
                  <Toggle
                    checked={notifSettings.emailCommissionPaid}
                    onChange={(v) => setNotifSettings((p) => ({ ...p, emailCommissionPaid: v }))}
                  />
                </SettingRow>
              </div>

              <div className="mb-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-foreground/40 mb-3">
                  In-App Notifications
                </div>

                <SettingRow label="Enable all in-app notifications">
                  <Toggle
                    checked={notifSettings.inAppAll}
                    onChange={(v) => setNotifSettings((p) => ({ ...p, inAppAll: v }))}
                  />
                </SettingRow>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveNotif}
                  className="px-5 py-2 bg-primary text-background text-sm font-semibold rounded-lg hover:opacity-90 transition uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ══ TEAM & ROLES ═════════════════════════════════════════════════ */}
          {activeSection === "users" && (
            <div>
              <SectionHeader
                title="Team & Roles"
                description="Manage team members, their roles, and account tiers"
              />
              <div className="bg-background ring-1 ring-border/50 shadow-sm rounded-xl overflow-hidden">
                {(user?.role === "FIRMADMIN" || user?.role === "SUPERADMIN" || user?.role === "MANAGER") && (
                  <div className="flex justify-end gap-3 p-5 border-b border-border/40 bg-surface/30">
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleImportUsers}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                      className="px-4 py-2 text-base font-semibold font-sans border border-border/60 rounded-xl bg-surface hover:bg-background transition-colors text-foreground shadow-sm"
                    >
                      {isImporting ? t.settings.users.importing : t.settings.users.importUsers}
                    </button>
                    <button
                      onClick={handleExportUsers}
                      disabled={isExporting}
                      className="px-4 py-2 text-base font-semibold font-sans border border-primary text-primary rounded-xl hover:bg-primary hover:text-background transition-colors shadow-sm"
                    >
                      {isExporting ? t.settings.users.exporting : t.settings.users.exportCsv}
                    </button>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface/50 border-b border-border/40 text-sm font-semibold text-foreground/60 font-sans">
                      <tr>
                        <th className="p-4 pl-6 font-semibold whitespace-nowrap">{t.settings.users.name}</th>
                        <th className="p-4 font-semibold whitespace-nowrap">{t.settings.users.email}</th>
                        <th className="p-4 font-semibold whitespace-nowrap">{t.settings.users.role}</th>
                        <th className="p-4 font-semibold whitespace-nowrap">{t.settings.users.tier}</th>
                        <th className="p-4 font-semibold whitespace-nowrap">{t.settings.users.joined}</th>
                        <th className="p-4 pr-6 font-semibold whitespace-nowrap text-right">{t.settings.users.actions}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-sans text-base">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="p-10 text-center text-foreground/50 text-base font-semibold">
                            {(t.settings.users as any).loading}
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className="hover:bg-surface/30 transition-colors group">
                            <td className="p-4 pl-6">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 border border-border/80 rounded-full bg-surface text-foreground flex items-center justify-center font-sans font-semibold text-base group-hover:border-primary/50 group-hover:text-primary transition-colors shadow-sm">
                                  {u.name?.charAt(0) || "U"}
                                </div>
                                <span className="text-foreground font-medium group-hover:text-primary transition-colors">
                                  {u.name}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-foreground/70">{u.email}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 text-sm font-semibold rounded-md border border-border/60 bg-surface/50 text-foreground/70 ${["FIRMADMIN", "SUPERADMIN"].includes(u.role) ? "border-primary/50 text-primary bg-primary/10" : ""}`}>
                                {(t as any).roles?.[u.role] || u.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 text-sm font-semibold rounded-md border border-border/60 bg-surface/50 text-foreground/70 ${u.tier === "ELITE" ? "border-primary/30 text-primary bg-primary/5" : ""}`}>
                                {(t as any).tiers?.[u.tier] || u.tier}
                              </span>
                            </td>
                            <td className="p-4 text-foreground/60 text-base">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 pr-6 text-right">
                              {isSuperAdmin && (
                                <button
                                  onClick={() => setEditingUser({ ...u })}
                                  className="text-primary hover:text-primary-hover font-sans text-base font-semibold transition-colors"
                                >
                                  {t.settings.users.editUser}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ SECURITY ═════════════════════════════════════════════════════ */}
          {activeSection === "security" && (
            <div>
              <SectionHeader
                title="Security"
                description="Review security events and audit logs for your account"
              />
              <div className="space-y-6">
                <div className="flex justify-end gap-3 mb-4">
                  <button
                    onClick={() => handleSortLogs("TIME")}
                    className={`px-5 py-2 text-sm font-semibold rounded-lg font-sans border transition-colors ${sortKey === "TIME" ? "bg-surface ring-1 ring-border/50 text-foreground shadow-sm" : "bg-transparent border-transparent text-foreground/60 hover:text-foreground"}`}
                  >
                    {t.settings.security.sortTime}
                  </button>
                  <button
                    onClick={() => handleSortLogs("RISK")}
                    className={`px-5 py-2 text-sm font-semibold rounded-lg font-sans border transition-colors ${sortKey === "RISK" ? "bg-surface ring-1 ring-border/50 text-foreground shadow-sm" : "bg-transparent border-transparent text-foreground/60 hover:text-foreground"}`}
                  >
                    {t.settings.security.sortRisk}
                  </button>
                </div>
                <div className="bg-background ring-1 ring-border/50 shadow-sm rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface/50 border-b border-border/40 text-sm font-semibold text-foreground/60 font-sans">
                      <tr>
                        <th className="p-4 pl-6 font-semibold whitespace-nowrap">{t.settings.security.timestamp}</th>
                        <th className="p-4 font-semibold whitespace-nowrap">{t.settings.security.risk}</th>
                        <th className="p-4 font-semibold whitespace-nowrap">{t.settings.security.user}</th>
                        <th className="p-4 pr-6 font-semibold whitespace-nowrap w-full">{t.settings.security.event}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-sans text-base">
                      {securityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-surface/30 transition-colors">
                          <td className="p-4 pl-6 text-foreground/60 text-base">{new Date(log.time).toLocaleString()}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 text-sm font-bold rounded-md border ${getRiskBadgeStyles(log.risk)}`}>
                              {(t.settings.security.riskLevels as any)[log.risk] || log.risk}
                            </span>
                          </td>
                          <td className="p-4 text-foreground/90 font-medium">{log.user}</td>
                          <td className="p-4 pr-6 text-foreground/70 truncate max-w-md">
                            {(t.settings.security as any).mockEvents?.[log.actionKey] || log.actionKey}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══ APPEARANCE ═══════════════════════════════════════════════════ */}
          {activeSection === "appearance" && (
            <div>
              <SectionHeader
                title="Appearance"
                description="Choose your preferred theme and visual style"
              />
              <div className="space-y-8">
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">{t.settings.appearance.title}</h3>
                  <p className="text-sm text-foreground/50 mb-6">{t.settings.appearance.desc}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {[
                      { id: "luxury" as ThemeName, label: "轻奢 Luxury", primary: "#B8977E", bg: "#0C0C0E", surface: "#1A1A1E", fg: "#F0EDE8", desc: "Warm bronze on deep black" },
                      { id: "modern" as ThemeName, label: "现代 Modern", primary: "#4F7DF3", bg: "#F7F8FA", surface: "#FFFFFF", fg: "#1A1D2E", desc: "Clean blue on bright white" },
                      { id: "youth" as ThemeName, label: "青春 Youth", primary: "#7C5CFC", bg: "#FAFAFF", surface: "#FFFFFF", fg: "#2D2640", desc: "Vibrant violet with energy" },
                      { id: "chinese" as ThemeName, label: "中国风 Chinese", primary: "#C43B38", bg: "#FDF6EC", surface: "#FFFDF7", fg: "#3B2415", desc: "Cinnabar red on rice paper" },
                      { id: "cyberpunk" as ThemeName, label: "赛博 Cyberpunk", primary: "#00F0FF", bg: "#0A0A12", surface: "#12121E", fg: "#E0E8F0", desc: "Neon cyan on dark void" },
                    ].map((th) => (
                      <button
                        key={th.id}
                        onClick={() => setTheme(th.id)}
                        className={`group relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                          theme === th.id
                            ? "border-primary shadow-lg ring-2 ring-primary/20"
                            : "border-border hover:border-foreground/30 hover:shadow-md"
                        }`}
                      >
                        <div className="flex gap-1.5 mb-3">
                          <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: th.bg, border: "1px solid " + th.primary + "30" }}>
                            <div className="w-full h-full rounded-lg flex items-center justify-center">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: th.primary }} />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="w-12 h-2 rounded" style={{ backgroundColor: th.surface }} />
                            <div className="w-8 h-2 rounded" style={{ backgroundColor: th.primary }} />
                            <div className="w-10 h-2 rounded" style={{ backgroundColor: th.fg + "30" }} />
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{th.label}</p>
                        <p className="text-xs text-foreground/40 mt-0.5">{th.desc}</p>
                        {theme === th.id && (
                          <div className="absolute top-2 right-2">
                            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ INTEGRATIONS ═════════════════════════════════════════════════ */}
          {activeSection === "integrations" && (
            <div>
              <SectionHeader
                title="Integrations"
                description="Connect third-party services to extend your CRM capabilities"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  { id: "google", icon: "G" },
                  { id: "xero", icon: "X" },
                  { id: "quickbooks", icon: "Q" },
                  { id: "mls", icon: "M" },
                  { id: "docusign", icon: "D" },
                ].map((integration) => {
                  const connected = integrationsState[integration.id as keyof typeof integrationsState];
                  const isConnecting = connectingApp === integration.id;
                  const appContent = (t.settings.integrations.apps as any)[integration.id];
                  return (
                    <div
                      key={integration.id}
                      className="bg-background ring-1 ring-border/50 rounded-2xl shadow-sm p-8 flex flex-col items-start hover:shadow-md hover:ring-primary/50 transition-all duration-300 group"
                    >
                      <div className="w-14 h-14 border border-border/60 rounded-xl bg-surface flex items-center justify-center font-sans font-bold text-2xl text-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors shadow-sm">
                        {integration.icon}
                      </div>
                      <div className="mt-6 mb-6">
                        <h3 className="font-sans text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{appContent?.name}</h3>
                        <p className="text-foreground/60 text-base font-sans mt-2 leading-relaxed">{appContent?.desc}</p>
                      </div>
                      <div className="mt-auto w-full pt-6 border-t border-border/40 flex items-center justify-between">
                        <span className={`text-base font-semibold font-sans flex items-center gap-2 ${connected ? "text-primary" : "text-foreground/50"}`}>
                          <span className={`w-2 h-2 rounded-full ${connected ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "bg-foreground/20"}`} />
                          {connected ? t.settings.integrations.connected : t.settings.integrations.notConnected}
                        </span>
                        <button
                          onClick={() => handleConnectIntegration(integration.id)}
                          disabled={isConnecting}
                          className={`px-4 py-2 text-sm font-semibold rounded-xl font-sans border transition-all shadow-sm ${connected ? "bg-surface border-border/60 text-foreground hover:bg-background hover:text-red-500 hover:border-red-500/50" : "bg-background border-primary text-primary hover:bg-primary hover:text-background"} ${isConnecting ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {isConnecting ? "..." : connected ? t.settings.integrations.disconnect : t.settings.integrations.connect}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══ CRM ══════════════════════════════════════════════════════════ */}
          {activeSection === "crm" && (
            <div>
              <SectionHeader
                title="CRM Settings"
                description="Configure default behaviors for client management"
              />

              <SettingRow label="Default Client Type">
                <select
                  className={SELECT_CLS}
                  value={crmSettings.defaultClientType}
                  onChange={(e) => setCrmSettings((p) => ({ ...p, defaultClientType: e.target.value }))}
                >
                  <option value="BUYER">Buyer</option>
                  <option value="SELLER">Seller</option>
                  <option value="REFERRAL">Referral</option>
                </select>
              </SettingRow>

              <SettingRow label="Default Funnel Stage on Create">
                <select
                  className={SELECT_CLS}
                  value={crmSettings.defaultFunnelStage}
                  onChange={(e) => setCrmSettings((p) => ({ ...p, defaultFunnelStage: e.target.value }))}
                >
                  <option value="LEAD">Lead</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="SHOWING">Showing</option>
                  <option value="OFFERING">Offering</option>
                </select>
              </SettingRow>

              <SettingRow
                label="Auto-assign new clients to me"
                description="Automatically set yourself as the assigned agent for new clients"
              >
                <Toggle
                  checked={crmSettings.autoAssignToMe}
                  onChange={(v) => setCrmSettings((p) => ({ ...p, autoAssignToMe: v }))}
                />
              </SettingRow>

              <SettingRow
                label="Duplicate email detection"
                description="Warn when adding a client with an existing email"
              >
                <Toggle
                  checked={crmSettings.duplicateEmailCheck}
                  onChange={(v) => setCrmSettings((p) => ({ ...p, duplicateEmailCheck: v }))}
                />
              </SettingRow>

              <SettingRow
                label="Show Budget Field"
                description="Display budget range on client cards"
              >
                <Toggle
                  checked={crmSettings.showBudgetField}
                  onChange={(v) => setCrmSettings((p) => ({ ...p, showBudgetField: v }))}
                />
              </SettingRow>

              <SettingRow
                label="Lead Sources"
                description="Comma-separated list of lead source options"
              >
                <textarea
                  rows={2}
                  className={`${TEXTAREA_CLS} w-72`}
                  value={crmSettings.leadSources}
                  onChange={(e) => setCrmSettings((p) => ({ ...p, leadSources: e.target.value }))}
                />
              </SettingRow>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveCrm}
                  className="px-5 py-2 bg-primary text-background text-sm font-semibold rounded-lg hover:opacity-90 transition uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ══ PROPERTIES ═══════════════════════════════════════════════════ */}
          {activeSection === "properties" && (
            <div>
              <SectionHeader
                title="Properties Settings"
                description="Configure defaults for property listings"
              />

              <SettingRow label="Default Listing Status">
                <select
                  className={SELECT_CLS}
                  value={propertySettings.defaultStatus}
                  onChange={(e) => setPropertySettings((p) => ({ ...p, defaultStatus: e.target.value }))}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMING_SOON">Coming Soon</option>
                </select>
              </SettingRow>

              <SettingRow label="Price Display Format">
                <select
                  className={SELECT_CLS}
                  value={propertySettings.priceFormat}
                  onChange={(e) => setPropertySettings((p) => ({ ...p, priceFormat: e.target.value }))}
                >
                  <option value="full">$1,450,000</option>
                  <option value="abbrev">$1.45M</option>
                </select>
              </SettingRow>

              <SettingRow
                label="Default Agent to Me"
                description="Set yourself as the listing agent automatically"
              >
                <Toggle
                  checked={propertySettings.defaultAgentSelf}
                  onChange={(v) => setPropertySettings((p) => ({ ...p, defaultAgentSelf: v }))}
                />
              </SettingRow>

              <SettingRow
                label="Require Beds & Baths"
                description="Make beds and baths required fields"
              >
                <Toggle
                  checked={propertySettings.requireBeds}
                  onChange={(v) => setPropertySettings((p) => ({ ...p, requireBeds: v, requireBaths: v }))}
                />
              </SettingRow>

              <SettingRow label="Require Square Footage">
                <Toggle
                  checked={propertySettings.requireSqft}
                  onChange={(v) => setPropertySettings((p) => ({ ...p, requireSqft: v }))}
                />
              </SettingRow>

              <SettingRow label="Max Photos Per Listing">
                <input
                  type="number"
                  min={1}
                  max={50}
                  className={`${INPUT_CLS} w-20`}
                  value={propertySettings.photoLimit}
                  onChange={(e) => setPropertySettings((p) => ({ ...p, photoLimit: Number(e.target.value) }))}
                />
              </SettingRow>

              <SettingRow label="Description Max Characters">
                <input
                  type="number"
                  className={`${INPUT_CLS} w-24`}
                  value={propertySettings.descMaxChars}
                  onChange={(e) => setPropertySettings((p) => ({ ...p, descMaxChars: Number(e.target.value) }))}
                />
              </SettingRow>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveProperty}
                  className="px-5 py-2 bg-primary text-background text-sm font-semibold rounded-lg hover:opacity-90 transition uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ══ FINANCE ══════════════════════════════════════════════════════ */}
          {activeSection === "finance" && (
            <div>
              <SectionHeader
                title="Finance & Commission"
                description="Set default commission rates and financial display preferences"
              />

              <SettingRow label="Default Commission Rate (%)">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className={`${INPUT_CLS} w-24`}
                  value={financeSettings.defaultCommissionRate}
                  onChange={(e) => setFinanceSettings((p) => ({ ...p, defaultCommissionRate: e.target.value }))}
                />
              </SettingRow>

              <SettingRow
                label="Firm Split (%)"
                description="Percentage retained by the firm from gross commission"
              >
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  className={`${INPUT_CLS} w-20`}
                  value={financeSettings.firmSplitPercent}
                  onChange={(e) => setFinanceSettings((p) => ({ ...p, firmSplitPercent: e.target.value }))}
                />
              </SettingRow>

              <SettingRow label="Override / Team Leader Split (%)">
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  className={`${INPUT_CLS} w-20`}
                  value={financeSettings.overridePercent}
                  onChange={(e) => setFinanceSettings((p) => ({ ...p, overridePercent: e.target.value }))}
                />
              </SettingRow>

              <SettingRow label="Fiscal Year Start Month">
                <select
                  className={SELECT_CLS}
                  value={financeSettings.fiscalYearStart}
                  onChange={(e) => setFinanceSettings((p) => ({ ...p, fiscalYearStart: e.target.value }))}
                >
                  {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m, i) => (
                    <option key={i + 1} value={String(i + 1)}>{m}</option>
                  ))}
                </select>
              </SettingRow>

              <SettingRow label="Currency">
                <select
                  className={SELECT_CLS}
                  value={financeSettings.currency}
                  onChange={(e) => setFinanceSettings((p) => ({ ...p, currency: e.target.value }))}
                >
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="CAD">CAD — Canadian Dollar</option>
                </select>
              </SettingRow>

              <SettingRow
                label="Show Gross Amount in Leaderboard"
                description="Display gross commission amounts to all agents"
              >
                <Toggle
                  checked={financeSettings.showGrossInLeaderboard}
                  onChange={(v) => setFinanceSettings((p) => ({ ...p, showGrossInLeaderboard: v }))}
                />
              </SettingRow>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveFinance}
                  className="px-5 py-2 bg-primary text-background text-sm font-semibold rounded-lg hover:opacity-90 transition uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ══ APPOINTMENTS ═════════════════════════════════════════════════ */}
          {activeSection === "appointments" && (
            <div>
              <SectionHeader
                title="Appointments & Calendar"
                description="Configure scheduling defaults and working hours"
              />

              <SettingRow label="Default Appointment Duration (min)">
                <select
                  className={SELECT_CLS}
                  value={appointmentSettings.defaultDuration}
                  onChange={(e) => setAppointmentSettings((p) => ({ ...p, defaultDuration: e.target.value }))}
                >
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                  <option value="120">120 min</option>
                </select>
              </SettingRow>

              <SettingRow label="Reminder Before Appointment (hrs)">
                <select
                  className={SELECT_CLS}
                  value={appointmentSettings.reminderBefore}
                  onChange={(e) => setAppointmentSettings((p) => ({ ...p, reminderBefore: e.target.value }))}
                >
                  <option value="1">1 hr</option>
                  <option value="2">2 hrs</option>
                  <option value="4">4 hrs</option>
                  <option value="8">8 hrs</option>
                  <option value="24">24 hrs</option>
                  <option value="48">48 hrs</option>
                </select>
              </SettingRow>

              <SettingRow label="Buffer Between Appointments (min)">
                <select
                  className={SELECT_CLS}
                  value={appointmentSettings.bufferBetween}
                  onChange={(e) => setAppointmentSettings((p) => ({ ...p, bufferBetween: e.target.value }))}
                >
                  <option value="0">None</option>
                  <option value="10">10 min</option>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                </select>
              </SettingRow>

              <SettingRow label="Workday Start">
                <input
                  type="time"
                  className={`${INPUT_CLS} w-32`}
                  value={appointmentSettings.workdayStart}
                  onChange={(e) => setAppointmentSettings((p) => ({ ...p, workdayStart: e.target.value }))}
                />
              </SettingRow>

              <SettingRow label="Workday End">
                <input
                  type="time"
                  className={`${INPUT_CLS} w-32`}
                  value={appointmentSettings.workdayEnd}
                  onChange={(e) => setAppointmentSettings((p) => ({ ...p, workdayEnd: e.target.value }))}
                />
              </SettingRow>

              <SettingRow label="Show Weekends in Calendar">
                <Toggle
                  checked={appointmentSettings.showWeekends}
                  onChange={(v) => setAppointmentSettings((p) => ({ ...p, showWeekends: v }))}
                />
              </SettingRow>

              <SettingRow
                label="Allow Clients to Self-Book"
                description="Enable public booking link (requires client portal) — Coming soon"
              >
                <Toggle
                  checked={appointmentSettings.allowClientBooking}
                  onChange={(v) => setAppointmentSettings((p) => ({ ...p, allowClientBooking: v }))}
                  disabled
                />
              </SettingRow>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveAppointment}
                  className="px-5 py-2 bg-primary text-background text-sm font-semibold rounded-lg hover:opacity-90 transition uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ══ DOCUMENTS ════════════════════════════════════════════════════ */}
          {activeSection === "documents" && (
            <div>
              <SectionHeader
                title="Document Management"
                description="Configure file upload rules and retention policies"
              />

              <SettingRow
                label="Allowed File Types"
                description="Comma-separated list of accepted extensions"
              >
                <input
                  className={`${INPUT_CLS} w-64`}
                  value={documentSettings.allowedTypes}
                  onChange={(e) => setDocumentSettings((p) => ({ ...p, allowedTypes: e.target.value }))}
                />
              </SettingRow>

              <SettingRow label="Max File Size (MB)">
                <input
                  type="number"
                  min={1}
                  max={500}
                  className={`${INPUT_CLS} w-20`}
                  value={documentSettings.maxFileSizeMb}
                  onChange={(e) => setDocumentSettings((p) => ({ ...p, maxFileSizeMb: e.target.value }))}
                />
              </SettingRow>

              <SettingRow
                label="Retention Period (days)"
                description="How long to keep archived documents"
              >
                <input
                  type="number"
                  className={`${INPUT_CLS} w-24`}
                  value={documentSettings.retentionDays}
                  onChange={(e) => setDocumentSettings((p) => ({ ...p, retentionDays: e.target.value }))}
                />
              </SettingRow>

              <SettingRow
                label="Auto-organize by Transaction"
                description="Sort uploaded files into transaction folders automatically"
              >
                <Toggle
                  checked={documentSettings.autoOrganizeByTransaction}
                  onChange={(v) => setDocumentSettings((p) => ({ ...p, autoOrganizeByTransaction: v }))}
                />
              </SettingRow>

              <SettingRow
                label="Require Signature for Contracts"
                description="Flag contract-type documents as requiring e-signature"
              >
                <Toggle
                  checked={documentSettings.requireSignatureForContract}
                  onChange={(v) => setDocumentSettings((p) => ({ ...p, requireSignatureForContract: v }))}
                />
              </SettingRow>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveDocument}
                  className="px-5 py-2 bg-primary text-background text-sm font-semibold rounded-lg hover:opacity-90 transition uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ══ MARKETING ════════════════════════════════════════════════════ */}
          {activeSection === "marketing" && (
            <div>
              <SectionHeader
                title="Marketing"
                description="Configure content generation and campaign defaults"
              />

              <SettingRow
                label="Enable AI Content Generation"
                description="Use AI to generate property descriptions and social captions"
              >
                <Toggle
                  checked={marketingSettings.aiContentEnabled}
                  onChange={(v) => setMarketingSettings((p) => ({ ...p, aiContentEnabled: v }))}
                />
              </SettingRow>

              <SettingRow
                label="Default Hashtags"
                description="Applied to all social media posts"
              >
                <input
                  className={`${INPUT_CLS} w-full max-w-sm`}
                  value={marketingSettings.defaultHashtags}
                  onChange={(e) => setMarketingSettings((p) => ({ ...p, defaultHashtags: e.target.value }))}
                />
              </SettingRow>

              <SettingRow label="Auto-Close Campaigns After (days)">
                <input
                  type="number"
                  min={1}
                  max={365}
                  className={`${INPUT_CLS} w-20`}
                  value={marketingSettings.autoCloseCampaignDays}
                  onChange={(e) => setMarketingSettings((p) => ({ ...p, autoCloseCampaignDays: e.target.value }))}
                />
              </SettingRow>

              <SettingRow
                label="Email Signature"
                description="Added to all outgoing marketing emails"
              >
                <textarea
                  rows={3}
                  className={`${TEXTAREA_CLS} w-full max-w-sm`}
                  value={marketingSettings.emailSignature}
                  onChange={(e) => setMarketingSettings((p) => ({ ...p, emailSignature: e.target.value }))}
                />
              </SettingRow>

              <SettingRow label="Default Listing Description Template">
                <textarea
                  rows={4}
                  className={`${TEXTAREA_CLS} w-full max-w-sm`}
                  placeholder="[Address] is a stunning [beds]-bedroom, [baths]-bathroom home..."
                  value={marketingSettings.defaultListingTemplate}
                  onChange={(e) => setMarketingSettings((p) => ({ ...p, defaultListingTemplate: e.target.value }))}
                />
              </SettingRow>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSaveMarketing}
                  className="px-5 py-2 bg-primary text-background text-sm font-semibold rounded-lg hover:opacity-90 transition uppercase tracking-wider"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Edit User Modal ─────────────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-background ring-1 ring-border/50 shadow-2xl w-full max-w-md overflow-hidden flex flex-col rounded-3xl">
            <div className="p-8 border-b border-border/40 flex justify-between items-center bg-surface/30">
              <h2 className="font-sans text-2xl font-semibold text-foreground">
                {(t.settings.users as any).editModalTitle}
              </h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-foreground/40 hover:text-foreground text-3xl font-light transition-colors leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
              <div>
                <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                  {t.settings.users.name}
                </label>
                <div className="w-full px-4 py-3 bg-surface border border-border/40 rounded-xl text-base text-foreground/80 font-sans shadow-inner">
                  {editingUser.name}
                </div>
              </div>
              <div>
                <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                  {t.settings.users.role}
                </label>
                <select
                  className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer shadow-sm"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="AGENT">{(t as any).roles?.["AGENT"] || "Agent"}</option>
                  <option value="MANAGER">{(t as any).roles?.["MANAGER"] || "Manager"}</option>
                  <option value="FIRMADMIN">{(t as any).roles?.["FIRMADMIN"] || "Firm Admin"}</option>
                </select>
              </div>
              <div>
                <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                  {t.settings.users.tier}
                </label>
                <select
                  className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer shadow-sm"
                  value={editingUser.tier}
                  onChange={(e) => setEditingUser({ ...editingUser, tier: e.target.value })}
                >
                  <option value="CORE">{(t as any).tiers?.["CORE"] || "Core"}</option>
                  <option value="PRO">{(t as any).tiers?.["PRO"] || "Pro"}</option>
                  <option value="ELITE">{(t as any).tiers?.["ELITE"] || "Elite"}</option>
                </select>
              </div>
              <div className="pt-6 flex justify-end gap-3 mt-8 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-6 py-2.5 bg-surface border border-border/60 text-foreground/70 rounded-xl text-base font-semibold hover:text-foreground transition-colors shadow-sm"
                >
                  {t.settings.users.cancel}
                </button>
                <button
                  disabled={isSavingUser}
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-background rounded-xl text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
                >
                  {isSavingUser ? "..." : t.settings.users.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
