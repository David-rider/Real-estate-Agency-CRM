"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { useToast } from "@/components/ui/Toast";
import { useExtra } from "@/lib/i18n/extra";
import { api } from "@/lib/api";
import DealDrawer from "@/components/deals/DealDrawer";
import ChecklistTemplateModal from "@/components/deals/ChecklistTemplateModal";
import NewDealModal from "@/components/deals/NewDealModal";
import { useAuth } from "@/lib/auth/AuthContext";

export default function TransactionsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const X = useExtra();
  const { user } = useAuth();
  const canEditTemplate = ["SUPERADMIN", "FIRMADMIN", "MANAGER"].includes(user?.role ?? "");
  const [templateOpen, setTemplateOpen] = React.useState(false);

  const respondToOffer = async (offer: any, status: string) => {
    let counterAmount: number | undefined;
    if (status === "COUNTER") {
      const v = window.prompt(X.offers.counterPrompt, String(offer.amount));
      if (!v) return;
      counterAmount = Number(String(v).replace(/[$,\s]/g, ""));
      if (!Number.isFinite(counterAmount) || counterAmount <= 0) return;
    }
    try {
      const res = await api(`/api/offers/${offer.id}`, { method: "PATCH", body: { status, counterAmount } });
      toast.success(res.transaction ? X.offers.dealOpened : X.offers.updated);
      fetchOffers();
      fetchTransactions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : X.common.error);
    }
  };

  const [transactions, setTransactions] = React.useState<any[]>([]);
  const [offers, setOffers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [openDealId, setOpenDealId] = React.useState<string | null>(null);
  const [isAddOfferModalOpen, setIsAddOfferModalOpen] = React.useState(false);
  const [offerFormData, setOfferFormData] = React.useState({
    propertyId: "",
    clientId: "",
    amount: "",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"PIPELINE" | "OFFERS">(
    "PIPELINE",
  );

  // Fetch lists for select dropdowns
  const [properties, setProperties] = React.useState<any[]>([]);
  const [clients, setClients] = React.useState<any[]>([]);

  const fetchTransactions = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/transactions?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setTransactions(Array.isArray(data) ? data : data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchOffers = () => {
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/offers`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setOffers(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Error fetching offers:", err));
  };

  React.useEffect(() => {
    fetchTransactions();
    fetchOffers();

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/properties?limit=100`, { headers })
      .then((res) => res.json())
      .then((data) => setProperties(data.data || []));
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/clients?limit=100`, { headers })
      .then((res) => res.json())
      .then((data) => setClients(data.data || []));
  }, []);

  const handleOfferChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    setOfferFormData({ ...offerFormData, [e.target.name]: e.target.value });
  };

  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/offers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(offerFormData),
      });
      if (!res.ok) throw new Error("Failed to add offer");
      fetchOffers();
      setIsAddOfferModalOpen(false);
      setOfferFormData({ propertyId: "", clientId: "", amount: "" });
    } catch (error) {
      console.error(error);
      toast.error(X.common.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDealsByStatus = (status: string) => {
    return transactions
      .filter((t) => {
        const matchesStatus = t.status === status;
        const clientName =
          `${t.client.firstName} ${t.client.lastName}`.toLowerCase();
        const propAddr = t.property.address.toLowerCase();
        const matchQuery =
          clientName.includes(searchQuery.toLowerCase()) ||
          propAddr.includes(searchQuery.toLowerCase());
        return matchesStatus && matchQuery;
      })
      .map((t) => ({
        id: t.id.substring(0, 6).toUpperCase(),
        client: `${t.client.firstName} ${t.client.lastName}`,
        property: t.property.address,
        price: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        }).format(t.price),
        days: Math.floor(
          (new Date().getTime() - new Date(t.updatedAt).getTime()) /
            (1000 * 3600 * 24),
        ),
        raw: t
      }));
  };


  const columns = [
    {
      title: t.transactions.offersReview,
      color: "bg-surface",
      textMarker: "bg-foreground/20",
      deals: getDealsByStatus("OFFER_REVIEW"),
    },
    {
      title: t.transactions.inContract,
      color: "bg-surface",
      textMarker: "bg-foreground/50",
      deals: getDealsByStatus("IN_CONTRACT"),
    },
    {
      title: t.transactions.boardPackage,
      color: "bg-surface",
      textMarker: "bg-foreground/80",
      deals: getDealsByStatus("BOARD_PACKAGE"),
    },
    {
      title: t.transactions.clearedToClose,
      color: "bg-surface border-primary/20",
      textMarker: "bg-primary text-background",
      deals: getDealsByStatus("CLEARED_TO_CLOSE"),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out text-foreground h-full flex flex-col pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t.transactions.title}
          </h1>
          <p className="text-foreground/50 mt-1 text-sm">
            {t.transactions.subtitle}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0">
          {canEditTemplate && (
            <button
              onClick={() => setTemplateOpen(true)}
              className="px-6 py-3 bg-transparent border border-border hover:border-foreground text-foreground transition-colors duration-500 rounded-none text-base uppercase tracking-widest font-medium"
            >
              {X.deals.template.button}
            </button>
          )}
          <button
            onClick={() => setIsAddOfferModalOpen(true)}
            className="px-6 py-3 bg-transparent border border-border hover:border-foreground text-foreground transition-colors duration-500 rounded-none text-base uppercase tracking-widest font-medium text-center"
          >
            {t.transactions.offers.addOffer}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-primary text-background hover:bg-primary-hover transition-colors duration-500 rounded-none text-base uppercase tracking-widest font-medium text-center"
          >
            {t.transactions.addDeal}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 flex-shrink-0">
        <div className="flex border-b border-border w-full md:w-auto">
          <button
            onClick={() => setActiveTab("PIPELINE")}
            className={`pb-3 px-6 text-base uppercase tracking-widest font-sans transition-colors relative ${activeTab === "PIPELINE" ? "text-primary" : "text-foreground/50 hover:text-foreground"}`}
          >
            {t.transactions.offers.activePipeline}
            {activeTab === "PIPELINE" && (
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-primary"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("OFFERS")}
            className={`pb-3 px-6 text-base uppercase tracking-widest font-sans transition-colors relative ${activeTab === "OFFERS" ? "text-primary" : "text-foreground/50 hover:text-foreground"}`}
          >
            {t.transactions.offers.tabOffers}
            {activeTab === "OFFERS" && (
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-primary"></span>
            )}
          </button>
        </div>
        <input
          type="text"
          placeholder={t.transactions.offers.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:max-w-xs px-4 py-3 bg-surface border border-border rounded-none text-base text-foreground focus:border-primary outline-none transition-colors placeholder:text-foreground/30 font-sans tracking-wide"
        />
      </div>

      {/* Boards */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar border border-border bg-background p-4 md:p-8">
        {loading ? (
          <div className="h-full flex items-center justify-center text-foreground/40 font-sans text-sm uppercase tracking-widest">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              {t.transactions.offers.loading}
            </div>
          </div>
        ) : activeTab === "PIPELINE" ? (
          <div className="flex gap-8 min-w-max h-full items-start">
            {columns.map((col, idx) => (
              <div
                key={col.title}
                className={`w-80 flex flex-col h-full ${idx !== columns.length - 1 ? "pr-8 border-r border-border/50" : ""}`}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
                  <h3 className="font-sans text-sm uppercase tracking-widest text-foreground flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-bold ${col.textMarker}`}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    {col.title}
                  </h3>
                  <span className="text-sm font-serif text-foreground/50">
                    {col.deals.length}
                  </span>
                </div>

                {/* Column Body */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar pb-6">
                  {col.deals.map((deal) => (
                    <div
                      key={deal.id}
                      onClick={() => setOpenDealId(deal.raw.id)}
                      className="bg-surface p-6 border border-border hover:border-primary/50 transition-colors duration-300 cursor-pointer group flex flex-col gap-4 relative"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-sans uppercase tracking-widest text-primary border border-primary/20 px-2 py-1 bg-primary/5">
                          {deal.id}
                        </span>
                        <span className="text-xs uppercase tracking-widest text-foreground/40 font-light">
                          {deal.days} {t.transactions.offers.days}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-serif text-xl text-foreground group-hover:text-primary transition-colors leading-tight mb-2">
                          {deal.property}
                        </h4>
                        <p className="text-foreground/60 text-sm font-sans uppercase tracking-widest">
                          {deal.client}
                        </p>
                      </div>
                      <div className="pt-4 mt-2 border-t border-border flex justify-between items-end">
                        <span className="font-serif text-2xl font-light text-foreground">
                          {deal.price}
                        </span>
                        <div className="flex -space-x-3 group-hover:opacity-100 opacity-60 transition-opacity">
                          <div className="w-7 h-7 rounded-none border border-border bg-background flex items-center justify-center text-[9px] font-serif text-foreground/60">
                            C
                          </div>
                          <div className="w-7 h-7 rounded-none border border-primary/30 bg-primary/10 flex items-center justify-center text-[9px] font-serif text-primary">
                            A
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {col.deals.length === 0 && (
                    <div className="h-24 border border-dashed border-border flex items-center justify-center text-xs font-sans text-foreground/30 uppercase tracking-widest">
                      {t.transactions.offers.emptyStage}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full overflow-y-auto custom-scrollbar">
            <table className="w-full text-left font-sans border-collapse">
              <thead className="sticky top-0 bg-background z-10 before:absolute before:inset-x-0 before:bottom-0 before:border-b before:border-border">
                <tr>
                  <th className="py-4 px-6 text-sm uppercase tracking-widest text-foreground/50 font-medium">
                    {t.transactions.offers.table.property}
                  </th>
                  <th className="py-4 px-6 text-sm uppercase tracking-widest text-foreground/50 font-medium">
                    {t.transactions.offers.table.client}
                  </th>
                  <th className="py-4 px-6 text-sm uppercase tracking-widest text-foreground/50 font-medium text-right">
                    {t.transactions.offers.table.amount}
                  </th>
                  <th className="py-4 px-6 text-sm uppercase tracking-widest text-foreground/50 font-medium text-center">
                    {t.transactions.offers.table.status}
                  </th>
                  <th className="py-4 px-6 text-sm uppercase tracking-widest text-foreground/50 font-medium text-right">
                    {t.transactions.offers.table.date}
                  </th>
                  <th className="py-4 px-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {offers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-16 text-center text-sm uppercase tracking-widest text-foreground/40"
                    >
                      {t.transactions.offers.table.noOffers}
                    </td>
                  </tr>
                ) : (
                  offers.map((offer) => (
                    <tr
                      key={offer.id}
                      className="hover:bg-surface/50 transition-colors group cursor-pointer"
                    >
                      <td className="py-5 px-6 font-serif text-lg">
                        {offer.property?.address}
                      </td>
                      <td className="py-5 px-6 font-sans text-base">
                        {offer.client?.firstName} {offer.client?.lastName}
                      </td>
                      <td className="py-5 px-6 font-serif text-xl text-right group-hover:text-primary transition-colors">
                        ${offer.amount.toLocaleString()}
                      </td>
                      <td className="py-5 px-6 text-center">
                        <span
                          className={`inline-block px-3 py-1 text-xs uppercase tracking-widest border font-medium ${
                            offer.status === "ACCEPTED"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : offer.status === "REJECTED"
                                ? "bg-red-500/10 text-red-500 border-red-500/20"
                                : offer.status === "COUNTER"
                                  ? "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                  : "bg-foreground/5 text-foreground/70 border-foreground/10"
                          }`}
                        >
                          {(X.offers.status as any)[offer.status] || offer.status}
                        </span>
                        {offer.status === "COUNTER" && offer.counterAmount && (
                          <div className="text-xs text-foreground/50 mt-1">${offer.counterAmount.toLocaleString()}</div>
                        )}
                      </td>
                      <td className="py-5 px-6 font-sans text-base text-foreground/60 text-right">
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-5 px-6 text-right whitespace-nowrap">
                        {(offer.status === "PENDING" || offer.status === "COUNTER") && (
                          <div className="flex gap-3 justify-end text-sm">
                            <button onClick={() => respondToOffer(offer, "ACCEPTED")} className="text-primary hover:underline">{X.offers.accept}</button>
                            <button onClick={() => respondToOffer(offer, "COUNTER")} className="text-orange-500 hover:underline">{X.offers.counter}</button>
                            <button onClick={() => respondToOffer(offer, "REJECTED")} className="text-red-500 hover:underline">{X.offers.reject}</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Deal Modal Overlay */}
      <NewDealModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onCreated={fetchTransactions} />

      {/* Add Offer Modal Overlay */}
      {isAddOfferModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm animate-in fade-in duration-500 p-4">
          <div className="bg-background border border-border shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] rounded-none">
            <div className="p-8 border-b border-border flex justify-between items-center bg-surface">
              <h2 className="font-serif text-3xl font-light text-foreground">
                {t.transactions.offers.modal.title}
              </h2>
              <button
                onClick={() => setIsAddOfferModalOpen(false)}
                className="text-foreground/50 hover:text-primary text-3xl font-light transition-colors leading-none"
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={handleAddOffer}
              className="p-8 overflow-y-auto space-y-6"
            >
              <div>
                <label className="block font-sans text-sm uppercase tracking-widest text-foreground/50 mb-2">
                  {t.transactions.offers.modal.targetProperty}
                </label>
                <select
                  required
                  name="propertyId"
                  value={offerFormData.propertyId}
                  onChange={handleOfferChange}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-none text-base text-foreground focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    {t.transactions.offers.modal.selectProperty}
                  </option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.address}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-sans text-sm uppercase tracking-widest text-foreground/50 mb-2">
                  {t.transactions.offers.modal.interestedClient}
                </label>
                <select
                  required
                  name="clientId"
                  value={offerFormData.clientId}
                  onChange={handleOfferChange}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-none text-base text-foreground focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    {t.transactions.offers.modal.selectClient}
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({(X.ui.clientTypes as Record<string, string>)[c.type] ?? c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-sans text-sm uppercase tracking-widest text-foreground/50 mb-2">
                  {t.transactions.offers.modal.offerAmount}
                </label>
                <input
                  required
                  name="amount"
                  value={offerFormData.amount}
                  onChange={handleOfferChange}
                  type="number"
                  min="0"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-none text-base text-foreground focus:border-primary outline-none transition-colors font-serif placeholder:font-sans placeholder:text-foreground/20"
                  placeholder="e.g 950000"
                />
              </div>

              <div className="pt-6 flex justify-end gap-4 mt-8 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddOfferModalOpen(false)}
                  className="px-6 py-3 bg-transparent border border-border text-foreground/70 rounded-none text-base uppercase tracking-widest font-medium hover:text-foreground hover:border-foreground transition-colors"
                >
                  {t.transactions.offers.modal.cancel}
                </button>
                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="px-6 py-3 bg-primary text-background rounded-none text-base uppercase tracking-widest font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? t.transactions.offers.modal.saving
                    : t.transactions.offers.modal.recordOffer}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {openDealId && <DealDrawer dealId={openDealId} onClose={() => setOpenDealId(null)} onSaved={fetchTransactions} />}
      {templateOpen && <ChecklistTemplateModal onClose={() => setTemplateOpen(false)} />}
    </div>
  );
}
