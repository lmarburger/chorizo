"use client";

import { useState, useEffect } from "react";
import { Task } from "../lib/db";
import { EditTaskForm } from "./edit-task-form";

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  const fetchTasks = () => {
    fetch("/api/tasks?view=parent")
      .then(res => res.json())
      .then(data => {
        setTasks(data.tasks || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "POST",
      });
      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Failed to toggle task:", error);
    }
  };

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  };

  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffMs = due.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const formatDueDate = (dueDate: string): string => {
    const daysUntil = getDaysUntilDue(dueDate);
    const date = new Date(dueDate);
    const formatted = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    if (daysUntil === 0) return `Today (${formatted})`;
    if (daysUntil === 1) return `Tomorrow (${formatted})`;
    if (daysUntil === -1) return `Yesterday (${formatted})`;
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days overdue (${formatted})`;
    if (daysUntil <= 7) return `In ${daysUntil} days (${formatted})`;
    return formatted;
  };

  if (loading) {
    return <p className="py-8 text-center text-gray-600 dark:text-gray-400">Loading tasks...</p>;
  }

  const uncompletedTasks = tasks.filter(t => !t.completed_at);
  const completedTasks = tasks.filter(t => t.completed_at);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">One-Time Tasks</h2>

      {uncompletedTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Tasks</h3>
          {uncompletedTasks.map(task => {
            const daysUntil = getDaysUntilDue(task.due_date);
            const isOverdue = daysUntil < 0;
            const isDueSoon = daysUntil >= 0 && daysUntil <= 2;

            if (editingTaskId === task.id) {
              return (
                <EditTaskForm
                  key={task.id}
                  task={task}
                  onCancel={() => setEditingTaskId(null)}
                  onSave={() => {
                    setEditingTaskId(null);
                    fetchTasks();
                  }}
                />
              );
            }

            return (
              <div
                key={task.id}
                className={`rounded-lg border-2 p-3 ${
                  isOverdue
                    ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                    : isDueSoon
                      ? "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggle(task.id)}
                      className="mt-0.5 flex h-5 w-5 items-center justify-center rounded border-2 border-gray-400 hover:border-green-500 dark:border-gray-500">
                      {task.completed_at && (
                        <svg className="h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{task.title}</div>
                      {task.description && (
                        <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{task.description}</div>
                      )}
                      <div className="mt-1 flex items-center gap-4 text-xs">
                        <span className="text-gray-500 dark:text-gray-400">For: {task.kid_name}</span>
                        <span
                          className={
                            isOverdue
                              ? "font-medium text-red-600 dark:text-red-400"
                              : isDueSoon
                                ? "font-medium text-orange-600 dark:text-orange-400"
                                : "text-gray-500 dark:text-gray-400"
                          }>
                          Due: {formatDueDate(task.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-2 flex gap-2">
                    <button
                      onClick={() => setEditingTaskId(task.id)}
                      className="rounded px-2 py-1 text-xs font-medium text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id, task.title)}
                      className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-gray-700">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recently Completed</h3>
          {completedTasks.map(task => {
            if (editingTaskId === task.id) {
              return (
                <EditTaskForm
                  key={task.id}
                  task={task}
                  onCancel={() => setEditingTaskId(null)}
                  onSave={() => {
                    setEditingTaskId(null);
                    fetchTasks();
                  }}
                />
              );
            }

            return (
              <div
                key={task.id}
                className="rounded-lg border-2 border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggle(task.id)}
                      className="mt-0.5 flex h-5 w-5 items-center justify-center rounded border-2 border-green-500 bg-green-500">
                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <div className="flex-1">
                      <div className="font-medium text-gray-500 line-through dark:text-gray-400">{task.title}</div>
                      {task.description && (
                        <div className="mt-0.5 text-sm text-gray-400 dark:text-gray-500">{task.description}</div>
                      )}
                      <div className="mt-1 flex items-center gap-4 text-xs">
                        <span className="text-gray-400 dark:text-gray-500">For: {task.kid_name}</span>
                        <span className="text-green-600 dark:text-green-400">
                          Completed {task.completed_at ? getRelativeTime(task.completed_at) : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-2 flex gap-2">
                    <button
                      onClick={() => setEditingTaskId(task.id)}
                      className="rounded px-2 py-1 text-xs font-medium text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id, task.title)}
                      className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-gray-700">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tasks.length === 0 && (
        <p className="py-8 text-center text-gray-600 dark:text-gray-400">
          No tasks yet. Add a one-time task to get started!
        </p>
      )}
    </div>
  );
}
