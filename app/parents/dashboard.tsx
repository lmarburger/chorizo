"use client";

import { useState, useEffect } from "react";
import { parseISO } from "date-fns";
import { TaskEditForm } from "./task-edit-form";
import { KidStatusItems } from "./kid-status-items";
import type { Task } from "../lib/db";

interface ChoreWithSchedule {
  id: number;
  chore_id: number;
  kid_name: string;
  day_of_week: string;
  chore_name: string;
  chore_description: string | null;
  day_number: number;
  chore_date: string;
  completion_id: number | null;
  completed_at: string | null;
  is_completed: boolean;
}

interface KidStatus {
  name: string;
  outstandingChores: ChoreWithSchedule[];
  outstandingTasks: Task[];
  allIncompleteTasks: Task[];
  allComplete: boolean;
  upcomingTasks: Task[];
}

export function Dashboard() {
  const [kidStatuses, setKidStatuses] = useState<KidStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [expandedKids, setExpandedKids] = useState<Set<string>>(new Set());

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const data = await response.json();

      if (data.dashboard) {
        setKidStatuses(data.dashboard);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
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
      }
    } catch (error) {
      console.error("Failed to update task:", error);
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
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    if (!editingTaskId) {
      const interval = setInterval(fetchDashboardData, 5000);
      return () => clearInterval(interval);
    }
  }, [editingTaskId]);

  if (loading) {
    return <div className="text-gray-500">Loading dashboard...</div>;
  }

  if (kidStatuses.length === 0) {
    return <div className="text-gray-500">No kids found. Go to Settings to add kids.</div>;
  }

  return (
    <div className="space-y-6">
      {kidStatuses.map(kid => (
        <div
          key={kid.name}
          onClick={
            kid.allComplete && kid.upcomingTasks.length > 0
              ? () => {
                  const newExpanded = new Set(expandedKids);
                  if (expandedKids.has(kid.name)) {
                    newExpanded.delete(kid.name);
                  } else {
                    newExpanded.add(kid.name);
                  }
                  setExpandedKids(newExpanded);
                }
              : undefined
          }
          className={`rounded-lg p-4 ${
            kid.allComplete
              ? kid.upcomingTasks.length > 0
                ? "cursor-pointer border-2 border-green-500 bg-green-50 transition-opacity hover:opacity-90 dark:bg-green-900/20"
                : "border-2 border-green-500 bg-green-50 dark:bg-green-900/20"
              : "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
          }`}>
          <div className={`flex items-center justify-between ${!kid.allComplete ? "mb-3" : ""}`}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{kid.name}</h3>
            {kid.allComplete && kid.upcomingTasks.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                  {kid.upcomingTasks.length} upcoming
                </span>
                <svg
                  className={`h-4 w-4 text-gray-600 transition-transform dark:text-gray-400 ${expandedKids.has(kid.name) ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </div>

          {!kid.allComplete && (kid.outstandingChores.length > 0 || kid.allIncompleteTasks.length > 0) && (
            <div className="space-y-1">
              <KidStatusItems
                outstandingChores={kid.outstandingChores}
                allIncompleteTasks={kid.allIncompleteTasks}
                editingTaskId={editingTaskId}
                onEditTask={setEditingTaskId}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onCancelEdit={() => setEditingTaskId(null)}
              />
            </div>
          )}

          {kid.allComplete && expandedKids.has(kid.name) && kid.upcomingTasks.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">Upcoming Tasks:</div>
              {kid.upcomingTasks.map(task => {
                const dueDate = parseISO(task.due_date);

                if (editingTaskId === task.id) {
                  return (
                    <TaskEditForm
                      key={`task-${task.id}`}
                      task={task}
                      onSave={values => handleUpdateTask(task.id, values)}
                      onCancel={() => setEditingTaskId(null)}
                      onDelete={() => handleDeleteTask(task.id)}
                      stopPropagation
                    />
                  );
                }

                return (
                  <div
                    key={`task-${task.id}`}
                    onClick={e => {
                      e.stopPropagation();
                      setEditingTaskId(task.id);
                    }}
                    className="flex cursor-pointer items-center justify-between rounded bg-gray-100 px-2 py-1 text-sm transition-opacity hover:opacity-80 dark:bg-gray-700/30 dark:text-gray-300">
                    <span className="font-medium">{task.title}</span>
                    <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      Task ({dueDate.toLocaleDateString("en-US", { weekday: "short" })})
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
