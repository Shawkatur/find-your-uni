"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock, Plus, X, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import api from "@/lib/api";
import { PageWrapper } from "@/components/layout/PageWrapper";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface AvailabilitySlot {
  id: number;
  consultant_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

interface Booking {
  id: number;
  consultant_id: number;
  student_id: number;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "tag-pill-green",
  cancelled: "tag-pill-red",
  completed: "tag-pill-blue",
  no_show: "tag-pill-yellow",
};

export default function ConsultantCalendarPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlot, setNewSlot] = useState({ day_of_week: 0, start_time: "09:00", end_time: "10:00" });

  // Fetch availability slots
  const { data: slots = [], isLoading: slotsLoading } = useQuery<AvailabilitySlot[]>({
    queryKey: ["availability-slots"],
    queryFn: async () => {
      const res = await api.get("/scheduling/availability");
      return res.data?.items ?? res.data ?? [];
    },
  });

  // Fetch bookings
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["consultant-bookings"],
    queryFn: async () => {
      const res = await api.get("/scheduling/bookings", { params: { role: "consultant" } });
      return res.data?.items ?? res.data ?? [];
    },
  });

  // Create slot mutation
  const createSlot = useMutation({
    mutationFn: async (slot: { day_of_week: number; start_time: string; end_time: string }) => {
      const res = await api.post("/scheduling/availability", slot);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-slots"] });
      setShowAddForm(false);
      setNewSlot({ day_of_week: 0, start_time: "09:00", end_time: "10:00" });
    },
  });

  // Delete slot mutation
  const deleteSlot = useMutation({
    mutationFn: async (slotId: number) => {
      await api.delete(`/scheduling/availability/${slotId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-slots"] });
    },
  });

  // Cancel booking mutation
  const cancelBooking = useMutation({
    mutationFn: async (bookingId: number) => {
      await api.patch(`/scheduling/bookings/${bookingId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultant-bookings"] });
    },
  });

  // Group slots by day
  const slotsByDay: Record<number, AvailabilitySlot[]> = {};
  for (let i = 0; i < 7; i++) slotsByDay[i] = [];
  slots.filter((s) => s.is_active).forEach((slot) => {
    if (slotsByDay[slot.day_of_week]) {
      slotsByDay[slot.day_of_week].push(slot);
    }
  });

  // Sort bookings by scheduled_at
  const sortedBookings = [...bookings].sort(
    (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  );

  return (
    <PageWrapper
      title="Calendar"
      subtitle="Manage your availability and view upcoming bookings."
      actions={
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-electric flex items-center gap-2"
        >
          <Plus size={16} />
          Add Slot
        </button>
      }
    >
      {/* Add Slot Form */}
      {showAddForm && (
        <div className="glass-card mb-6 p-5">
          <h3 className="text-foreground font-semibold mb-4">Add Availability Slot</h3>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Day</label>
              <select
                value={newSlot.day_of_week}
                onChange={(e) => setNewSlot({ ...newSlot, day_of_week: parseInt(e.target.value) })}
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                {DAYS.map((day, idx) => (
                  <option key={idx} value={idx}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Start Time</label>
              <input
                type="time"
                value={newSlot.start_time}
                onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">End Time</label>
              <input
                type="time"
                value={newSlot.end_time}
                onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => createSlot.mutate(newSlot)}
                disabled={createSlot.isPending}
                className="btn-electric text-sm"
              >
                {createSlot.isPending ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
          {createSlot.isError && (
            <p className="text-red-500 text-sm mt-2">Failed to create slot. Please try again.</p>
          )}
        </div>
      )}

      {/* Section 1: Weekly Availability */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <CalendarDays size={20} className="text-[#10B981]" />
          Weekly Availability
        </h2>
        {slotsLoading ? (
          <div className="glass-card p-8 text-center text-muted-foreground">Loading availability...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DAYS.map((day, idx) => (
              <div key={idx} className="glass-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 border-b border-border pb-2">
                  {day}
                </h3>
                <div className="space-y-2">
                  {slotsByDay[idx].length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No slots</p>
                  ) : (
                    slotsByDay[idx].map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5"
                      >
                        <span className="text-sm text-emerald-700 font-medium">
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </span>
                        <button
                          onClick={() => deleteSlot.mutate(slot.id)}
                          disabled={deleteSlot.isPending}
                          className="text-red-400 hover:text-red-600 transition-colors p-0.5"
                          title="Remove slot"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Upcoming Bookings */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock size={20} className="text-[#10B981]" />
          Upcoming Bookings
        </h2>
        {bookingsLoading ? (
          <div className="glass-card p-8 text-center text-muted-foreground">Loading bookings...</div>
        ) : sortedBookings.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted-foreground">
            No bookings yet. Students will be able to book once you set your availability.
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-slate-50/50">
                    <th className="text-left px-4 py-3 text-muted-foreground font-semibold">Date & Time</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-semibold">Duration</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-semibold">Status</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-semibold">Notes</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-border last:border-0 hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-foreground font-medium">
                        {format(parseISO(booking.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {booking.duration_minutes} min
                      </td>
                      <td className="px-4 py-3">
                        <span className={`tag-pill ${STATUS_STYLES[booking.status] ?? "tag-pill-gray"}`}>
                          {booking.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">
                        {booking.notes || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {booking.status === "confirmed" && (
                          <button
                            onClick={() => cancelBooking.mutate(booking.id)}
                            disabled={cancelBooking.isPending}
                            className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                          >
                            <XCircle size={14} />
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
