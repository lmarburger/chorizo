"use client";

import { useState } from "react";
import { getDayAbbreviation } from "../lib/utils";

export interface BaseItemCardProps {
  id: number | string;
  title: string;
  description?: string | null;
  dayOrDate: string; // Either day of week or due date
  isCompleted: boolean;
  isOverdue: boolean;
  isFuture: boolean;
  isDisabled?: boolean; // True for future fixed chores that can't be completed early
  isLateCompletion?: boolean; // True for fixed chores completed after their scheduled day
  isExcused?: boolean; // True if the item was excused by parent
  isFixed?: boolean; // True for fixed chores (must be done on scheduled day)
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
  isOverdue,
  isFuture,
  isDisabled,
  isLateCompletion,
  isExcused,
  isFixed,
  onToggle,
  toggleEndpoint,
  toggleBody,
}: BaseItemCardProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (isToggling || isDisabled) return;

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
      if (isDisabled) {
        return "border-2 border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700";
      }
      return "border-2 border-gray-300 bg-white dark:border-gray-500 dark:bg-gray-800";
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
      if (isDisabled) {
        return "text-gray-400 dark:text-gray-500";
      }
      return "text-gray-600 dark:text-gray-400";
    }
    return "text-blue-600 dark:text-blue-400";
  };

  // Format the day/date display
  const dayDisplay = dayOrDate.includes("-") ? getDayAbbreviation(dayOrDate) : dayOrDate;

  const getCheckboxClasses = () => {
    if (isCompleted) return "border-green-500 bg-green-500";
    if (isDisabled) return "border-gray-300 dark:border-gray-600";
    return "border-gray-400 dark:border-gray-500";
  };

  const getTitleClasses = () => {
    if (isCompleted) return "text-gray-500 line-through dark:text-gray-400";
    if (isDisabled) return "text-gray-400 dark:text-gray-500";
    return "text-gray-900 dark:text-white";
  };

  const getDescriptionClasses = () => {
    if (isCompleted || isDisabled) return "text-gray-400 dark:text-gray-500";
    return "text-gray-600 dark:text-gray-400";
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling || isDisabled}
      className={`w-full rounded-lg p-3 text-left transition-all ${getColorClasses()} ${
        isDisabled ? "cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
      } ${isToggling ? "opacity-50" : ""}`}>
      <div className="flex gap-3">
        <div
          className={`flex size-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${getCheckboxClasses()}`}>
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

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className={`font-medium ${getTitleClasses()}`}>
              {title}
              {isFixed && (
                <span className="ml-1" title="Fixed - must be done on scheduled day">
                  🔒
                </span>
              )}
              {isCompleted &&
                isLateCompletion &&
                (isExcused ? (
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/50 dark:text-green-300">
                    Excused
                  </span>
                ) : (
                  <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                    Late
                  </span>
                ))}
            </div>
            <div className={`ml-2 text-sm font-medium ${getTextColor()}`}>{dayDisplay}</div>
          </div>
          {description && <div className={`mt-1 text-sm ${getDescriptionClasses()}`}>{description}</div>}
        </div>
      </div>
    </button>
  );
}
