"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/I18nContext";

export default function DocumentsPage() {
  const { t } = useI18n();

  const [documents, setDocuments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [previewDoc, setPreviewDoc] = React.useState<any>(null);

  // Filter
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterType, setFilterType] = React.useState("ALL");

  // Form data
  const [formData, setFormData] = React.useState({
    name: "",
    url: "",
    type: "CONTRACT",
    transactionId: "",
  });

  // Reference data
  const [transactions, setTransactions] = React.useState<any[]>([]);

  const fetchDocuments = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setDocuments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  React.useEffect(() => {
    fetchDocuments();

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/transactions`, { headers })
      .then((res) => res.json())
      .then((data) =>
        setTransactions(Array.isArray(data) ? data : data.data || []),
      );
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({ name: "", url: "", type: "CONTRACT", transactionId: "" });
        fetchDocuments();
      } else {
        alert("Failed to upload document");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesType = filterType === "ALL" || doc.type === filterType;
    const searchTarget =
      `${doc.name} ${doc.transaction?.property?.address || ""}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out text-foreground">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-8">
        <div className="max-w-xl">
          <h1 className="font-serif text-5xl font-light tracking-tight text-foreground">
            {t.documents.title}
          </h1>
          <p className="font-sans text-foreground/60 mt-4 text-base font-light leading-relaxed">
            {t.documents.subtitle}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-3 bg-primary text-background hover:bg-primary-hover transition-colors duration-500 rounded-none text-sm uppercase tracking-widest font-medium w-full md:w-auto text-center"
        >
          {t.documents.uploadDoc}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-surface border border-border p-6">
        <input
          type="text"
          placeholder={t.documents.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 max-w-md px-4 py-3 bg-background border border-border rounded-none font-sans text-sm text-foreground focus:border-primary outline-none transition-colors placeholder:text-foreground/30"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-3 bg-background border border-border rounded-none font-sans text-sm text-foreground text-opacity-80 outline-none cursor-pointer focus:border-primary transition-colors appearance-none md:w-48"
        >
          <option value="ALL">{t.documents.filters.allTypes}</option>
          <option value="CONTRACT">{t.documents.modal.typeContract}</option>
          <option value="DISCLOSURE">{t.documents.modal.typeDisclosure}</option>
          <option value="BOARD_PACKAGE">{t.documents.modal.typeBoard}</option>
          <option value="OTHER">{t.documents.modal.typeOther}</option>
        </select>
      </div>

      {/* Document Table */}
      <div className="bg-background border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-border text-xs uppercase tracking-widest text-foreground/40 font-sans">
                <th className="p-6 font-medium whitespace-nowrap">
                  {t.documents.table.name}
                </th>
                <th className="p-6 font-medium whitespace-nowrap">
                  {t.documents.table.type}
                </th>
                <th className="p-6 font-medium whitespace-nowrap">
                  {t.documents.table.transaction}
                </th>
                <th className="p-6 font-medium whitespace-nowrap">
                  {t.documents.table.date}
                </th>
                <th className="p-6 font-medium whitespace-nowrap text-right">
                  {t.documents.table.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-foreground/40 font-sans text-xs uppercase tracking-widest"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-foreground/40 font-sans text-xs uppercase tracking-widest bg-surface/30"
                  >
                    {t.documents.empty}
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-surface/50 transition-colors group"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-surface border border-border flex items-center justify-center text-primary group-hover:border-primary/30 transition-colors">
                          📄
                        </div>
                        <span className="font-serif text-lg text-foreground group-hover:text-primary transition-colors">
                          {doc.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="px-2 py-1 text-[10px] uppercase tracking-widest font-sans border border-border bg-surface text-foreground/70 group-hover:border-primary/20 group-hover:text-primary transition-colors">
                        {doc.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-6">
                      {doc.transaction ? (
                        <span className="font-sans text-sm text-foreground/70">
                          {doc.transaction.clientId?.substring(
                            0,
                            8,
                          ) /* Mock Deal Name */}{" "}
                          Deal
                        </span>
                      ) : (
                        <span className="text-foreground/30 text-xs italic">
                          {t.documents.unlinked}
                        </span>
                      )}
                    </td>
                    <td className="p-6 font-sans text-sm text-foreground/60">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex gap-4 justify-end">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="text-xs font-sans uppercase tracking-widest text-primary hover:text-primary-hover transition-colors"
                        >
                          {t.documents.table.view}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-background border border-border shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] rounded-none">
            <div className="p-8 border-b border-border flex justify-between items-center bg-surface">
              <h2 className="font-serif text-3xl font-light text-foreground">
                {t.documents.modal.title}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-foreground/50 hover:text-primary text-3xl font-light transition-colors leading-none"
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={handleUpload}
              className="p-8 overflow-y-auto space-y-8"
            >
              <div>
                <label className="block font-sans text-xs uppercase tracking-widest text-foreground/50 mb-2">
                  {t.documents.modal.name}
                </label>
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  type="text"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-none text-sm text-foreground focus:border-primary outline-none transition-colors placeholder:text-foreground/20"
                  placeholder="e.g. Signed Offer Sheet.pdf"
                />
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-widest text-foreground/50 mb-2">
                  {t.documents.modal.url}
                </label>
                <input
                  required
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  type="url"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-none text-sm text-foreground focus:border-primary outline-none transition-colors font-sans placeholder:text-foreground/20"
                  placeholder="https://storage.example.com/file.pdf"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest text-foreground/50 mb-2">
                    {t.documents.modal.type}
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-none text-sm text-foreground focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="CONTRACT">
                      {t.documents.modal.typeContract}
                    </option>
                    <option value="DISCLOSURE">
                      {t.documents.modal.typeDisclosure}
                    </option>
                    <option value="BOARD_PACKAGE">
                      {t.documents.modal.typeBoard}
                    </option>
                    <option value="OTHER">{t.documents.modal.typeOther}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest text-foreground/50 mb-2">
                    {t.documents.modal.selectTransaction}
                  </label>
                  <select
                    required
                    name="transactionId"
                    value={formData.transactionId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-none text-sm text-foreground focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      -- Select a Deal --
                    </option>
                    {transactions.map((tpt) => (
                      <option key={tpt.id} value={tpt.id}>
                        Deal ID: {tpt.id.substring(0, 8)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-4 mt-8 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-3 bg-transparent border border-border text-foreground/70 rounded-none text-sm uppercase tracking-widest font-medium hover:text-foreground hover:border-foreground transition-colors"
                >
                  {t.documents.modal.cancel}
                </button>
                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="px-6 py-3 bg-primary text-background rounded-none text-sm uppercase tracking-widest font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? t.documents.modal.saving
                    : t.documents.modal.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/95 backdrop-blur-md animate-in fade-in duration-500 p-4 sm:p-8">
          <div className="bg-background border border-border shadow-2xl w-full h-full max-w-7xl flex flex-col rounded-none relative">
            {/* Header */}
            <div className="p-6 border-b border-border flex justify-between items-center bg-surface shrink-0">
              <div>
                <h2 className="font-serif text-2xl font-light text-foreground">
                  {previewDoc.name}
                </h2>
                <p className="font-sans text-xs uppercase tracking-widest text-foreground/50 mt-1">
                  {t.documents.preview?.title || "Document Preview"}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden sm:inline-block text-xs uppercase tracking-widest text-primary hover:text-primary-hover transition-colors"
                >
                  {t.documents.preview?.download || "Download Original"}
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-foreground/50 hover:text-primary text-3xl font-light transition-colors leading-none"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Document Viewer Frame */}
            <div className="flex-1 bg-surface/20 p-4 sm:p-8 overflow-hidden flex items-center justify-center relative">
              {/* Simulated Loading/Scanning Effect */}
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden mix-blend-overlay opacity-30">
                <div className="w-full h-full bg-[linear-gradient(transparent_0%,rgba(197,160,89,0.1)_50%,transparent_100%)] bg-[length:100%_4px] animate-[scan_3s_ease-in-out_infinite]" />
              </div>

              {previewDoc.url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="max-w-full max-h-full object-contain shadow-2xl border border-border"
                />
              ) : (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-full bg-white shadow-2xl border border-border"
                  title={previewDoc.name}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
