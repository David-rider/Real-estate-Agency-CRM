"use client";

import { useI18n } from "@/lib/i18n/I18nContext";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  ComposedChart,
  Area,
  Legend,
} from "recharts";
import React from "react";

export default function DashboardPage() {
  const { t } = useI18n();

  const [dashboardData, setDashboardData] = React.useState({
    activeListings: 0,
    newLeads: 0,
    pendingOffers: 0,
    chartData: [
      { name: "Jan", deals: 0, commission: 0 },
      { name: "Feb", deals: 0, commission: 0 },
    ],
    funnelData: [
      { name: "Total Leads", value: 0 },
      { name: "Active", value: 0 },
      { name: "In Contract", value: 0 },
      { name: "Closed", value: 0 },
    ],
    ytdCommission: 0,
    actionItems: [] as any[],
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          alert(
            t.dashboard?.sessionExpired ||
              "Your session has expired. Please log out and log back in.",
          );
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/login";
          throw new Error("Session Expired");
        }
        return res.json();
      })
      .then((data) => {
        setDashboardData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard data", err);
        setLoading(false);
      });
  }, [t.dashboard]);

  const handleDownloadReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Real Estate Brokerage Management Platform Agent CRM - Dashboard Report\n\n";
    csvContent += "Metric,Value\n";
    csvContent += `Active Listings,${dashboardData.activeListings}\n`;
    csvContent += `New Leads,${dashboardData.newLeads}\n`;
    csvContent += `Pending Offers,${dashboardData.pendingOffers}\n\n`;
    csvContent += "6-Month Pipeline,Deals Generated\n";
    dashboardData.chartData.forEach((row) => {
      csvContent += `${row.name},${row.deals}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `dashboard_report_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out text-foreground">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t.dashboard.title}
          </h1>
          <p className="text-foreground/50 mt-1 text-sm">
            {t.dashboard.subtitle}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
          <button
            onClick={handleDownloadReport}
            className="px-4 py-2 bg-surface border border-border hover:bg-surface-hover transition-colors rounded-lg text-sm font-medium w-full sm:w-auto text-center"
          >
            {t.dashboard.downloadReport}
          </button>
          <button className="px-4 py-2 bg-primary text-background hover:opacity-90 transition-opacity rounded-lg text-sm font-semibold w-full sm:w-auto text-center shadow-sm">
            {t.dashboard.newLead}
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* YTD Commission - Dominant Feature */}
        <div className="md:col-span-5 bg-surface border border-border rounded-xl p-6 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[200px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[80px] pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <h3 className="text-sm font-medium text-foreground/50">
              {t.dashboard.ytdCommission}
            </h3>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_6px_var(--primary)]" />
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-bold mt-3 text-foreground tracking-tight">
              {loading
                ? "..."
                : `$${dashboardData.ytdCommission.toLocaleString()}`}
            </p>
            <div className="mt-6 w-full bg-background rounded-full h-1.5 overflow-hidden ring-1 ring-inset ring-border">
              <div className="bg-primary w-3/4 h-full rounded-full" />
            </div>
            <p className="text-xs font-medium text-foreground/40 mt-3">
              {t.dashboard.annualGoal}
            </p>
          </div>
        </div>

        {/* Secondary Cards */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-xl p-6 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[200px]">
            <h3 className="text-sm font-medium text-foreground/50">
              {t.dashboard.activeListings}
            </h3>
            <div>
              <p className="text-4xl font-bold text-foreground mb-3">
                {loading ? "..." : dashboardData.activeListings}
              </p>
              <p className="text-xs font-medium text-foreground/40 flex items-center gap-1.5">
                <span className="text-primary bg-primary/10 p-0.5 rounded-full"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg></span>
                {t.dashboard.liveData}
              </p>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[200px]">
            <h3 className="text-sm font-medium text-foreground/50">
              {t.dashboard.newLeads}
            </h3>
            <div>
              <p className="text-4xl font-bold text-foreground mb-3">
                {loading ? "..." : dashboardData.newLeads}
              </p>
              <p className="text-xs font-medium text-foreground/40 flex items-center gap-1.5">
                <span className="text-primary bg-primary/10 p-0.5 rounded-full"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg></span>
                {t.dashboard.liveData}
              </p>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 hover:shadow-md transition-all duration-300 sm:col-span-2 flex flex-col sm:flex-row justify-between items-start sm:items-end min-h-[90px]">
            <div>
              <h3 className="text-sm font-medium text-foreground/50">
                {t.dashboard.pendingOffers}
              </h3>
              <p className="text-3xl font-bold text-foreground mt-1">
                {loading ? "..." : dashboardData.pendingOffers}
              </p>
            </div>
            <p className="text-xs font-medium text-foreground/40 mt-3 sm:mt-0">
              {t.dashboard.liveData}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission & Deal Timeline */}
        <div className="flex flex-col bg-surface border border-border rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-semibold text-foreground">
              {t.dashboard.charts?.timeline || "Performance Timeline"}
            </h2>
            <select className="text-sm border border-border rounded-lg bg-background py-1 px-2 text-foreground/70 outline-none hover:border-foreground/30 transition-colors cursor-pointer appearance-none">
              <option>{t.dashboard.thisMonth}</option>
              <option>{t.dashboard.lastQuarter}</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dashboardData.chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--foreground)", fontSize: 11, opacity: 0.4 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: "var(--foreground)", fontSize: 11, opacity: 0.4 }} tickFormatter={(val) => `$${val / 1000}k`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: "var(--foreground)", fontSize: 11, opacity: 0.4 }} />
                <Tooltip cursor={{ fill: "var(--surface-hover)" }} contentStyle={{ borderRadius: "8px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar yAxisId="right" dataKey="deals" name={t.dashboard.charts?.dealsClosed || "Deals Closed"} fill="var(--primary)" barSize={24} opacity={0.3} radius={[4, 4, 0, 0]} />
                <Area yAxisId="left" type="monotone" dataKey="commission" name={t.dashboard.charts?.netCommission || "Net Commission"} fill="var(--primary)" stroke="var(--primary)" opacity={0.5} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Funnel */}
        <div className="flex flex-col bg-surface border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4">
            {t.dashboard.charts?.funnel || "Conversion Funnel"}
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.funnelData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 30, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--foreground)", fontSize: 12, opacity: 0.7 }} dx={-5} />
                <Tooltip cursor={{ fill: "var(--surface-hover)" }} contentStyle={{ borderRadius: "8px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "12px" }} />
                <Bar dataKey="value" fill="var(--primary)" barSize={28} radius={[0, 4, 4, 0]} label={{ position: "right", fill: "var(--foreground)", fontSize: 12, opacity: 0.5 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          {t.dashboard.actionItems}
          <span className="px-2 py-0.5 bg-primary/10 rounded-full text-primary text-xs font-bold">3</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dashboardData.actionItems && dashboardData.actionItems.length > 0 ? (
            dashboardData.actionItems.map((item) => (
              <div key={item.id} className="group bg-surface border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-1.5">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${item.type === 'OFFER' ? 'bg-primary/10 text-primary' : 'bg-surface-hover text-foreground/40'}`}>
                    {item.type}
                  </span>
                </div>
                <p className="text-sm text-foreground/50 mb-4 line-clamp-2">
                  {item.subtitle}
                </p>
                <button 
                  onClick={() => {
                    if (item.type === 'OFFER') window.location.href = '/transactions';
                    if (item.type === 'GIFT') window.location.href = '/services';
                  }}
                  className="text-sm font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
                >
                  {item.actionLabel} <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            ))
          ) : (
            <>
              <div className="group bg-surface border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all duration-300">
                <p className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                  {t.dashboard.actions.signAgreement}
                </p>
                <p className="text-sm text-foreground/50 mb-4">
                  124 E 55th St - Apt 4A (Client: John D.)
                </p>
                <button className="text-sm font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1">
                  {t.dashboard.actions.reviewSign} <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <div className="group bg-surface border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all duration-300">
                <p className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                  {t.dashboard.actions.counterOffer}
                </p>
                <p className="text-sm text-foreground/50 mb-4">
                  Buyer accepted $1.4M for 10 Downing St.
                </p>
                <button className="text-sm font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1">
                  {t.dashboard.actions.viewTerms} <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
              <div className="group bg-surface border border-border rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all duration-300">
                <p className="text-sm font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                  {t.dashboard.actions.anniversary}
                </p>
                <p className="text-sm text-foreground/50 mb-4">
                  Send a nice gift to the Smith Family.
                </p>
                <button className="text-sm font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1">
                  {t.dashboard.actions.orderGift} <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
