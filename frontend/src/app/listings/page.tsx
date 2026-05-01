"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/I18nContext";

export default function ListingsPage() {
  const { t } = useI18n();

  const [properties, setProperties] = React.useState<any[]>([]);
  const [totalProperties, setTotalProperties] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    address: "",
    city: "New York",
    state: "NY",
    zip: "",
    price: "",
    beds: "",
    baths: "",
    sqft: "",
    status: "COMING_SOON",
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [zillowId, setZillowId] = React.useState("");
  const [isZillowLoading, setIsZillowLoading] = React.useState(false);

  // Media Modal State
  const [isMediaModalOpen, setIsMediaModalOpen] = React.useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = React.useState<
    string | null
  >(null);
  const [mediaAssets, setMediaAssets] = React.useState<any[]>([]);
  const [isMediaSubmitting, setIsMediaSubmitting] = React.useState(false);
  const [mediaFormData, setMediaFormData] = React.useState({
    url: "",
    type: "IMAGE",
  });

  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("ALL");

  const fetchProperties = (page = 1) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/properties?page=${page}&limit=12`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setProperties(data.data || []);
        setTotalProperties(data.total || 0);
        setCurrentPage(data.page || 1);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  React.useEffect(() => {
    fetchProperties(1);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMediaChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setMediaFormData({ ...mediaFormData, [e.target.name]: e.target.value });
  };

  const openMediaModal = async (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setIsMediaModalOpen(true);
    setMediaAssets([]); // clear until loaded

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/media?propertyId=${propertyId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setMediaAssets(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch media assets", error);
    }
  };

  const closeMediaModal = () => {
    setIsMediaModalOpen(false);
    setSelectedPropertyId(null);
    setMediaFormData({ url: "", type: "IMAGE" });
  };

  const filteredProperties = properties.filter((prop) => {
    const matchesSearch = `${prop.address} ${prop.city} ${prop.zip}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "ALL" || prop.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/properties`, {
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
          address: "",
          city: "New York",
          state: "NY",
          zip: "",
          price: "",
          beds: "",
          baths: "",
          sqft: "",
          status: "COMING_SOON",
        });
        fetchProperties();
      } else if (res.status === 401 || res.status === 403) {
        alert(
          t.listings?.modal?.sessionExpired ||
            "Your session has expired. Please log out and log back in.",
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to add listing: ${errData.error || res.statusText}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleZillowAutofill = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!zillowId) return alert("Please enter a Zillow Property ID (zpid).");
    
    setIsZillowLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/integrations/zillow/fetch?zpid=${zillowId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const { data } = await res.json();
        const addressParts = data.address.split(", ");
        
        setFormData(prev => ({
          ...prev,
          address: addressParts[0] || "",
          city: addressParts[1] || "",
          state: addressParts[2]?.split(" ")[0] || "",
          zip: addressParts[2]?.split(" ")[1] || "",
          price: data.price ? String(data.price) : prev.price,
          beds: data.beds ? String(data.beds) : prev.beds,
          baths: data.baths ? String(data.baths) : prev.baths,
          sqft: data.sqft ? String(data.sqft) : prev.sqft
        }));
        // alert(`Autofilled data from Zillow for property ID: ${zillowId}`);
      } else {
        alert("Failed to fetch property details from Zillow.");
      }
    } catch (error) {
      console.error(error);
      alert("Network error fetching Zillow data.");
    } finally {
      setIsZillowLoading(false);
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId) return;
    setIsMediaSubmitting(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/media`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...mediaFormData,
          propertyId: selectedPropertyId,
        }),
      });

      if (!res.ok) throw new Error("Failed to add media");

      openMediaModal(selectedPropertyId);
      setMediaFormData({ url: "", type: "IMAGE" });
    } catch (error) {
      console.error(error);
      alert("Failed to add media asset");
    } finally {
      setIsMediaSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out text-foreground">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t.listings.title}
          </h1>
          <p className="text-foreground/50 mt-1 text-sm">
            {t.listings.subtitle}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-2.5 bg-primary text-background hover:opacity-90 transition-opacity duration-300 rounded-xl text-base font-semibold shadow-md w-full md:w-auto text-center"
        >
          {t.listings.addListing}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center bg-background/50 ring-1 ring-border/50 rounded-2xl p-5 shadow-sm">
        <input
          type="text"
          placeholder={t.listings.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 max-w-md px-4 py-2.5 bg-background border border-border/60 rounded-xl font-sans text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm placeholder:text-foreground/40"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-background border border-border/60 rounded-xl font-sans text-base text-foreground/80 outline-none cursor-pointer focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm appearance-none md:w-48"
        >
          <option value="ALL">{t.listings.filters.allStatuses}</option>
          <option value="ACTIVE">{t.listings.modal.statusActive}</option>
          <option value="COMING_SOON">
            {t.listings.modal.statusComingSoon}
          </option>
          <option value="IN_CONTRACT">
            {t.listings.modal.statusInContract}
          </option>
          <option value="SOLD">{t.listings.modal.statusSold}</option>
        </select>
        <div className="flex gap-2 bg-background ring-1 ring-border/40 rounded-xl p-1 md:ml-auto w-full md:w-auto shadow-sm">
          <button className="flex-1 md:flex-none px-6 py-2 bg-surface rounded-lg text-foreground text-sm font-semibold shadow-sm ring-1 ring-border/50">
            {t.listings.viewOptions.grid}
          </button>
          <button className="flex-1 md:flex-none px-6 py-2 text-foreground/50 hover:text-foreground text-sm font-medium transition-colors">
            {t.listings.viewOptions.list}
          </button>
        </div>
      </div>

      {/* Property Grid */}
      {loading ? (
        <div className="py-24 border border-border bg-surface/30 text-center text-foreground/50 tracking-widest uppercase text-sm">
          {t.listings.table.loading}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="py-24 border border-border bg-surface/30 text-center text-foreground/50 tracking-widest uppercase text-sm">
          {t.listings.table.noProperties}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredProperties.map((prop) => (
            <div
              key={prop.id}
              className="bg-background ring-1 ring-border/50 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 group flex flex-col"
            >
              <div className="h-64 relative overflow-hidden bg-surface flex items-center justify-center">
                {prop.image ? (
                  <img
                    src={prop.image}
                    alt={prop.address}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <span className="text-3xl text-foreground/20 font-sans font-bold">
                    No Image
                  </span>
                )}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
                <div className="absolute top-4 left-4">
                  <span
                    className={`px-3 py-1 text-sm font-sans font-semibold rounded-md backdrop-blur-md shadow-sm border border-white/20 text-white
                                        ${prop.status === "ACTIVE" ? "bg-primary/90" : ""}
                                        ${prop.status === "IN_CONTRACT" ? "bg-black/60" : ""}
                                        ${prop.status === "SOLD" ? "bg-green-600/80" : ""}
                                        ${prop.status === "COMING_SOON" ? "bg-blue-600/80" : ""}
                                    `}
                  >
                    {prop.status === "IN_CONTRACT"
                      ? t.listings.modal.statusInContract
                      : prop.status === "ACTIVE"
                        ? t.listings.modal.statusActive
                        : prop.status === "SOLD"
                          ? t.listings.modal.statusSold
                          : t.listings.modal.statusComingSoon}
                  </span>
                </div>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-sans text-xl font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300">
                  {prop.address}
                </h3>
                <p className="font-sans text-foreground/60 text-base font-medium mt-1">
                  {prop.city}, {prop.state} {prop.zip}
                </p>

                <div className="mt-6 flex items-center gap-6 text-base text-foreground/80 border-b border-border/40 pb-6 font-sans">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground/50">
                      {t.listings.card.beds}
                    </span>
                    <span className="font-sans text-lg font-semibold">{prop.beds}</span>
                  </div>
                  <div className="w-px h-8 bg-border/40" />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground/50">
                      {t.listings.card.baths}
                    </span>
                    <span className="font-sans text-lg font-semibold">{prop.baths}</span>
                  </div>
                  <div className="w-px h-8 bg-border/40" />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground/50">
                      {t.listings.card.sqft}
                    </span>
                    <span className="font-sans text-lg font-semibold">
                      {prop.sqft || "-"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between mt-auto pt-2">
                  <span className="font-sans text-2xl font-bold text-foreground tracking-tight">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                    }).format(prop.price)}
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openMediaModal(prop.id);
                      }}
                      className="font-sans text-sm font-medium text-foreground/60 hover:text-foreground transition-colors duration-300"
                    >
                      {t.listings.media.photos}
                    </button>
                    <button className="font-sans text-base font-semibold text-primary hover:text-primary-hover transition-colors duration-300 flex items-center gap-1 group/btn">
                      {t.listings.card.details}
                      <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalProperties > 0 && (
        <div className="flex items-center justify-between text-sm tracking-widest uppercase text-foreground/50 pt-8 border-t border-border">
          <span>
            {t.listings.pagination.showing}{" "}
            <span className="text-foreground font-serif text-base">
              {filteredProperties.length}
            </span>{" "}
            {t.listings.pagination.of}{" "}
            <span className="text-foreground font-serif text-base">
              {totalProperties}
            </span>{" "}
            {t.listings.pagination.listings}
          </span>
          <div className="flex gap-4">
            <button
              disabled={currentPage === 1 || loading}
              onClick={() => fetchProperties(currentPage - 1)}
              className="hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-foreground/50"
            >
              &larr; {t.listings.pagination.previous}
            </button>
            <button
              disabled={currentPage * 12 >= totalProperties || loading}
              onClick={() => fetchProperties(currentPage + 1)}
              className="hover:text-primary transition-colors disabled:opacity-30 disabled:hover:text-foreground/50"
            >
              {t.listings.pagination.next} &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Add Property Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-background ring-1 ring-border/50 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] rounded-3xl">
            <div className="p-8 border-b border-border/40 flex justify-between items-center bg-surface/30">
              <h2 className="font-sans text-2xl font-semibold text-foreground">
                {t.listings.modal.title}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-foreground/40 hover:text-foreground text-3xl font-light transition-colors leading-none"
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={handleAddProperty}
              className="p-8 overflow-y-auto space-y-6"
            >
              
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-8 flex flex-col md:flex-row gap-4 items-end animate-in fade-in duration-500">
                <div className="flex-1 w-full">
                  <label className="block font-sans text-sm font-semibold text-blue-900/60 mb-2">
                    Auto-fill from Zillow (ZPID)
                  </label>
                  <input
                    type="text"
                    value={zillowId}
                    onChange={(e) => setZillowId(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-base text-blue-900 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all placeholder:text-blue-900/30 shadow-sm"
                    placeholder="e.g. 20790691"
                  />
                </div>
                <button
                  onClick={handleZillowAutofill}
                  disabled={isZillowLoading}
                  type="button"
                  className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-md whitespace-nowrap flex-shrink-0"
                >
                  {isZillowLoading ? "Fetching..." : "Auto-fill Data"}
                </button>
              </div>

              <div>
                <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                  {t.listings.modal.street}
                </label>
                <input
                  required
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  type="text"
                  className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-foreground/30 shadow-sm"
                  placeholder="123 Example St, Apt 4"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                    {t.listings.modal.city}
                  </label>
                  <input
                    required
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                    {t.listings.modal.state}
                  </label>
                  <input
                    required
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                    {t.listings.modal.zip}
                  </label>
                  <input
                    required
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    type="text"
                    className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                    {t.listings.modal.price}
                  </label>
                  <input
                    required
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-sans placeholder:text-foreground/30 shadow-sm"
                    placeholder="1500000"
                  />
                </div>
                <div>
                  <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                    {t.listings.modal.sqft}
                  </label>
                  <input
                    name="sqft"
                    value={formData.sqft}
                    onChange={handleChange}
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-sans placeholder:text-foreground/30 shadow-sm"
                    placeholder="1200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                    {t.listings.modal.beds}
                  </label>
                  <input
                    required
                    name="beds"
                    value={formData.beds}
                    onChange={handleChange}
                    type="number"
                    step="0.5"
                    min="0"
                    className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-sans placeholder:text-foreground/30 shadow-sm"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                    {t.listings.modal.baths}
                  </label>
                  <input
                    required
                    name="baths"
                    value={formData.baths}
                    onChange={handleChange}
                    type="number"
                    step="0.5"
                    min="0"
                    className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-sans placeholder:text-foreground/30 shadow-sm"
                    placeholder="2"
                  />
                </div>
                <div>
                  <label className="block font-sans text-sm font-semibold text-foreground/60 mb-2">
                    {t.listings.modal.status}
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="COMING_SOON">
                      {t.listings.modal.statusComingSoon}
                    </option>
                    <option value="ACTIVE">
                      {t.listings.modal.statusActive}
                    </option>
                    <option value="IN_CONTRACT">
                      {t.listings.modal.statusInContract}
                    </option>
                    <option value="SOLD">{t.listings.modal.statusSold}</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 mt-8 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 bg-surface border border-border/60 text-foreground/70 rounded-xl text-base font-semibold hover:text-foreground transition-colors shadow-sm"
                >
                  {t.listings.modal.cancel}
                </button>
                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-background rounded-xl text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
                >
                  {isSubmitting
                    ? t.listings.modal.saving
                    : t.listings.modal.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Asset Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
          <div className="bg-background ring-1 ring-border/50 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] rounded-3xl">
            <div className="p-8 border-b border-border/40 flex justify-between items-center bg-surface/30 shrink-0">
              <div>
                <h2 className="font-sans text-2xl font-semibold text-foreground">
                  {t.listings.media.title}
                </h2>
                <p className="font-sans text-base text-foreground/60 mt-2">
                  {t.listings.media.subtitle}
                </p>
              </div>
              <button
                onClick={closeMediaModal}
                className="text-foreground/40 hover:text-foreground text-3xl font-light transition-colors leading-none"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {/* Existing Media Grid */}
              <div>
                <h3 className="font-sans text-sm uppercase tracking-widest text-foreground/40 mb-4 border-b border-border pb-2">
                  {t.listings.media.currentAssets}
                </h3>
                {mediaAssets.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-border bg-surface/30 text-foreground/30 font-sans text-sm uppercase tracking-widest">
                    {t.listings.media.noMedia}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mediaAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className="aspect-square relative group bg-surface border border-border overflow-hidden"
                      >
                        {asset.type === "IMAGE" ||
                        asset.type === "FLOORPLAN" ? (
                          <img
                            src={asset.url}
                            alt="Property Asset"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-surface/50 font-sans text-sm uppercase tracking-widest text-foreground/50">
                            {t.listings.media.videoTour}
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 text-xs font-sans uppercase tracking-widest text-foreground">
                          {asset.type}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Add Media Form Footer */}
            <div className="p-8 border-t border-border/40 bg-background shrink-0">
              <h3 className="font-sans text-sm font-semibold text-foreground/60 mb-4">
                {t.listings.media.addNew}
              </h3>
              <form
                onSubmit={handleAddMedia}
                className="flex flex-col md:flex-row gap-4 items-start md:items-end"
              >
                <div className="flex-1 w-full">
                  <label className="block font-sans text-sm font-semibold text-foreground/60 mb-1">
                    {t.listings.media.assetUrl}
                  </label>
                  <input
                    required
                    name="url"
                    value={mediaFormData.url}
                    onChange={handleMediaChange}
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-foreground/30 shadow-sm"
                  />
                </div>
                <div className="w-full md:w-48 shrink-0">
                  <label className="block font-sans text-sm font-semibold text-foreground/60 mb-1">
                    {t.listings.media.assetType}
                  </label>
                  <select
                    name="type"
                    value={mediaFormData.type}
                    onChange={handleMediaChange}
                    className="w-full px-4 py-2.5 bg-background border border-border/60 rounded-xl text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="IMAGE">{t.listings.media.typeImage}</option>
                    <option value="VIDEO">{t.listings.media.typeVideo}</option>
                    <option value="FLOORPLAN">
                      {t.listings.media.typeFloorplan}
                    </option>
                  </select>
                </div>
                <button
                  disabled={isMediaSubmitting}
                  type="submit"
                  className="w-full md:w-auto px-6 py-2.5 bg-primary text-background rounded-xl text-base font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0 shadow-md"
                >
                  {isMediaSubmitting
                    ? t.listings.media.uploading
                    : t.listings.media.uploadBtn}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
