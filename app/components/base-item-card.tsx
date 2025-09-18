"use client";

import { useState } from "react";
import { getRelativeTime, getDayAbbreviation } from "../lib/utils";

export interface BaseItemCardProps {
  id: number | string;
  title: string;
  description?: string | null;
  dayOrDate: string; // Either day of week or due date
  isCompleted: boolean;
  completedAt?: Date | null;
  isOverdue: boolean;
  isFuture: boolean;
  onToggle: () => void;
  toggleEndpoint: string;
  toggleBody: Record<string, unknown>;
}

/**
 * Base reusable card component for both chores and tasks
 * Provides consistent UI and behavior across item types
 */
export function BaseItemCard({
  title,
  description,
  dayOrDate,
  isCompleted,
  completedAt,
  isOverdue,
  isFuture,
  onToggle,
  toggleEndpoint,
  toggleBody,
}: BaseItemCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      const response = await fetch(toggleEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toggleBody),
      });

      if (response.ok) {
        onToggle();
      }
    } catch (error) {
      console.error("Failed to toggle item:", error);
    } finally {
      setIsToggling(false);
    }
  };

  // Determine the color scheme based on status
  const getColorClasses = () => {
    if (isCompleted) {
      return "border-2 border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900/30";
    }
    if (isOverdue) {
      return "border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20";
    }
    if (isFuture) {
      return "border-2 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700";
    }
    // Today/current
    return "border-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20";
  };

  const getTextColor = () => {
    if (isOverdue && !isCompleted) {
      return "text-red-600 dark:text-red-400";
    }
    if (isCompleted) {
      return "text-green-600 dark:text-green-400";
    }
    if (isFuture) {
      return "text-gray-600 dark:text-gray-400";
    }
    return "text-blue-600 dark:text-blue-400";
  };

  // Format the day/date display
  const dayDisplay = dayOrDate.includes("-") ? getDayAbbreviation(dayOrDate) : dayOrDate;

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      className={`w-full rounded-lg p-3 text-left transition-all ${getColorClasses()} hover:scale-[1.02] active:scale-[0.98] ${
        isToggling ? "opacity-50" : ""
      }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
              isCompleted ? "border-green-500 bg-green-500" : "border-gray-400 dark:border-gray-500"
            }`}>
            {isCompleted && (
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
                isCompleted ? "text-gray-500 line-through dark:text-gray-400" : "text-gray-900 dark:text-white"
              }`}>
              {title}
            </div>
            {description && (
              <div
                className={`mt-0.5 text-sm ${
                  isCompleted ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"
                }`}>
                {description}
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className={`text-sm font-medium ${getTextColor()}`}>{dayDisplay}</div>
          {isCompleted && completedAt && (
            <div className="mt-0.5 text-xs text-green-600 dark:text-green-400">Done {getRelativeTime(completedAt)}</div>
          )}
        </div>
      </div>
    </button>
  );
}
