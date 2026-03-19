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
  Line,
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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out text-foreground">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border/40 pb-8">
        <div className="max-w-xl">
          <h1 className="font-sans text-4xl font-semibold tracking-tight text-foreground">
            {t.dashboard.title}
          </h1>
          <p className="font-sans text-foreground/60 mt-3 text-base leading-relaxed">
            {t.dashboard.subtitle}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
          <button
            onClick={handleDownloadReport}
            className="px-6 py-2.5 bg-surface border border-border/60 hover:bg-surface-hover transition-colors duration-300 rounded-xl text-sm font-medium w-full sm:w-auto text-center"
          >
            {t.dashboard.downloadReport}
          </button>
          <button className="px-6 py-2.5 bg-primary text-background hover:opacity-90 transition-opacity duration-300 rounded-xl text-sm font-semibold w-full sm:w-auto text-center shadow-md">
            {t.dashboard.newLead}
          </button>
        </div>
      </div>

      {/* Asymmetrical Grid for Top Values */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* YTD Commission - Dominant Feature */}
        <div className="md:col-span-5 bg-surface ring-1 ring-border/50 rounded-2xl shadow-sm p-8 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[240px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none" />
          <div className="flex justify-between items-start relative z-10">
            <h3 className="font-sans text-sm font-medium text-foreground/60">
              {t.dashboard.ytdCommission}
            </h3>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(197,160,89,0.8)]" />
          </div>
          <div className="relative z-10">
            <p className="font-sans text-5xl lg:text-5xl font-bold mt-4 text-foreground">
              {loading
                ? "..."
                : `$${dashboardData.ytdCommission.toLocaleString()}`}
            </p>
            <div className="mt-8 w-full bg-background rounded-full h-1.5 overflow-hidden ring-1 ring-inset ring-black/10">
              <div className="bg-primary w-3/4 h-full rounded-full" />
            </div>
            <p className="font-sans text-xs font-medium text-foreground/50 mt-4">
              {t.dashboard.annualGoal}
            </p>
          </div>
        </div>

        {/* Secondary Cards in a sub-grid */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-surface ring-1 ring-border/50 rounded-2xl shadow-sm p-8 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[240px]">
            <h3 className="font-sans text-sm font-medium text-foreground/60">
              {t.dashboard.activeListings}
            </h3>
            <div>
              <p className="font-sans text-5xl font-semibold text-foreground mb-4">
                {loading ? "..." : dashboardData.activeListings}
              </p>
              <p className="font-sans text-xs font-medium text-foreground/50 flex items-center gap-2">
                <span className="text-primary bg-primary/10 p-1 rounded-full"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg></span>{" "}
                {t.dashboard.liveData}
              </p>
            </div>
          </div>

          <div className="bg-surface ring-1 ring-border/50 rounded-2xl shadow-sm p-8 hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[240px]">
            <h3 className="font-sans text-sm font-medium text-foreground/60">
              {t.dashboard.newLeads}
            </h3>
            <div>
              <p className="font-sans text-5xl font-semibold text-foreground mb-4">
                {loading ? "..." : dashboardData.newLeads}
              </p>
              <p className="font-sans text-xs font-medium text-foreground/50 flex items-center gap-2">
                <span className="text-primary bg-primary/10 p-1 rounded-full"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg></span>{" "}
                {t.dashboard.liveData}
              </p>
            </div>
          </div>

          <div className="bg-surface ring-1 ring-border/50 rounded-2xl shadow-sm p-8 hover:shadow-md transition-all duration-300 sm:col-span-2 flex flex-col sm:flex-row justify-between items-start sm:items-end min-h-[120px]">
            <div>
              <h3 className="font-sans text-sm font-medium text-foreground/60">
                {t.dashboard.pendingOffers}
              </h3>
              <p className="font-sans text-4xl font-semibold text-foreground mt-2">
                {loading ? "..." : dashboardData.pendingOffers}
              </p>
            </div>
            <p className="font-sans text-xs font-medium text-foreground/50 mt-4 sm:mt-0">
              {t.dashboard.liveData}
            </p>
          </div>
        </div>
      </div>

      {/* Advanced Analytical Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 mt-6">
        {/* 1. Commission & Deal Timeline (ComposedChart) */}
        <div className="flex flex-col bg-surface ring-1 ring-border/50 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-sans text-xl font-semibold text-foreground">
              {t.dashboard.charts?.timeline || "Performance Timeline"}
            </h2>
            <select className="font-sans text-sm border border-border/60 rounded-lg bg-background py-1.5 px-3 text-foreground/80 outline-none hover:border-foreground/30 transition-colors cursor-pointer appearance-none shadow-sm">
              <option>{t.dashboard.thisMonth}</option>
              <option>{t.dashboard.lastQuarter}</option>
            </select>
          </div>
          <div className="h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dashboardData.chartData}
                margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#333544"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#8f92a1",
                    fontSize: 11,
                    fontFamily: "var(--font-sans)",
                  }}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#8f92a1",
                    fontSize: 11,
                    fontFamily: "var(--font-sans)",
                  }}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#8f92a1",
                    fontSize: 11,
                    fontFamily: "var(--font-sans)",
                  }}
                />
                <Tooltip
                  cursor={{ fill: "#1c1d24" }}
                  contentStyle={{
                    borderRadius: "0px",
                    backgroundColor: "#0a0b10",
                    border: "1px solid #333544",
                    color: "#f8f9fa",
                    fontFamily: "var(--font-sans)",
                  }}
                />
                <Legend
                  wrapperStyle={{
                    fontSize: "12px",
                    fontFamily: "var(--font-sans)",
                  }}
                />
                <Bar
                  yAxisId="right"
                  dataKey="deals"
                  name={t.dashboard.charts?.dealsClosed || "Deals Closed"}
                  fill="#c5a059"
                  barSize={30}
                  opacity={0.3}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="commission"
                  name={t.dashboard.charts?.netCommission || "Net Commission"}
                  fill="#c5a059"
                  stroke="#c5a059"
                  opacity={0.6}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Pipeline Funnel (Vertical Bar Chart) */}
        <div className="flex flex-col bg-surface ring-1 ring-border/50 rounded-2xl p-6 shadow-sm">
          <h2 className="font-sans text-xl font-semibold text-foreground mb-6 flex items-center gap-3">
            {t.dashboard.charts?.funnel || "Conversion Funnel"}
          </h2>
          <div className="h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.funnelData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#333544"
                />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#f8f9fa",
                    fontSize: 12,
                    fontFamily: "var(--font-sans)",
                  }}
                  dx={-10}
                />
                <Tooltip
                  cursor={{ fill: "#1c1d24" }}
                  contentStyle={{
                    borderRadius: "0px",
                    backgroundColor: "#0a0b10",
                    border: "1px solid #333544",
                    color: "#f8f9fa",
                    fontFamily: "var(--font-sans)",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#c5a059"
                  barSize={32}
                  radius={[0, 4, 4, 0]}
                  label={{
                    position: "right",
                    fill: "#8f92a1",
                    fontSize: 12,
                    fontFamily: "var(--font-sans)",
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Action Items Section */}
      <div className="pt-8 mt-6">
        <div className="flex flex-col">
          <h2 className="font-sans text-xl font-semibold text-foreground mb-6 flex items-center gap-3">
            {t.dashboard.actionItems}
            <span className="px-2.5 py-0.5 bg-primary/10 rounded-full text-primary text-xs font-semibold">
              3
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboardData.actionItems && dashboardData.actionItems.length > 0 ? (
              dashboardData.actionItems.map((item) => (
                <div key={item.id} className="group bg-surface ring-1 ring-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-sans text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.type === 'OFFER' ? 'bg-primary/10 text-primary' : 'bg-surface-hover text-foreground/50'}`}>
                      {item.type}
                    </span>
                  </div>
                  <p className="font-sans text-sm text-foreground/60 mb-6 line-clamp-2">
                    {item.subtitle}
                  </p>
                  <button 
                    onClick={() => {
                      if (item.type === 'OFFER') window.location.href = '/transactions';
                      if (item.type === 'GIFT') window.location.href = '/services';
                    }}
                    className="font-sans text-sm font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1"
                  >
                    {item.actionLabel} <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              ))
            ) : (
              /* Fallback if no real action items are found */
              <>
                <div className="group bg-surface ring-1 ring-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-primary/20">
                  <p className="font-sans text-sm font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {t.dashboard.actions.signAgreement}
                  </p>
                  <p className="font-sans text-sm text-foreground/60 mb-6">
                    124 E 55th St - Apt 4A (Client: John D.)
                  </p>
                  <button className="font-sans text-sm font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1">
                    {t.dashboard.actions.reviewSign} <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
                <div className="group bg-surface ring-1 ring-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-primary/20">
                  <p className="font-sans text-sm font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {t.dashboard.actions.counterOffer}
                  </p>
                  <p className="font-sans text-sm text-foreground/60 mb-6">
                    Buyer accepted $1.4M for 10 Downing St.
                  </p>
                  <button className="font-sans text-sm font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1">
                    {t.dashboard.actions.viewTerms} <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
                <div className="group bg-surface ring-1 ring-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-primary/20">
                  <p className="font-sans text-sm font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {t.dashboard.actions.anniversary}
                  </p>
                  <p className="font-sans text-sm text-foreground/60 mb-6">
                    Send a nice gift to the Smith Family.
                  </p>
                  <button className="font-sans text-sm font-medium text-primary hover:text-primary-hover transition-colors flex items-center gap-1">
                    {t.dashboard.actions.orderGift} <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
