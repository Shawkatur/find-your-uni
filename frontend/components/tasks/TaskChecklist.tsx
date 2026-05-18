"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, CalendarDays, CheckCircle2, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export function TaskChecklist({ applicationId }: { applicationId: string }) {
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["tasks", applicationId],
    queryFn: async () => {
      const res = await api.get(`/tasks?application_id=${applicationId}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; due_date?: string }) => {
      await api.post("/tasks", { application_id: applicationId, ...data });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", applicationId] });
      setNewTitle("");
      setNewDueDate("");
      setShowForm(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      await api.patch(`/tasks/${id}`, { is_completed });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", applicationId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", applicationId] });
    },
  });

  const completedCount = tasks.filter((t) => t.is_completed).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.15)] flex items-center justify-center">
            <CheckCircle2 size={13} className="text-violet-500" />
          </div>
          <h3 className="text-[#333] font-black tracking-tight">Tasks</h3>
          {tasks.length > 0 && (
            <span className="text-xs text-slate-400 font-medium">
              {completedCount}/{tasks.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTitle.trim()) {
                createMutation.mutate({ title: newTitle.trim(), due_date: newDueDate || undefined });
              }
            }}
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <Button
              size="sm"
              disabled={!newTitle.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate({ title: newTitle.trim(), due_date: newDueDate || undefined })}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {tasks.length === 0 && !showForm ? (
        <p className="text-slate-400 text-sm">No tasks yet. Add deadlines and to-dos to stay on track.</p>
      ) : (
        <div className="space-y-1.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg group hover:bg-slate-50 transition-colors ${
                task.is_completed ? "opacity-60" : ""
              }`}
            >
              <button
                onClick={() => toggleMutation.mutate({ id: task.id, is_completed: !task.is_completed })}
                className="mt-0.5 shrink-0"
              >
                {task.is_completed ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <Circle size={16} className="text-slate-300 hover:text-emerald-400 transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.is_completed ? "line-through text-slate-400" : "text-slate-700"}`}>
                  {task.title}
                </p>
                {task.due_date && (
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <CalendarDays size={9} />
                    {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {!task.is_completed && new Date(task.due_date) < new Date() && (
                      <span className="text-red-500 font-semibold ml-1">Overdue</span>
                    )}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteMutation.mutate(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
