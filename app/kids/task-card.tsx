"use client";

import { Task } from "../lib/db";
import { useState } from "react";

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
}

export function TaskCard({ task, onToggle }: TaskCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "POST",
      });

      if (response.ok) {
        onToggle();
      }
    } catch (error) {
      console.error("Failed to toggle task:", error);
    } finally {
      setIsToggling(false);
    }
  };

  const getDaysUntilDue = (dueDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffMs = due.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
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

  const formatDueDate = (dueDate: string): string => {
    const daysUntil = getDaysUntilDue(dueDate);
    const date = new Date(dueDate);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });

    if (daysUntil === 0) return "Today";
    if (daysUntil === 1) return "Tomorrow";
    if (daysUntil === -1) return "Yesterday";
    if (daysUntil < -1) return `${Math.abs(daysUntil)} days overdue`;
    if (daysUntil <= 7) return `${dayName} (${daysUntil} days)`;
    const weeks = Math.floor(daysUntil / 7);
    if (weeks === 1) return `Next week`;
    return `In ${weeks} weeks`;
  };

  const daysUntil = getDaysUntilDue(task.due_date);
  const isOverdue = daysUntil < 0 && !task.completed_at; // Only past due (not today)
  const isDueToday = daysUntil === 0 && !task.completed_at;
  const isDueSoon = daysUntil > 0 && daysUntil <= 2 && !task.completed_at;
  const isFuture = daysUntil > 2 && !task.completed_at;

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      className={`w-full rounded-lg p-3 text-left transition-all ${
        task.completed_at
          ? "border-2 border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900/30"
          : isOverdue
            ? "border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
            : isDueToday
              ? "border-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
              : isDueSoon
                ? "border-2 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20"
                : "border-2 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700"
      } hover:scale-[1.02] active:scale-[0.98] ${isToggling ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
              task.completed_at ? "border-green-500 bg-green-500" : "border-gray-400 dark:border-gray-500"
            }`}>
            {task.completed_at && (
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          <div>
            <div
              className={`font-medium ${
                task.completed_at ? "text-gray-500 line-through dark:text-gray-400" : "text-gray-900 dark:text-white"
              }`}>
              {task.title}
            </div>
            {task.description && (
              <div
                className={`mt-0.5 text-sm ${
                  task.completed_at ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"
                }`}>
                {task.description}
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div
            className={`text-xs font-medium ${
              task.completed_at ? "text-green-600 dark:text-green-400" : "text-purple-600 dark:text-purple-400"
            }`}>
            Task
          </div>
          {isOverdue && !task.completed_at && (
            <div className="mt-0.5 text-xs text-red-500 dark:text-red-400">Overdue</div>
          )}
          {isDueToday && !task.completed_at && (
            <div className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">Due today</div>
          )}
          {isDueSoon && !task.completed_at && (
            <div className="mt-0.5 text-xs text-orange-600 dark:text-orange-400">Due soon</div>
          )}
          {isFuture && !task.completed_at && (
            <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{formatDueDate(task.due_date)}</div>
          )}
          {task.completed_at && (
            <div className="mt-0.5 text-xs text-green-600 dark:text-green-400">
              Done {getRelativeTime(task.completed_at)}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
