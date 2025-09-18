"use client";

import { ChoreWithSchedules } from "../lib/db";
import { deleteChoreAction } from "./actions";
import { EditChoreForm } from "./edit-chore-form";
import { useState } from "react";

interface ChoreListProps {
  chores: ChoreWithSchedules[];
  kidNames: string[];
}

export function ChoreList({ chores, kidNames }: ChoreListProps) {
  const [editingChoreId, setEditingChoreId] = useState<number | null>(null);

  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const dayLabels = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Chores</h2>

      {chores.map(chore => {
        const scheduleByDay: Record<string, string[]> = {};

        // Group schedules by day
        chore.schedules.forEach(schedule => {
          if (!scheduleByDay[schedule.day_of_week]) {
            scheduleByDay[schedule.day_of_week] = [];
          }
          scheduleByDay[schedule.day_of_week].push(schedule.kid_name);
        });

        if (editingChoreId === chore.id) {
          return (
            <EditChoreForm key={chore.id} chore={chore} kidNames={kidNames} onCancel={() => setEditingChoreId(null)} />
          );
        }

        return (
          <div key={chore.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{chore.name}</h3>
                {chore.description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{chore.description}</p>
                )}

                {chore.schedules.length > 0 ? (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Schedule:</p>
                    <div className="grid grid-cols-7 gap-2 text-xs">
                      {dayOrder.map(day => {
                        const kids = scheduleByDay[day] || [];
                        return (
                          <div key={day} className="text-center">
                            <div className="font-medium text-gray-700 dark:text-gray-300">
                              {dayLabels[day as keyof typeof dayLabels]}
                            </div>
                            {kids.length > 0 ? (
                              <div className="mt-1 space-y-1">
                                {kids.map((kid, idx) => (
                                  <div
                                    key={`${day}-${kid}-${idx}`}
                                    className="rounded bg-blue-100 px-1 py-0.5 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                    {kid}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-1 text-gray-400">-</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-500 italic dark:text-gray-400">No schedule set</p>
                )}
              </div>

              <div className="ml-4 flex gap-2">
                <button
                  onClick={() => setEditingChoreId(chore.id)}
                  className="rounded px-3 py-1 text-sm font-medium text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700">
                  Edit
                </button>
                <form action={deleteChoreAction}>
                  <input type="hidden" name="choreId" value={chore.id} />
                  <button
                    type="submit"
                    className="rounded px-3 py-1 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-gray-700">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          </div>
        );
      })}

      {chores.length === 0 && (
        <p className="py-8 text-center text-gray-600 dark:text-gray-400">
          No chores created yet. Add a chore to get started!
        </p>
      )}
    </div>
  );
}
