"use client";

import { useState, useEffect } from "react";
import { format, parseISO, startOfDay } from "date-fns";

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
  allComplete: boolean;
}

export function Dashboard() {
  const [kidStatuses, setKidStatuses] = useState<KidStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Single API call to get all dashboard data
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

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading dashboard...</div>;
  }

  if (kidStatuses.length === 0) {
    return <div className="text-gray-500">No kids found. Go to Settings to add kids.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Kids' Status</h2>

      {kidStatuses.map(kid => (
        <div
          key={kid.name}
          className={`rounded-lg p-4 ${
            kid.allComplete
              ? "border-2 border-green-500 bg-green-50 dark:bg-green-900/20"
              : "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
          }`}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{kid.name}</h3>
            {kid.allComplete && (
              <span className="rounded-full bg-green-500 px-3 py-1 text-sm font-medium text-white">✓ All Done!</span>
            )}
          </div>

          {!kid.allComplete && (
            <>
              {kid.outstandingChores.length > 0 && (
                <div className="mb-3">
                  <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Outstanding Chores</h4>
                  <div className="space-y-1">
                    {kid.outstandingChores.map(chore => {
                      const today = new Date();
                      const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
                      const daysAgo = dayOfWeek - chore.day_number;
                      const isToday = daysAgo === 0;
                      const dayName = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][chore.day_number];

                      return (
                        <div
                          key={`${chore.id}-${chore.day_number}`}
                          className={`rounded px-2 py-1 text-sm ${
                            isToday
                              ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                              : "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100"
                          }`}>
                          <span className="font-medium">{chore.chore_name}</span>
                          <span className="ml-2 text-xs opacity-75">({dayName})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {kid.outstandingTasks.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Outstanding Tasks</h4>
                  <div className="space-y-1">
                    {kid.outstandingTasks.map(task => {
                      const dueDate = parseISO(task.due_date);
                      const today = startOfDay(new Date());
                      const isToday = format(dueDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
                      const isOverdue = dueDate < today;

                      return (
                        <div
                          key={task.id}
                          className={`rounded px-2 py-1 text-sm ${
                            isOverdue
                              ? "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-100"
                              : isToday
                                ? "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100"
                                : "bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100"
                          }`}>
                          <span className="font-medium">{task.title}</span>
                          <span className="ml-2 text-xs opacity-75">(due {format(dueDate, "MMM d")})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {kid.allComplete && (
            <p className="text-sm text-green-600 dark:text-green-400">
              {kid.name} has completed all chores and tasks for today and past days! 🎉
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
