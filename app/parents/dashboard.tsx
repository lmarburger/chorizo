"use client";

import { useState, useEffect } from "react";
import { format, parseISO, startOfDay } from "date-fns";
import { FormInput, FormTextarea, FormButton } from "../components/form-components";

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

interface Task {
  id: number;
  title: string;
  description: string | null;
  kid_name: string;
  due_date: string;
  completed_at: Date | null;
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
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    due_date: "",
  });

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

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    const formattedDate = task.due_date.includes("T") ? task.due_date.split("T")[0] : task.due_date;
    setEditForm({
      title: task.title,
      description: task.description || "",
      due_date: formattedDate,
    });
  };

  const handleUpdateTask = async () => {
    if (!editingTaskId) return;

    try {
      const response = await fetch(`/api/tasks/${editingTaskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
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
              {(() => {
                const today = new Date();
                const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
                const todayStart = startOfDay(today);

                type CombinedItem = {
                  type: "chore" | "task";
                  id: string;
                  name: string;
                  dayName?: string;
                  dueDate?: Date;
                  isToday: boolean;
                  isPast: boolean;
                  isFuture: boolean;
                  sortOrder: number;
                  data: ChoreWithSchedule | Task;
                };

                const items: CombinedItem[] = [];
                kid.outstandingChores.forEach(chore => {
                  const daysAgo = dayOfWeek - chore.day_number;
                  const isToday = daysAgo === 0;
                  const isPast = daysAgo > 0;
                  const dayName = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][chore.day_number];

                  items.push({
                    type: "chore",
                    id: `chore-${chore.id}-${chore.day_number}`,
                    name: chore.chore_name,
                    dayName,
                    isToday,
                    isPast,
                    isFuture: false,
                    sortOrder: isPast ? 0 : isToday ? 1 : 3,
                    data: chore,
                  });
                });

                kid.allIncompleteTasks.forEach(task => {
                  const dueDate = parseISO(task.due_date);
                  const isToday = format(dueDate, "yyyy-MM-dd") === format(todayStart, "yyyy-MM-dd");
                  const isPast = dueDate < todayStart;
                  const isFuture = dueDate > todayStart;

                  items.push({
                    type: "task",
                    id: `task-${task.id}`,
                    name: task.title,
                    dueDate,
                    isToday,
                    isPast,
                    isFuture,
                    sortOrder: isPast ? 0 : isToday ? 1 : isFuture ? 2 : 3,
                    data: task,
                  });
                });

                items.sort((a, b) => {
                  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
                  return a.name.localeCompare(b.name);
                });

                return items.map(item => {
                  if (item.type === "chore") {
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                          item.isToday
                            ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                            : "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100"
                        }`}>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs opacity-75">Chore ({item.dayName})</span>
                      </div>
                    );
                  } else {
                    const task = item.data as Task;

                    if (editingTaskId === task.id) {
                      return (
                        <div key={item.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                          <div className="space-y-4">
                            <FormInput
                              name="title"
                              label="Title"
                              value={editForm.title}
                              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                            />

                            <FormTextarea
                              name="description"
                              label="Description"
                              value={editForm.description}
                              onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                              rows={2}
                            />

                            <FormInput
                              type="date"
                              name="due_date"
                              label="Due Date"
                              value={editForm.due_date}
                              onChange={e => setEditForm({ ...editForm, due_date: e.target.value })}
                            />

                            <div className="flex items-center justify-between">
                              <FormButton variant="danger" onClick={() => handleDeleteTask(task.id)}>
                                Delete
                              </FormButton>
                              <div className="flex gap-2">
                                <FormButton variant="secondary" onClick={() => setEditingTaskId(null)}>
                                  Cancel
                                </FormButton>
                                <FormButton variant="primary" onClick={handleUpdateTask}>
                                  Save
                                </FormButton>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleEditTask(task)}
                        className={`flex cursor-pointer items-center justify-between rounded px-2 py-1 text-sm transition-opacity hover:opacity-80 ${
                          item.isPast
                            ? "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100"
                            : item.isToday
                              ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                              : item.isFuture
                                ? "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300"
                                : "bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100"
                        }`}>
                        <span className="font-medium">{item.name}</span>
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Task (
                          {item.dueDate ? item.dueDate.toLocaleDateString("en-US", { weekday: "short" }) : "unknown"})
                        </span>
                      </div>
                    );
                  }
                });
              })()}
            </div>
          )}

          {kid.allComplete && expandedKids.has(kid.name) && kid.upcomingTasks.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">Upcoming Tasks:</div>
              {kid.upcomingTasks.map(task => {
                const dueDate = parseISO(task.due_date);

                if (editingTaskId === task.id) {
                  return (
                    <div
                      key={`task-${task.id}`}
                      onClick={e => e.stopPropagation()}
                      className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                      <div className="space-y-4">
                        <FormInput
                          name="title"
                          label="Title"
                          value={editForm.title}
                          onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        />

                        <FormTextarea
                          name="description"
                          label="Description"
                          value={editForm.description}
                          onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                          rows={2}
                        />

                        <FormInput
                          type="date"
                          name="due_date"
                          label="Due Date"
                          value={editForm.due_date}
                          onChange={e => setEditForm({ ...editForm, due_date: e.target.value })}
                        />

                        <div className="flex items-center justify-between">
                          <FormButton variant="danger" onClick={() => handleDeleteTask(task.id)}>
                            Delete
                          </FormButton>
                          <div className="flex gap-2">
                            <FormButton variant="secondary" onClick={() => setEditingTaskId(null)}>
                              Cancel
                            </FormButton>
                            <FormButton variant="primary" onClick={handleUpdateTask}>
                              Save
                            </FormButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={`task-${task.id}`}
                    onClick={e => {
                      e.stopPropagation();
                      handleEditTask(task);
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
