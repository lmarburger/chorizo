"use client";

import { ChoreScheduleWithCompletion } from "../lib/db";
import { useState } from "react";

interface ChoreCardProps {
  chore: ChoreScheduleWithCompletion;
  onToggle: () => void;
}

function getRelativeTime(date: Date): string {
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
}

export function ChoreCard({ chore, onToggle }: ChoreCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  const dayLabels: Record<string, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };

  // Determine chore status
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const todayIndex = dayOrder.indexOf(today);
  const choreIndex = dayOrder.indexOf(chore.day_of_week);
  const isOverdue = !chore.is_completed && choreIndex < todayIndex;
  const isFuture = choreIndex > todayIndex;
  const isToday = choreIndex === todayIndex;

  const handleToggle = async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      const response = await fetch("/api/chores/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduleId: chore.id,
          dayOfWeek: chore.day_of_week,
          isCompleted: chore.is_completed,
        }),
      });

      if (response.ok) {
        onToggle();
      }
    } catch (error) {
      console.error("Failed to toggle chore:", error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      className={`w-full rounded-lg p-3 text-left transition-all ${
        chore.is_completed
          ? "border-2 border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900/30"
          : isOverdue
            ? "border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
            : isFuture
              ? "border-2 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700"
              : "border-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
      } hover:scale-[1.02] active:scale-[0.98] ${isToggling ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
              chore.is_completed ? "border-green-500 bg-green-500" : "border-gray-400 dark:border-gray-500"
            }`}>
            {chore.is_completed && (
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
                chore.is_completed ? "text-gray-500 line-through dark:text-gray-400" : "text-gray-900 dark:text-white"
              }`}>
              {chore.chore_name}
            </div>
            {chore.chore_description && (
              <div
                className={`mt-0.5 text-sm ${
                  chore.is_completed ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"
                }`}>
                {chore.chore_description}
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div
            className={`text-sm font-medium ${
              isOverdue && !chore.is_completed
                ? "text-red-600 dark:text-red-400"
                : chore.is_completed
                  ? "text-green-600 dark:text-green-400"
                  : "text-blue-600 dark:text-blue-400"
            }`}>
            {dayLabels[chore.day_of_week]}
          </div>
          {isOverdue && !chore.is_completed && (
            <div className="mt-0.5 text-xs text-red-500 dark:text-red-400">Overdue</div>
          )}
          {isToday && !chore.is_completed && (
            <div className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">Today</div>
          )}
          {isFuture && !chore.is_completed && (
            <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Upcoming</div>
          )}
          {chore.is_completed && chore.completed_at && (
            <div className="mt-0.5 text-xs text-green-600 dark:text-green-400">
              Done {getRelativeTime(chore.completed_at)}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
