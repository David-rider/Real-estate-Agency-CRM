"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { useAuth } from "@/lib/auth/AuthContext";

export default function SettingsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const isAgent = user?.role === "AGENT";
  const [activeTab, setActiveTab] = React.useState(isAgent ? "security" : "users");
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingUser, setEditingUser] = React.useState<any>(null);
  const [isSavingUser, setIsSavingUser] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Integrations State
  const [integrationsState, setIntegrationsState] = React.useState({
    google: false,
    xero: false,
    quickbooks: false,
    mls: true, // Default connected for demo
    docusign: false
  });
  const [connectingApp, setConnectingApp] = React.useState<string | null>(null);

  // Mock Security Logs Data
  const mockSecurityLogs = [
    {
      id: 1,
      time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      risk: "HIGH",
      user: "Admin",
      actionKey: "e1",
    },
    {
      id: 2,
      time: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      risk: "MEDIUM",
      user: "Manager Smith",
      actionKey: "e2",
    },
    {
      id: 3,
      time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      risk: "LOW",
      user: "Agent Chen",
      actionKey: "e3",
    },
    {
      id: 4,
      time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      risk: "LOW",
      user: "Agent Doe",
      actionKey: "e4",
    },
    {
      id: 5,
      time: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      risk: "HIGH",
      user: "Admin",
      actionKey: "e5",
    },
  ];

  const [securityLogs, setSecurityLogs] = React.useState(mockSecurityLogs);
  const [sortKey, setSortKey] = React.useState<"TIME" | "RISK">("TIME");

  const handleSortLogs = (key: "TIME" | "RISK") => {
    setSortKey(key);
    const sorted = [...securityLogs].sort((a, b) => {
      if (key === "TIME") {
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      } else {
        const riskWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (
          riskWeight[b.risk as keyof typeof riskWeight] -
          riskWeight[a.risk as keyof typeof riskWeight]
        );
      }
    });
    setSecurityLogs(sorted);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/settings/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        alert(
          t.settings?.sessionExpired ||
            "Your session has expired. Please log out and log back in.",
        );
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      } else if (res.status === 403) {
        // Just forbidden, don't crash session
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

  React.useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/settings/users/${editingUser.id}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: editingUser.role,
            tier: editingUser.tier,
          }),
        },
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/settings/users/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/settings/users/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

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
    // We only have the mock endpoint for Google right now in this iteration
    if (appId !== "google") {
      setIntegrationsState(prev => ({ ...prev, [appId]: !prev[appId as keyof typeof prev] }));
      return;
    }

    const isConnected = integrationsState[appId as keyof typeof integrationsState];
    if (isConnected) {
      // Disconnect locally
      setIntegrationsState(prev => ({ ...prev, [appId]: false }));
      return;
    }

    setConnectingApp(appId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/integrations/${appId}/connect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setIntegrationsState(prev => ({ ...prev, [appId]: true }));
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

  const getRiskBadgeStyles = (risk: string) => {
    switch (risk) {
      case "HIGH":
        return "bg-red-900/10 text-red-500/80 border-red-900/20";
      case "MEDIUM":
        return "bg-amber-900/10 text-amber-500/80 border-amber-900/20";
      case "LOW":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-surface text-foreground/50 border-border";
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out text-foreground">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border/40 pb-8">
        <div className="max-w-xl">
          <h1 className="font-sans text-4xl font-semibold tracking-tight text-foreground">
            {t.settings.title}
          </h1>
          <p className="font-sans text-foreground/60 mt-3 text-base leading-relaxed">
            {t.settings.subtitle}
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex bg-surface/50 p-1.5 rounded-2xl w-fit font-sans text-sm font-semibold max-w-full overflow-x-auto custom-scrollbar">
        {!isAgent && (
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-2.5 transition-all rounded-xl whitespace-nowrap ${activeTab === "users" ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" : "text-foreground/60 hover:text-foreground hover:bg-background/50"}`}
          >
            {t.settings.tabs.users}
          </button>
        )}
        <button
          onClick={() => setActiveTab("security")}
          className={`px-6 py-2.5 transition-all rounded-xl whitespace-nowrap ${activeTab === "security" ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" : "text-foreground/60 hover:text-foreground hover:bg-background/50"}`}
        >
          {t.settings.tabs.security}
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          className={`px-6 py-2.5 transition-all rounded-xl whitespace-nowrap ${activeTab === "integrations" ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" : "text-foreground/60 hover:text-foreground hover:bg-background/50"}`}
        >
          {t.settings.tabs.integrations}
        </button>
      </div>

      {/* Main Content */}
      <div className="min-h-[500px]">
        {activeTab === "users" && (
          <div className="bg-background ring-1 ring-border/50 shadow-sm rounded-2xl overflow-hidden">
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
                  className="px-4 py-2 text-sm font-semibold font-sans border border-border/60 rounded-xl bg-surface hover:bg-background transition-colors text-foreground shadow-sm"
                >
                  {isImporting ? "Importing..." : "Import Users"}
                </button>
                <button 
                  onClick={handleExportUsers}
                  disabled={isExporting}
                  className="px-4 py-2 text-sm font-semibold font-sans border border-primary text-primary rounded-xl hover:bg-primary hover:text-background transition-colors shadow-sm"
                >
                  {isExporting ? "Exporting..." : "Export CSV"}
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface/50 border-b border-border/40 text-xs font-semibold text-foreground/60 font-sans">
                  <tr>
                    <th className="p-4 pl-6 font-semibold whitespace-nowrap">
                      {t.settings.users.name}
                    </th>
                    <th className="p-4 font-semibold whitespace-nowrap">
                      {t.settings.users.email}
                    </th>
                    <th className="p-4 font-semibold whitespace-nowrap">
                      {t.settings.users.role}
                    </th>
                    <th className="p-4 font-semibold whitespace-nowrap">
                      {t.settings.users.tier}
                    </th>
                    <th className="p-4 font-semibold whitespace-nowrap">
                      {t.settings.users.joined}
                    </th>
                    <th className="p-4 pr-6 font-semibold whitespace-nowrap text-right">
                      {t.settings.users.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-sans text-sm">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-10 text-center text-foreground/50 text-sm font-semibold"
                      >
                        {(t.settings.users as any).loading}
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-surface/30 transition-colors group"
                      >
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 border border-border/80 rounded-full bg-surface text-foreground flex items-center justify-center font-sans font-semibold text-sm group-hover:border-primary/50 group-hover:text-primary transition-colors shadow-sm">
                              {u.name?.charAt(0) || "U"}
                            </div>
                            <span className="text-foreground font-medium group-hover:text-primary transition-colors">
                              {u.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-foreground/70">{u.email}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md border border-border/60 bg-surface/50 text-foreground/70 ${["FIRMADMIN", "SUPERADMIN"].includes(u.role) ? "border-primary/50 text-primary bg-primary/10" : ""}`}
                          >
                            {(t as any).roles?.[u.role] || u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md border border-border/60 bg-surface/50 text-foreground/70 ${u.tier === "ELITE" ? "border-primary/30 text-primary bg-primary/5" : ""}`}
                          >
                            {(t as any).tiers?.[u.tier] || u.tier}
                          </span>
                        </td>
                        <td className="p-4 text-foreground/60 text-sm">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          {["FIRMADMIN", "SUPERADMIN"].includes(user?.role as string) && (
                            <button
                              onClick={() => setEditingUser({ ...u })}
                              className="text-primary hover:text-primary-hover font-sans text-sm font-semibold transition-colors"
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
        )}

        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="flex justify-end gap-3 mb-4">
              <button
                onClick={() => handleSortLogs("TIME")}
                className={`px-5 py-2 text-xs font-semibold rounded-lg font-sans border transition-colors ${sortKey === "TIME" ? "bg-surface ring-1 ring-border/50 text-foreground shadow-sm" : "bg-transparent border-transparent text-foreground/60 hover:text-foreground"}`}
              >
                {t.settings.security.sortTime}
              </button>
              <button
                onClick={() => handleSortLogs("RISK")}
                className={`px-5 py-2 text-xs font-semibold rounded-lg font-sans border transition-colors ${sortKey === "RISK" ? "bg-surface ring-1 ring-border/50 text-foreground shadow-sm" : "bg-transparent border-transparent text-foreground/60 hover:text-foreground"}`}
              >
                {t.settings.security.sortRisk}
              </button>
            </div>

            <div className="bg-background ring-1 ring-border/50 shadow-sm rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface/50 border-b border-border/40 text-xs font-semibold text-foreground/60 font-sans">
                  <tr>
                    <th className="p-4 pl-6 font-semibold whitespace-nowrap">
                      {t.settings.security.timestamp}
                    </th>
                    <th className="p-4 font-semibold whitespace-nowrap">
                      {t.settings.security.risk}
                    </th>
                    <th className="p-4 font-semibold whitespace-nowrap">
                      {t.settings.security.user}
                    </th>
                    <th className="p-4 pr-6 font-semibold whitespace-nowrap w-full">
                      {t.settings.security.event}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-sans text-sm">
                  {securityLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-surface/30 transition-colors"
                    >
                      <td className="p-4 pl-6 text-foreground/60 text-sm">
                        {new Date(log.time).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-md border ${getRiskBadgeStyles(log.risk)}`}
                        >
                          {(t.settings.security.riskLevels as any)[log.risk] ||
                            log.risk}
                        </span>
                      </td>
                      <td className="p-4 text-foreground/90 font-medium">
                        {log.user}
                      </td>
                      <td className="p-4 pr-6 text-foreground/70 truncate max-w-md">
                        {(t.settings.security as any).mockEvents?.[
                          log.actionKey
                        ] || log.actionKey}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "integrations" && (
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
              const appContent = (t.settings.integrations.apps as any)[
                integration.id
              ];
              return (
                <div
                  key={integration.id}
                  className="bg-background ring-1 ring-border/50 rounded-2xl shadow-sm p-8 flex flex-col items-start hover:shadow-md hover:ring-primary/50 transition-all duration-300 group"
                >
                  <div className="w-14 h-14 border border-border/60 rounded-xl bg-surface flex items-center justify-center font-sans font-bold text-2xl text-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors shadow-sm">
                    {integration.icon}
                  </div>
                  <div className="mt-6 mb-6">
                    <h3 className="font-sans text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {appContent?.name}
                    </h3>
                    <p className="text-foreground/60 text-sm font-sans mt-2 leading-relaxed">
                      {appContent?.desc}
                    </p>
                  </div>
                  <div className="mt-auto w-full pt-6 border-t border-border/40 flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold font-sans flex items-center gap-2 ${connected ? "text-primary" : "text-foreground/50"}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${connected ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "bg-foreground/20"}`}
                      ></span>
                      {connected
                        ? t.settings.integrations.connected
                        : t.settings.integrations.notConnected}
                    </span>
                    <button
                      onClick={() => handleConnectIntegration(integration.id)}
                      disabled={isConnecting}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl font-sans border transition-all shadow-sm ${connected ? "bg-surface border-border/60 text-foreground hover:bg-background hover:text-red-500 hover:border-red-500/50" : "bg-background border-primary text-primary hover:bg-primary hover:text-background"} ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isConnecting ? "..." : (connected
                        ? t.settings.integrations.disconnect
                        : t.settings.integrations.connect)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit User Modal Overlay */}
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
                <label className="block font-sans text-xs font-semibold text-foreground/60 mb-2">
                  {t.settings.users.name}
                </label>
                <div className="w-full px-4 py-3 bg-surface border border-border/40 rounded-xl text-sm text-foreground/80 font-sans shadow-inner">
                  {editingUser.name}
                </div>
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold text-foreground/60 mb-2">
                  {t.settings.users.role}
                </label>
                <select
                  className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer shadow-sm"
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value })
                  }
                >
                  <option value="AGENT">
                    {(t as any).roles?.["AGENT"] || "Agent"}
                  </option>
                  <option value="MANAGER">
                    {(t as any).roles?.["MANAGER"] || "Manager"}
                  </option>
                  <option value="FIRMADMIN">
                    {(t as any).roles?.["FIRMADMIN"] || "Firm Admin"}
                  </option>
                </select>
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold text-foreground/60 mb-2">
                  {t.settings.users.tier}
                </label>
                <select
                  className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer shadow-sm"
                  value={editingUser.tier}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, tier: e.target.value })
                  }
                >
                  <option value="CORE">
                    {(t as any).tiers?.["CORE"] || "Core"}
                  </option>
                  <option value="PRO">
                    {(t as any).tiers?.["PRO"] || "Pro"}
                  </option>
                  <option value="ELITE">
                    {(t as any).tiers?.["ELITE"] || "Elite"}
                  </option>
                </select>
              </div>

              <div className="pt-6 flex justify-end gap-3 mt-8 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-6 py-2.5 bg-surface border border-border/60 text-foreground/70 rounded-xl text-sm font-semibold hover:text-foreground transition-colors shadow-sm"
                >
                  {t.settings.users.cancel}
                </button>
                <button
                  disabled={isSavingUser}
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-background rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
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
