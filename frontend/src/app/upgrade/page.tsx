"use client";

import React, { useState } from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";

export default function UpgradePage() {
  const { t } = useI18n();
  const { user, updateUser } = useAuth();
  const router = useRouter();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [selectedPlan, setSelectedPlan] = useState<"CORE" | "PRO" | "ELITE">((user?.tier as "CORE" | "PRO" | "ELITE") || "CORE");
  
  // Checkout Modal State
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cc" | "paypal">("cc");
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const handleSelectPlan = (plan: "CORE" | "PRO" | "ELITE") => {
    if (plan === user?.tier) return;
    if (plan === "CORE") return; // cannot downgrade to core from here
    setSelectedPlan(plan);
    setShowCheckout(true);
  };

  const currentPlanObj = selectedPlan === "PRO" ? t.upgrade.pro : t.upgrade.elite;
  const currentPrice = billingCycle === "annual" ? (currentPlanObj as any).priceA : (currentPlanObj as any).priceM;
  const planIdToPurchase = `${selectedPlan}_${billingCycle.toUpperCase()}`;

  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");

      // 1. Checkout (Get Intent)
      const checkoutRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/payments/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId: planIdToPurchase, paymentMethod })
      });
      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok) throw new Error(checkoutData.error);

      // 2. Confirm Payment & Upgrade
      const confirmRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/payments/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentIntentId: checkoutData.paymentIntentId, planId: planIdToPurchase })
      });
      const confirmData = await confirmRes.json();

      if (!confirmRes.ok) throw new Error(confirmData.error);

      // 3. Success - Update context
      if (user) {
        const updatedUser = { ...user, tier: confirmData.subscriptionDetails.tier };
        updateUser(updatedUser);
      }
      setCheckoutSuccess(true);
      
    } catch (err) {
      console.error(err);
      alert(t.upgrade.checkout.sessionExpired);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Hero Section */}
      <div className="pt-24 pb-16 px-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h1 className="font-serif text-5xl md:text-6xl font-light tracking-tight mb-6">
          {t.upgrade.title}
        </h1>
        <p className="font-sans text-lg text-foreground/60 max-w-2xl mx-auto font-light leading-relaxed">
          {t.upgrade.subtitle}
        </p>

        {/* Toggle billing */}
        <div className="mt-12 inline-flex items-center gap-4 bg-surface p-1 rounded-full border border-border">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2 rounded-full text-sm font-sans uppercase tracking-widest transition-all ${
              billingCycle === "monthly" ? "bg-background shadow text-foreground" : "text-foreground/50 hover:text-foreground"
            }`}
          >
            {t.upgrade.monthly}
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className={`px-6 py-2 rounded-full text-sm font-sans uppercase tracking-widest transition-all flex items-center gap-2 ${
              billingCycle === "annual" ? "bg-background shadow text-foreground" : "text-foreground/50 hover:text-foreground"
            }`}
          >
            {t.upgrade.annual}
            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-medium">
              {t.upgrade.save}
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
        
        {/* Core Card */}
        <div className={`p-8 rounded-2xl flex flex-col transition-all duration-300 ${user?.tier === "CORE" ? "bg-surface ring-2 ring-primary/20 shadow-lg" : "bg-background border border-border/50 hover:shadow-md"}`}>
          <div className="mb-8">
            <h3 className="font-sans font-medium tracking-wide text-2xl mb-2">{t.upgrade.core.name}</h3>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-5xl font-light font-sans tracking-tight">{t.upgrade.core.price}</span>
            </div>
            <p className="text-foreground/50 text-sm mt-4 min-h-[40px] leading-relaxed">{t.upgrade.core.desc}</p>
          </div>
          <ul className="space-y-4 mb-8 flex-grow">
            {t.upgrade.core.features.map((feat: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground/70">
                <svg className="w-5 h-5 text-primary/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
                {feat}
              </li>
            ))}
          </ul>
          <button disabled className="w-full py-3 rounded-xl border border-border/60 text-foreground/40 font-medium cursor-not-allowed">
            {user?.tier === "CORE" ? t.upgrade.core.btn : "-"}
          </button>
        </div>

        {/* Pro Card */}
        <div className={`p-8 rounded-2xl flex flex-col relative transition-all duration-300 transform shadow-2xl ${user?.tier === "PRO" ? "bg-gradient-to-b from-surface to-background ring-2 ring-primary" : "bg-gradient-to-b from-primary/5 to-background border border-primary/20 hover:ring-1 hover:ring-primary/40"}`}>
          <div className="absolute top-0 inset-x-0 h-1.5 bg-primary rounded-t-2xl"></div>
          <div className="mb-8 mt-2">
            <h3 className="font-sans font-bold tracking-wide text-2xl mb-2 text-primary">{t.upgrade.pro.name}</h3>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-5xl font-light font-sans tracking-tight">{billingCycle === 'annual' ? t.upgrade.pro.priceA : t.upgrade.pro.priceM}</span>
              <span className="text-foreground/40 text-sm font-medium">/{billingCycle === 'annual' ? "yr" : "mo"}</span>
            </div>
            <p className="text-foreground/60 text-sm mt-4 min-h-[40px] leading-relaxed">{t.upgrade.pro.desc}</p>
          </div>
          <ul className="space-y-4 mb-8 flex-grow">
            {t.upgrade.pro.features.map((feat: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground/90 font-medium">
                <svg className="w-5 h-5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feat}
              </li>
            ))}
          </ul>
          {user?.tier === "PRO" ? (
             <button disabled className="w-full py-3 rounded-xl bg-surface border border-primary/50 text-primary font-semibold">
               Current Plan
             </button>
          ) : (
             <button onClick={() => handleSelectPlan("PRO")} className="w-full py-3 rounded-xl bg-primary text-background font-semibold hover:opacity-90 transition-opacity shadow-md hover:shadow-lg">
               {t.upgrade.pro.btn}
             </button>
          )}
        </div>

        {/* Elite Card */}
        <div className={`p-8 rounded-2xl flex flex-col transition-all duration-300 ${user?.tier === "ELITE" ? "bg-surface ring-2 ring-primary/40 shadow-xl" : "bg-background border border-border/50 hover:shadow-md hover:border-border"}`}>
          <div className="mb-8">
            <h3 className="font-sans font-medium tracking-wide text-2xl mb-2">{t.upgrade.elite.name}</h3>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-5xl font-light font-sans tracking-tight">{billingCycle === 'annual' ? t.upgrade.elite.priceA : t.upgrade.elite.priceM}</span>
              <span className="text-foreground/40 text-sm font-medium">/{billingCycle === 'annual' ? "yr" : "mo"}</span>
            </div>
            <p className="text-foreground/50 text-sm mt-4 min-h-[40px] leading-relaxed">{t.upgrade.elite.desc}</p>
          </div>
          <ul className="space-y-4 mb-8 flex-grow">
            {t.upgrade.elite.features.map((feat: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground/70">
                <svg className="w-5 h-5 text-primary/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
                {feat}
              </li>
            ))}
          </ul>
          {user?.tier === "ELITE" ? (
             <button disabled className="w-full py-3 rounded-xl bg-surface border border-primary/50 text-primary font-semibold">
               Current Plan
             </button>
          ) : (
             <button onClick={() => handleSelectPlan("ELITE")} className="w-full py-3 rounded-xl bg-foreground text-background font-semibold hover:bg-foreground/80 transition-opacity shadow-md">
               {t.upgrade.elite.btn}
             </button>
          )}
        </div>
      </div>

      {/* Checkout Modal Overlay */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="bg-background rounded-3xl border border-border/40 w-full max-w-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden ring-1 ring-black/5">
            
            {/* Left Summary Pane */}
            <div className="w-full md:w-2/5 bg-surface/50 p-8 md:p-10 border-r border-border/40 border-b md:border-b-0 flex flex-col justify-between">
               <div>
                 <h4 className="font-sans font-medium text-xl mb-6">{t.upgrade.checkout.title}</h4>
                 <p className="text-sm text-foreground/60 mb-1">{t.upgrade.checkout.desc}</p>
                 <h5 className="font-sans font-bold text-3xl text-primary">{currentPlanObj.name}</h5>
                 <p className="text-xs font-medium uppercase tracking-widest text-foreground/40 mt-2 mb-8">{billingCycle}</p>
               </div>
               
               <div className="pt-8 border-t border-border/40">
                 <p className="text-sm text-foreground/60 mb-2 font-medium">{t.upgrade.checkout.total}</p>
                 <p className="font-sans font-light tracking-tight text-4xl">{currentPrice}</p>
               </div>
            </div>

            {/* Right Payment Pane */}
            <div className="w-full md:w-3/5 p-8 md:p-10 relative bg-background">
               {!checkoutSuccess ? (
                 <>
                   {/* Method Toggle */}
                   <div className="flex gap-6 border-b border-border/40 mb-8 pb-5">
                     <label className={`cursor-pointer flex items-center gap-2 text-sm font-semibold transition-colors ${paymentMethod === 'cc' ? 'text-primary' : 'text-foreground/40 hover:text-foreground/80'}`}>
                       <input type="radio" name="method" value="cc" checked={paymentMethod === 'cc'} onChange={() => setPaymentMethod('cc')} className="hidden" />
                       Credit Card
                     </label>
                     <label className={`cursor-pointer flex items-center gap-2 text-sm font-semibold transition-colors ${paymentMethod === 'paypal' ? 'text-primary' : 'text-foreground/40 hover:text-foreground/80'}`}>
                       <input type="radio" name="method" value="paypal" checked={paymentMethod === 'paypal'} onChange={() => setPaymentMethod('paypal')} className="hidden" />
                       PayPal
                     </label>
                   </div>

                   <form onSubmit={processPayment} className="space-y-6">
                     {paymentMethod === 'cc' ? (
                       <div className="space-y-6 animate-in fade-in">
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-foreground/60">{t.upgrade.checkout.ccNum}</label>
                            <input type="text" placeholder="0000 0000 0000 0000" required className="w-full px-4 py-3 rounded-xl bg-surface/30 border border-border/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono text-base placeholder:text-foreground/20" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-foreground/60">{t.upgrade.checkout.expiry}</label>
                              <input type="text" placeholder="MM/YY" required className="w-full px-4 py-3 rounded-xl bg-surface/30 border border-border/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono text-base placeholder:text-foreground/20" />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-foreground/60">{t.upgrade.checkout.cvv}</label>
                              <input type="text" placeholder="123" required className="w-full px-4 py-3 rounded-xl bg-surface/30 border border-border/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono text-base placeholder:text-foreground/20" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-foreground/60">{t.upgrade.checkout.nameOnCard}</label>
                            <input type="text" placeholder="John Doe" required className="w-full px-4 py-3 rounded-xl bg-surface/30 border border-border/60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-sans text-base placeholder:text-foreground/20" />
                          </div>
                       </div>
                     ) : (
                       <div className="pt-8 pb-12 flex flex-col items-center justify-center text-center animate-in fade-in">
                         <svg className="w-16 h-16 text-[#00457C] mb-4 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
                         </svg>
                         <p className="text-foreground/60 text-sm font-medium leading-relaxed max-w-xs mx-auto">You will be redirected to PayPal to complete your secure payment. (Simulated)</p>
                       </div>
                     )}

                     <div className="pt-6 flex gap-3 mt-8">
                        <button type="button" disabled={isProcessing} onClick={() => setShowCheckout(false)} className="flex-1 py-3.5 rounded-xl border border-border/80 text-foreground/70 font-semibold hover:bg-surface transition-colors">
                          {t.upgrade.checkout.cancel}
                        </button>
                        <button type="submit" disabled={isProcessing} className="flex-[2] py-3.5 rounded-xl bg-primary text-background font-semibold hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 flex items-center justify-center">
                          {isProcessing ? (
                             <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                          ) : (paymentMethod === 'cc' ? t.upgrade.checkout.payWith : t.upgrade.checkout.paypal)}
                        </button>
                     </div>
                   </form>
                 </>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 py-12">
                   <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                     <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                     </svg>
                   </div>
                   <h3 className="font-sans font-bold text-2xl mb-3">{t.upgrade.checkout.success} <span className="text-primary">{currentPlanObj.name}</span></h3>
                   <p className="text-foreground/60 mb-10 font-medium">{t.upgrade.checkout.successDesc}</p>
                   <button onClick={() => router.push('/dashboard')} className="w-full py-3.5 rounded-xl bg-primary text-background font-semibold hover:opacity-90 transition-opacity shadow-md">
                     {t.upgrade.checkout.returnDash}
                   </button>
                 </div>
               )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
