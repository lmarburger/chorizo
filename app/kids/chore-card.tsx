"use client";

import { ChoreWithCompletion } from "../lib/db";
import { toggleChoreAction } from "./actions";

interface ChoreCardProps {
  chore: ChoreWithCompletion;
}

export function ChoreCard({ chore }: ChoreCardProps) {
  const dayLabels: Record<string, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };

  // Check if this is an overdue chore
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const isOverdue = chore.day_of_week !== today;

  return (
    <form action={toggleChoreAction}>
      <input type="hidden" name="choreId" value={chore.id} />
      <input type="hidden" name="dayOfWeek" value={chore.day_of_week} />
      <input type="hidden" name="isCompleted" value={chore.is_completed.toString()} />

      <button
        type="submit"
        className={`w-full rounded-lg p-3 text-left transition-all ${
          chore.is_completed
            ? "border-2 border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900/30"
            : isOverdue
              ? "border-2 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
              : "border-2 border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700"
        } hover:scale-[1.02] active:scale-[0.98]`}>
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
                {chore.name}
              </div>
              {chore.description && (
                <div
                  className={`mt-0.5 text-sm ${
                    chore.is_completed ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"
                  }`}>
                  {chore.description}
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
            {chore.is_completed && <div className="mt-0.5 text-xs text-green-600 dark:text-green-400">Done!</div>}
          </div>
        </div>
      </button>
    </form>
  );
}
