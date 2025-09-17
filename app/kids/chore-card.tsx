'use client';

import { ChoreWithCompletion } from "../lib/db";
import { toggleChoreAction } from "./actions";

interface ChoreCardProps {
  chore: ChoreWithCompletion;
}

export function ChoreCard({ chore }: ChoreCardProps) {
  const dayLabels: Record<string, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun'
  };
  
  // Check if this is an overdue chore
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const isOverdue = chore.day_of_week !== today;
  
  return (
    <form action={toggleChoreAction}>
      <input type="hidden" name="choreId" value={chore.id} />
      <input type="hidden" name="dayOfWeek" value={chore.day_of_week} />
      <input type="hidden" name="isCompleted" value={chore.is_completed.toString()} />
      
      <button
        type="submit"
        className={`w-full text-left p-3 rounded-lg transition-all ${
          chore.is_completed
            ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700'
            : isOverdue
            ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800'
            : 'bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600'
        } hover:scale-[1.02] active:scale-[0.98]`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              chore.is_completed
                ? 'bg-green-500 border-green-500'
                : 'border-gray-400 dark:border-gray-500'
            }`}>
              {chore.is_completed && (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            
            <div>
              <div className={`font-medium ${
                chore.is_completed
                  ? 'text-gray-500 dark:text-gray-400 line-through'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {chore.name}
              </div>
              {chore.description && (
                <div className={`text-sm mt-0.5 ${
                  chore.is_completed
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {chore.description}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-sm font-medium ${
              isOverdue && !chore.is_completed
                ? 'text-red-600 dark:text-red-400'
                : chore.is_completed
                ? 'text-green-600 dark:text-green-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              {dayLabels[chore.day_of_week]}
            </div>
            {isOverdue && !chore.is_completed && (
              <div className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                Overdue
              </div>
            )}
            {chore.is_completed && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                Done!
              </div>
            )}
          </div>
        </div>
      </button>
    </form>
  );
}