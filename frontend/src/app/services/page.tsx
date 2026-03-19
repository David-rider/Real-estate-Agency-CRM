"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nContext";

export default function ServicesPage() {
  const { t } = useI18n();
  const [referring, setReferring] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);

  const handleRefer = async (partnerName: string) => {
    setReferring(partnerName);
    const token = localStorage.getItem("token");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/referrals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          refereeId: "mock-partner-id",
          status: "PENDING",
        }),
      });
      setTimeout(() => setReferring(null), 2000);
    } catch (error) {
      setReferring(null);
      console.error("Failed to refer", error);
    }
  };

  const handleGift = async () => {
    setOrdering(true);
    const token = localStorage.getItem("token");
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/gifts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          item: "Closing Anniversary Champagne",
          clientId: "mock-client-id",
        }),
      });
      setTimeout(() => setOrdering(false), 2000);
    } catch (error) {
      setOrdering(false);
      console.error("Failed to order gift", error);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out text-foreground pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border/40 pb-8">
        <div className="max-w-xl">
          <h1 className="font-sans text-4xl font-semibold tracking-tight text-foreground">
            {t.services.title}
          </h1>
          <p className="font-sans text-foreground/60 mt-3 text-base leading-relaxed">
            {t.services.subtitle}
          </p>
        </div>
        <button className="px-6 py-2.5 bg-primary text-background hover:opacity-90 transition-opacity duration-300 rounded-xl text-sm font-semibold shadow-md w-full md:w-auto text-center">
          {t.services.addPartner}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Partner Directory */}
        <div className="bg-background ring-1 ring-border/50 rounded-2xl shadow-sm p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/40">
            <h2 className="font-sans text-2xl font-semibold text-foreground">
              {t.services.directoryTitle}
            </h2>
            <span className="text-xs text-primary border border-primary/20 px-3 py-1 bg-primary/5 rounded-md font-sans font-bold">
              {t.services.topRated}
            </span>
          </div>

          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-surface/30 ring-1 ring-border/50 rounded-2xl hover:bg-background hover:shadow-md hover:ring-primary/50 transition-all duration-300 group gap-6 sm:gap-4">
              <div className="flex items-start sm:items-center gap-5">
                <div className="w-12 h-12 rounded-full border border-border/80 bg-surface flex items-center justify-center text-foreground font-sans font-bold text-xl shadow-sm group-hover:text-primary transition-colors">
                  G
                </div>
                <div className="flex flex-col">
                  <h4 className="font-sans text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    Goldberg & Associates
                  </h4>
                  <p className="font-sans text-xs font-medium text-foreground/60 mt-0.5">
                    {t.services.attorney}
                  </p>
                </div>
              </div>
              <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-4 sm:gap-3">
                <div className="font-sans text-sm font-semibold text-primary flex items-center gap-1.5">
                  ★ 4.9{" "}
                  <span className="text-foreground/50 font-medium text-xs">(124)</span>
                </div>
                <button
                  onClick={() => handleRefer("Goldberg")}
                  disabled={referring === "Goldberg"}
                  className="font-sans text-sm font-semibold text-foreground/70 hover:text-primary transition-colors disabled:opacity-50 flex items-center gap-1.5 group/btn"
                >
                  {referring === "Goldberg"
                    ? "Referred"
                    : t.services.referClient}
                  {referring === "Goldberg" ? (
                    <span className="text-primary font-bold">✓</span>
                  ) : (
                    <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-surface/30 ring-1 ring-border/50 rounded-2xl hover:bg-background hover:shadow-md hover:ring-primary/50 transition-all duration-300 group gap-6 sm:gap-4">
              <div className="flex items-start sm:items-center gap-5">
                <div className="w-12 h-12 rounded-full border border-border/80 bg-surface flex items-center justify-center text-foreground font-sans font-bold text-xl shadow-sm group-hover:text-primary transition-colors">
                  E
                </div>
                <div className="flex flex-col">
                  <h4 className="font-sans text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    Eagle Eye Inspections
                  </h4>
                  <p className="font-sans text-xs font-medium text-foreground/60 mt-0.5">
                    {t.services.inspector}
                  </p>
                </div>
              </div>
              <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-4 sm:gap-3">
                <div className="font-sans text-sm font-semibold text-primary flex items-center gap-1.5">
                  ★ 4.7{" "}
                  <span className="text-foreground/50 font-medium text-xs">(89)</span>
                </div>
                <button
                  onClick={() => handleRefer("EagleEye")}
                  disabled={referring === "EagleEye"}
                  className="font-sans text-sm font-semibold text-foreground/70 hover:text-primary transition-colors disabled:opacity-50 flex items-center gap-1.5 group/btn"
                >
                  {referring === "EagleEye"
                    ? "Referred"
                    : t.services.referClient}
                  {referring === "EagleEye" ? (
                    <span className="text-primary font-bold">✓</span>
                  ) : (
                    <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty & Gifts */}
        <div className="bg-background ring-1 ring-border/50 rounded-2xl shadow-sm p-8 flex flex-col h-full min-h-[400px]">
          <h2 className="font-sans text-2xl font-semibold text-foreground mb-8 pb-6 border-b border-border/40 flex items-center gap-3">
            {t.services.loyaltyTitle}
          </h2>

          <div className="bg-surface/30 ring-1 ring-border/50 rounded-xl flex flex-col items-center justify-center text-center flex-1 p-10 group hover:shadow-md hover:bg-background hover:ring-primary/50 transition-all duration-300">
            <div className="p-5 ring-1 ring-border/50 rounded-2xl bg-surface flex items-center justify-center text-4xl mb-8 group-hover:scale-105 transition-transform duration-500 ease-out shadow-sm">
              🍾
            </div>
            <h3 className="font-sans text-2xl font-semibold text-foreground mb-3">
              {t.services.loyaltySubtitle}
            </h3>
            <p className="font-sans text-base text-foreground/60 max-w-sm mb-10 leading-relaxed">
              {t.services.loyaltyDesc}
            </p>
            <button
              onClick={handleGift}
              disabled={ordering}
              className="px-8 py-3.5 bg-primary text-background rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 shadow-md disabled:opacity-50 flex items-center gap-2 w-full sm:w-auto justify-center group/btn"
            >
              {ordering ? (
                <>
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {t.services.browseGift}
                  <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
