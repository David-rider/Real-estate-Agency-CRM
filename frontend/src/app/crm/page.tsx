"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import Link from "next/link";

export default function CRMPage() {
  const { t } = useI18n();

  const [clients, setClients] = React.useState<any[]>([]);
  const [totalClients, setTotalClients] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    type: "BUYER",
    budget: "",
    status: "LEAD",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterType, setFilterType] = React.useState("ALL");
  const [filterStatus, setFilterStatus] = React.useState("ALL");

  const fetchClients = (page = 1) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/clients?page=${page}&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          alert(
            t.crm?.table?.sessionExpired ||
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
        setClients(data.data || []);
        setTotalClients(data.total || 0);
        setCurrentPage(data.page || 1);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  React.useEffect(() => {
    fetchClients(1);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      `${client.firstName} ${client.lastName} ${client.email} ${client.phone}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesType = filterType === "ALL" || client.type === filterType;
    const matchesStatus =
      filterStatus === "ALL" || client.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          type: "BUYER",
          budget: "",
          status: "LEAD",
        });
        fetchClients();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to add client: ${errData.error || res.statusText}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out text-foreground">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t.crm.title}
          </h1>
          <p className="text-foreground/50 mt-1 text-sm">
            {t.crm.subtitle}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-primary text-background hover:opacity-90 transition-opacity rounded-lg text-sm font-semibold shadow-sm w-full md:w-auto text-center"
        >
          {t.crm.addClient}
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl flex flex-col overflow-hidden">
        {/* CRM Toolbar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3 bg-background/50">
          <input
            type="text"
            placeholder={t.crm.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none transition-all placeholder:text-foreground/30"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 bg-background border border-border/60 rounded-xl font-sans text-base text-foreground/80 outline-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm appearance-none md:w-48"
          >
            <option value="ALL">{t.crm.filters.allTypes}</option>
            <option value="BUYER">{t.crm.modal.typeBuyer}</option>
            <option value="SELLER">{t.crm.modal.typeSeller}</option>
            <option value="REFERRAL">{t.crm.modal.typeReferral}</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-background border border-border/60 rounded-xl font-sans text-base text-foreground/80 outline-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm appearance-none md:w-48"
          >
            <option value="ALL">{t.crm.filters.allStatuses}</option>
            <option value="ACTIVE">{t.crm.modal.statusActive}</option>
            <option value="LEAD">{t.crm.modal.statusLead}</option>
            <option value="IN_CONTRACT">{t.crm.modal.statusInContract}</option>
            <option value="CLOSED">{t.crm.modal.statusClosed}</option>
          </select>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto bg-background">
          <table className="w-full text-left text-base font-sans">
            <thead className="bg-surface/30 border-b border-border/40 text-foreground/60 text-sm font-semibold">
              <tr>
                <th className="px-6 py-4 font-semibold">
                  {t.crm.table.clientName}
                </th>
                <th className="px-6 py-4 font-semibold">{t.crm.table.type}</th>
                <th className="px-6 py-4 font-semibold">{t.crm.table.contact}</th>
                <th className="px-6 py-4 font-semibold">
                  {t.crm.table.searchBudget}
                </th>
                <th className="px-6 py-4 font-semibold">{t.crm.table.status}</th>
                <th className="px-6 py-4 font-semibold text-right">
                  {t.crm.table.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-foreground/50 tracking-widest text-xs font-medium"
                  >
                    {t.crm.table.loading}
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-foreground/50 tracking-widest text-xs font-medium"
                  >
                    {t.crm.table.noClients}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-surface/40 transition-colors duration-200 group"
                  >
                    <td className="px-6 py-4 font-medium text-foreground flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full border border-border/60 bg-surface flex items-center justify-center text-primary text-sm font-semibold tracking-wide">
                        {client.firstName.charAt(0)}
                        {client.lastName.charAt(0)}
                      </div>
                      <span className="tracking-wide text-foreground">
                        {client.firstName} {client.lastName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold px-2.5 py-1 rounded-md bg-surface border border-border/40 text-foreground/70">
                        {client.type === "BUYER"
                          ? t.crm.modal.typeBuyer
                          : client.type === "SELLER"
                            ? t.crm.modal.typeSeller
                            : t.crm.modal.typeReferral}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground/60 tracking-wide font-medium">
                      {client.phone || "-"}
                    </td>
                    <td className="px-6 py-4 text-foreground/80 font-medium tracking-wide">
                      {client.budget || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-semibold flex items-center gap-2
                                                ${client.status === "ACTIVE" ? "text-primary" : ""}
                                                ${client.status === "IN_CONTRACT" ? "text-foreground/90" : ""}
                                                ${client.status === "LEAD" ? "text-foreground/50" : ""}
                                                ${client.status === "CLOSED" ? "text-foreground/30" : ""}
                                            `}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full 
                                                    ${client.status === "ACTIVE" ? "bg-primary" : "bg-border"}
                                                    ${client.status === "IN_CONTRACT" ? "bg-foreground" : ""}
                                                `}
                        />
                        {client.status === "IN_CONTRACT"
                          ? t.crm.modal.statusInContract
                          : client.status === "ACTIVE"
                            ? t.crm.modal.statusActive
                            : client.status === "LEAD"
                              ? t.crm.modal.statusLead
                              : t.crm.modal.statusClosed}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/crm/${client.id}`}
                        className="text-primary hover:text-primary-hover font-sans text-base font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        {t.crm.table.viewProfile} &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between text-sm tracking-widest uppercase text-foreground/50 bg-surface/30">
          <span>
            {t.crm.pagination.showing}{" "}
            <span className="text-foreground font-serif">
              {filteredClients.length}
            </span>{" "}
            {t.crm.pagination.of}{" "}
            <span className="text-foreground font-serif">{totalClients}</span>{" "}
            {t.crm.pagination.clients}
          </span>
          <div className="flex gap-4">
            <button
              disabled={currentPage === 1 || loading}
              onClick={() => fetchClients(currentPage - 1)}
              className="hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-foreground/50"
            >
              &larr; {t.crm.pagination.previous}
            </button>
            <button
              disabled={currentPage * 10 >= totalClients || loading}
              onClick={() => fetchClients(currentPage + 1)}
              className="hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-foreground/50"
            >
              {t.crm.pagination.next} &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Add Client Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-background ring-1 ring-border/50 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] rounded-3xl">
            <div className="p-8 border-b border-border/40 flex justify-between items-center bg-surface/30">
              <h2 className="font-sans text-2xl font-semibold text-foreground">
                {t.crm.modal.title}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-foreground/40 hover:text-foreground text-3xl font-light transition-colors leading-none"
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={handleAddClient}
              className="p-8 overflow-y-auto space-y-6"
            >
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                    {t.crm.modal.firstName}
                  </label>
                  <input
                    required
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-foreground/30 shadow-sm"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                    {t.crm.modal.lastName}
                  </label>
                  <input
                    required
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-foreground/30 shadow-sm"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                  {t.crm.modal.email}
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-foreground/30 shadow-sm"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                  {t.crm.modal.phone}
                </label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  type="tel"
                  className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-foreground/30 shadow-sm"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                    {t.crm.modal.type}
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="BUYER">{t.crm.modal.typeBuyer}</option>
                    <option value="SELLER">{t.crm.modal.typeSeller}</option>
                    <option value="REFERRAL">{t.crm.modal.typeReferral}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                    {t.crm.modal.status}
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="LEAD">{t.crm.modal.statusLead}</option>
                    <option value="ACTIVE">{t.crm.modal.statusActive}</option>
                    <option value="IN_CONTRACT">
                      {t.crm.modal.statusInContract || "In-Contract"}
                    </option>
                    <option value="CLOSED">{t.crm.modal.statusClosed}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                  {t.crm.modal.budget}
                </label>
                <input
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  type="text"
                  className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-foreground/30 shadow-sm"
                  placeholder="e.g. $1.2M - $1.5M"
                />
              </div>

              <div className="pt-6 flex justify-end gap-3 mt-8 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 bg-surface border border-border/60 text-foreground/70 rounded-xl text-base font-semibold hover:text-foreground transition-colors shadow-sm"
                >
                  {t.crm.modal.cancel}
                </button>
                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-background rounded-xl text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
                >
                  {isSubmitting ? t.crm.modal.saving : t.crm.modal.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
