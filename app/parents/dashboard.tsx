"use client";

import { useState, useEffect } from "react";
import { KidStatusItems } from "./kid-status-items";
import type { ChoreScheduleWithCompletion, Task, QualificationStatus } from "../lib/db";

interface KidStatus {
  name: string;
  chores: ChoreScheduleWithCompletion[];
  tasks: Task[];
  qualification: QualificationStatus;
}

export function Dashboard() {
  const [kidStatuses, setKidStatuses] = useState<KidStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const showMutationError = (msg: string) => {
    setMutationError(msg);
    setTimeout(() => setMutationError(null), 4000);
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();

      if (data.dashboard) {
        setKidStatuses(data.dashboard);
        setError(false);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId: number, values: { title: string; description: string; due_date: string }) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        setEditingTaskId(null);
        fetchDashboardData();
      } else {
        showMutationError("Couldn't update task. Try again.");
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      showMutationError("Couldn't update task. Try again.");
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEditingTaskId(null);
        fetchDashboardData();
      } else {
        showMutationError("Couldn't delete task. Try again.");
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
      showMutationError("Couldn't delete task. Try again.");
    }
  };

  const handleExcuse = async (type: "chore" | "task", id: number, date?: string) => {
    try {
      const response = await fetch("/api/excuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, date }),
      });

      if (response.ok) {
        fetchDashboardData();
      } else {
        showMutationError("Couldn't excuse item. Try again.");
      }
    } catch (error) {
      console.error("Failed to excuse item:", error);
      showMutationError("Couldn't excuse item. Try again.");
    }
  };

  useEffect(() => {
    fetchDashboardData();
    if (editingTaskId) return;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchDashboardData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [editingTaskId]);

  if (loading) {
    return <div className="text-gray-500">Loading dashboard...</div>;
  }

  if (kidStatuses.length === 0 && !error) {
    return <div className="text-gray-500">No kids found. Go to Settings to add kids.</div>;
  }

  return (
    <div className="space-y-6">
      {mutationError && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
          {mutationError}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
          Failed to load dashboard. Retrying...
        </div>
      )}
      {kidStatuses.map(kid => (
        <div
          key={kid.name}
          className={`rounded-lg p-4 ${
            kid.qualification?.qualified
              ? "border-2 border-green-500 bg-green-50 dark:bg-green-900/20"
              : "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
          }`}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{kid.name}</h3>
              {kid.qualification?.claim && (
                <span className="rounded-full bg-purple-500 px-2 py-0.5 text-xs font-medium text-white">
                  {kid.qualification.claim.reward_type === "screen_time" ? "📺 Screen Time" : "💵 $5"}
                </span>
              )}
            </div>
          </div>

          <KidStatusItems
            chores={kid.chores}
            tasks={kid.tasks}
            editingTaskId={editingTaskId}
            onEditTask={setEditingTaskId}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onCancelEdit={() => setEditingTaskId(null)}
            onExcuse={handleExcuse}
          />
        </div>
      ))}
    </div>
  );
}
