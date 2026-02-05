"use client";

import { ChoreWithSchedules } from "../lib/db";
import { deleteChoreAction } from "./actions";
import { EditChoreForm } from "./edit-chore-form";
import { useState, useEffect } from "react";
import { DAYS_OF_WEEK, DAY_LABELS, type DayOfWeek } from "../lib/utils";

export function ChoreList() {
  const [editingChoreId, setEditingChoreId] = useState<number | null>(null);
  const [chores, setChores] = useState<ChoreWithSchedules[]>([]);
  const [kidNames, setKidNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    try {
      const [choresRes, kidsRes] = await Promise.all([
        fetch("/api/chores").then(res => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        }),
        fetch("/api/kids").then(res => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        }),
      ]);
      setChores(choresRes.chores || []);
      setKidNames(kidsRes.kids || []);
      setError(false);
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sort chores by name
  const sortedChores = [...chores].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      {sortedChores.map(chore => {
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
            <EditChoreForm
              key={chore.id}
              chore={chore}
              kidNames={kidNames}
              onCancel={() => setEditingChoreId(null)}
              onSuccess={() => {
                setEditingChoreId(null);
                fetchData(); // Refresh the list after editing
              }}
            />
          );
        }

        return (
          <div key={chore.id} className="relative rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="absolute top-4 right-4 flex gap-1">
              <button
                onClick={() => setEditingChoreId(chore.id)}
                className="rounded p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700"
                title="Edit chore">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <form
                action={async formData => {
                  if (
                    !confirm(
                      `Are you sure you want to delete "${chore.name}"? This will also remove all schedules and completion history for this chore.`
                    )
                  ) {
                    return;
                  }
                  await deleteChoreAction(formData);
                  fetchData(); // Refresh the list after deletion
                }}>
                <input type="hidden" name="choreId" value={chore.id} />
                <button
                  type="submit"
                  className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-gray-700"
                  title="Delete chore">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </form>
            </div>

            <div className="pr-16">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {chore.name}
                {!chore.flexible && (
                  <span className="ml-1" title="Fixed - must be done on scheduled day">
                    🔒
                  </span>
                )}
              </h3>
            </div>
            {chore.description && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{chore.description}</p>}

            <div className="mt-3">
              <div className="grid grid-cols-7 gap-0 text-xs">
                {DAYS_OF_WEEK.map((day, index) => {
                  const kids = scheduleByDay[day] || [];
                  return (
                    <div
                      key={day}
                      className={`min-w-0 text-center ${index > 0 ? "border-l border-gray-300 dark:border-gray-600" : ""}`}>
                      <div className="font-medium text-gray-700 dark:text-gray-300">{DAY_LABELS[day as DayOfWeek]}</div>
                      {kids.length > 0 ? (
                        <div className="mt-1 flex flex-col items-center space-y-1">
                          {kids.map((kid, idx) => (
                            <div
                              key={`${day}-${kid}-${idx}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {kid.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-1">&nbsp;</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {loading ? (
        <p className="py-8 text-center text-gray-600 dark:text-gray-400">Loading chores...</p>
      ) : error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
          Failed to load chores. Try refreshing the page.
        </div>
      ) : chores.length === 0 ? (
        <p className="py-8 text-center text-gray-600 dark:text-gray-400">
          No chores created yet. Add a chore to get started!
        </p>
      ) : null}
    </div>
  );
}
