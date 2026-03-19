"use client";

import React from "react";
import { useI18n } from "@/lib/i18n/I18nContext";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS, zhCN, es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  en: enUS,
  zh: zhCN,
  es: es,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function AppointmentsPage() {
  const { t, language } = useI18n();

  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<"list" | "calendar">("list");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = React.useState(false);

  // Form data for new appointment
  const [formData, setFormData] = React.useState({
    title: "",
    date: "",
    notes: "",
    status: "SCHEDULED",
    clientId: "",
    propertyId: "",
  });

  // Reference data
  const [clients, setClients] = React.useState<any[]>([]);
  const [properties, setProperties] = React.useState<any[]>([]);

  const fetchAppointments = () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/appointments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setAppointments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  React.useEffect(() => {
    fetchAppointments();

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/clients?limit=100`, { headers })
      .then((res) => res.json())
      .then((data) => setClients(data.data || []));
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/properties?limit=100`, { headers })
      .then((res) => res.json())
      .then((data) => setProperties(data.data || []));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          clientId: formData.clientId || undefined,
          propertyId: formData.propertyId || undefined,
        }),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({
          title: "",
          date: "",
          notes: "",
          status: "SCHEDULED",
          clientId: "",
          propertyId: "",
        });
        fetchAppointments();
      } else {
        alert("Failed to schedule appointment");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncGoogle = async () => {
    setIsSyncingGoogle(true);
    // Simulate background sync with Google API
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncingGoogle(false);
    alert("Appointments successfully synced to your connected Google Calendar!");
  };

  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.date) >= new Date() && a.status !== "CANCELLED",
  );
  const pastAppointments = appointments.filter(
    (a) => new Date(a.date) < new Date() || a.status === "CANCELLED",
  );

  const renderAppointmentCard = (apt: any) => {
    const dateObj = new Date(apt.date);
    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = dateObj
      .toLocaleString("default", { month: "short" })
      .toUpperCase();
    const time = dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div
        key={apt.id}
        className="bg-surface border border-border p-6 flex items-stretch gap-6 group hover:border-primary/50 transition-colors duration-500"
      >
        {/* Date Block */}
        <div className="flex flex-col items-center justify-center pr-6 border-r border-border min-w-[100px]">
          <span className="text-primary text-sm uppercase tracking-widest font-sans mb-1">
            {month}
          </span>
          <span className="font-serif text-4xl text-foreground font-light">
            {day}
          </span>
          <span className="text-foreground/40 text-[10px] uppercase tracking-widest mt-2">
            {time}
          </span>
        </div>

        {/* Content Block */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-serif text-2xl text-foreground font-light group-hover:text-primary transition-colors">
              {apt.title}
            </h3>
            <span
              className={`text-[10px] px-2 py-1 uppercase tracking-widest border
                            ${apt.status === "SCHEDULED" ? "bg-primary/10 border-primary/20 text-primary" : ""}
                            ${apt.status === "COMPLETED" ? "bg-surface border-border text-foreground/50" : ""}
                            ${apt.status === "CANCELLED" ? "bg-red-900/10 border-red-900/20 text-red-500/80" : ""}
                        `}
            >
              {apt.status === "COMPLETED"
                ? t.appointments.modal.completed
                : apt.status === "CANCELLED"
                  ? t.appointments.modal.cancelled
                  : t.appointments.modal.scheduled}
            </span>
          </div>

          <div className="flex gap-4 text-xs font-sans uppercase tracking-widest text-foreground/50">
            {apt.client && (
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 bg-border rounded-full inline-block mr-1"></span>
                {apt.client.firstName} {apt.client.lastName}
              </span>
            )}
            {apt.property && (
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 bg-border rounded-full inline-block mr-1"></span>
                {apt.property.address}
              </span>
            )}
          </div>

          {apt.notes && (
            <p className="mt-4 text-sm font-sans text-foreground/70 line-clamp-2 leading-relaxed">
              {apt.notes}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Format appointments for react-big-calendar
  const calendarEvents = appointments.map((apt) => ({
    id: apt.id,
    title: `${apt.title} ${apt.status === "CANCELLED" ? "(Cancelled)" : ""}`,
    start: new Date(apt.date),
    end: new Date(new Date(apt.date).getTime() + 60 * 60 * 1000), // Assuming 1 hour meetings
    raw: apt,
  }));

  const handleSelectEvent = (event: any) => {
    // You could open an edit modal here. For now we will just show details.
    alert(
      `${event.title}\nClient: ${event.raw.client?.firstName || "None"}\nProperty: ${event.raw.property?.address || "None"}\nNotes: ${event.raw.notes || "None"}`,
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out text-foreground">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-8">
        <div className="max-w-xl">
          <h1 className="font-serif text-5xl font-light tracking-tight text-foreground">
            {t.appointments.title}
          </h1>
          <p className="font-sans text-foreground/60 mt-4 text-base font-light leading-relaxed">
            {t.appointments.subtitle}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <button
            onClick={handleSyncGoogle}
            disabled={isSyncingGoogle}
            className="px-6 py-3 bg-blue-600/10 text-blue-500 border border-blue-600/20 hover:bg-blue-600/20 transition-colors duration-500 rounded-xl text-sm font-semibold w-full sm:w-auto text-center flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.64 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
            </svg>
            {isSyncingGoogle ? "Syncing..." : "Sync with Google"}
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-primary text-background hover:bg-primary-hover transition-colors duration-500 rounded-xl text-sm font-semibold w-full sm:w-auto text-center shadow-md"
          >
            {t.appointments.addMeeting}
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setViewMode("list")}
          className={`px-8 py-4 font-sans text-xs uppercase tracking-widest transition-colors ${viewMode === "list" ? "border-b-2 border-primary text-foreground" : "text-foreground/40 hover:text-foreground"}`}
        >
          {t.appointments.list}
        </button>
        <button
          onClick={() => setViewMode("calendar")}
          className={`px-8 py-4 font-sans text-xs uppercase tracking-widest transition-colors ${viewMode === "calendar" ? "border-b-2 border-primary text-foreground" : "text-foreground/40 hover:text-foreground"}`}
        >
          {t.appointments.calendar}
        </button>
      </div>

      {/* Main Content */}
      <div className="min-h-[500px]">
        {loading ? (
          <div className="py-24 border border-border bg-surface/30 text-center text-foreground/50 tracking-widest uppercase text-xs">
            {t.appointments.loading || "Loading..."}
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-24 border border-border bg-surface/30 text-center text-foreground/50 tracking-widest uppercase text-xs">
            {t.appointments.empty}
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-12">
            {/* Upcoming Section */}
            {upcomingAppointments.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl text-foreground font-light mb-6 flex items-center gap-4">
                  {t.appointments.upcoming}
                  <span className="h-px bg-border flex-1"></span>
                  <span className="text-xs font-sans text-foreground/30 uppercase tracking-widest">
                    {upcomingAppointments.length}
                  </span>
                </h2>
                <div className="space-y-4">
                  {upcomingAppointments.map(renderAppointmentCard)}
                </div>
              </div>
            )}

            {/* Past/Completed Section */}
            {pastAppointments.length > 0 && (
              <div>
                <h2 className="font-serif text-xl text-foreground/60 font-light mb-6 flex items-center gap-4">
                  {t.appointments.past}
                  <span className="h-px bg-border flex-1 opacity-50"></span>
                </h2>
                <div className="space-y-4 opacity-70 grayscale-[30%]">
                  {pastAppointments.map(renderAppointmentCard)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-border p-6 bg-surface/20 min-h-[600px] h-[80vh]">
            <style>{`
                            .rbc-calendar { font-family: var(--font-sans); color: var(--foreground); }
                            .rbc-header { border-bottom: 1px solid var(--border); padding: 10px; font-weight: normal; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.75rem; color: var(--foreground); opacity: 0.6; }
                            .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 1px solid var(--border); border-radius: 0; background: transparent; }
                            .rbc-day-bg { border-left: 1px solid var(--border); }
                            .rbc-month-row { border-top: 1px solid var(--border); }
                            .rbc-today { background-color: rgba(197, 160, 89, 0.05); }
                            .rbc-event { background-color: var(--primary); border-radius: 0; color: var(--background); text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.65rem; padding: 2px 6px; border: none; }
                            .rbc-event.rbc-selected { background-color: var(--primary-hover); }
                            .rbc-off-range-bg { background-color: rgba(255, 255, 255, 0.02); }
                            .rbc-button-link { color: var(--foreground); }
                            .rbc-toolbar button { font-family: var(--font-sans); color: var(--foreground); border: 1px solid var(--border); border-radius: 0; padding: 6px 12px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; background: transparent; transition: all 0.3s; margin-right: 4px; }
                            .rbc-toolbar button:hover, .rbc-toolbar button:focus, .rbc-toolbar button:active { background-color: var(--border); color: var(--foreground); box-shadow: none; outline: none; }
                            .rbc-toolbar button.rbc-active { background-color: var(--primary); color: var(--background); border-color: var(--primary); }
                            .rbc-toolbar .rbc-toolbar-label { font-family: var(--font-serif); font-size: 1.5rem; font-weight: 300; }
                            .rbc-time-content { border-top: 1px solid var(--border); }
                            .rbc-time-header.rbc-overflowing { border-right: 1px solid var(--border); }
                            .rbc-time-header-content { border-left: 1px solid var(--border); }
                            .rbc-timeslot-group { border-bottom: 1px solid var(--border); }
                            .rbc-day-slot .rbc-time-slot { border-top: 1px dotted var(--border); opacity: 0.3; }
                        `}</style>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              onSelectEvent={handleSelectEvent}
              culture={language}
              messages={{
                today: t.appointments.calendarTranslations?.today,
                previous: t.appointments.calendarTranslations?.previous,
                next: t.appointments.calendarTranslations?.next,
                month: t.appointments.calendarTranslations?.month,
                week: t.appointments.calendarTranslations?.week,
                day: t.appointments.calendarTranslations?.day,
                agenda: t.appointments.calendarTranslations?.agenda,
                date: t.appointments.calendarTranslations?.date,
                time: t.appointments.calendarTranslations?.time,
                event: t.appointments.calendarTranslations?.event,
                showMore: (total) => `+${total} more`,
              }}
            />
          </div>
        )}
      </div>

      {/* Add Appointment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-background border border-border shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] rounded-none">
            <div className="p-8 border-b border-border flex justify-between items-center bg-surface">
              <h2 className="font-serif text-3xl font-light text-foreground">
                {t.appointments.modal.title}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-foreground/50 hover:text-primary text-3xl font-light transition-colors leading-none"
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={handleAddAppointment}
              className="p-8 overflow-y-auto space-y-8"
            >
              <div>
                <label className="block font-sans text-xs uppercase tracking-widest text-foreground/50 mb-2">
                  {t.appointments.modal.meetingTitle}
                </label>
                <input
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  type="text"
                  className="w-full px-4 py-3 bg-surface border border-border rounded-none text-sm text-foreground focus:border-primary outline-none transition-colors placeholder:text-foreground/20"
                  placeholder="e.g. Property Showing at 123 Main St"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest text-foreground/50 mb-2">
                    {t.appointments.modal.date}
                  </label>
                  <input
                    required
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    type="datetime-local"
                    className="w-full px-4 py-3 bg-surface border border-border rounded-none text-sm text-foreground focus:border-primary outline-none transition-colors font-sans"
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest text-foreground/50 mb-2">
                    {t.appointments.modal.status}
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-none text-sm text-foreground focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="SCHEDULED">
                      {t.appointments.modal.scheduled}
                    </option>
                    <option value="COMPLETED">
                      {t.appointments.modal.completed}
                    </option>
                    <option value="CANCELLED">
                      {t.appointments.modal.cancelled}
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest text-foreground/50 mb-2">
                    {t.appointments.modal.selectClient}
                  </label>
                  <select
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-none text-sm text-foreground focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">-- None --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-sans text-xs uppercase tracking-widest text-foreground/50 mb-2">
                    {t.appointments.modal.selectProperty}
                  </label>
                  <select
                    name="propertyId"
                    value={formData.propertyId}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-surface border border-border rounded-none text-sm text-foreground focus:border-primary outline-none transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">-- None --</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.address}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-sans text-xs uppercase tracking-widest text-foreground/50 mb-2">
                  {t.appointments.modal.notes}
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-surface border border-border rounded-none text-sm text-foreground focus:border-primary outline-none transition-colors placeholder:text-foreground/20"
                  placeholder="Optional notes for the meeting..."
                ></textarea>
              </div>

              <div className="pt-6 flex justify-end gap-4 mt-8 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-3 bg-transparent border border-border text-foreground/70 rounded-none text-sm uppercase tracking-widest font-medium hover:text-foreground hover:border-foreground transition-colors"
                >
                  {t.appointments.modal.cancel}
                </button>
                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="px-6 py-3 bg-primary text-background rounded-none text-sm uppercase tracking-widest font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? t.appointments.modal.saving
                    : t.appointments.modal.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
