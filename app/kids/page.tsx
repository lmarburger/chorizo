"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChoreCard } from "./chore-card";
import { TaskCard } from "./task-card";
import { ChoreScheduleWithCompletion, Task } from "../lib/db";

export default function KidsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const kidName = searchParams.get("name");

  const [chores, setChores] = useState<ChoreScheduleWithCompletion[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChores = () => {
    if (kidName) {
      fetch(`/api/kids/${encodeURIComponent(kidName)}/chores`)
        .then(res => res.json())
        .then(data => {
          setChores(data.chores || []);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  };

  const fetchTasks = () => {
    if (kidName) {
      fetch(`/api/kids/${encodeURIComponent(kidName)}/tasks`)
        .then(res => res.json())
        .then(data => {
          setTasks(data.tasks || []);
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    // Check if we have a valid kid name
    if (!kidName) {
      // Check localStorage for saved preference
      const storedUser = localStorage.getItem("selectedUser");
      const storedUserType = localStorage.getItem("userType");

      if (storedUserType === "kid" && storedUser) {
        router.push(`/kids?name=${encodeURIComponent(storedUser)}`);
      } else {
        router.push("/");
      }
      return;
    }

    // Fetch chores and tasks for this kid
    fetchChores();
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kidName, router]);

  // Get today's day name
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const dayLabels: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  const handleSwitchUser = () => {
    localStorage.removeItem("selectedUser");
    localStorage.removeItem("userType");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading chores...</p>
      </div>
    );
  }

  // Calculate chore status
  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const todayIndex = dayOrder.indexOf(today);

  const todayAndPastChores = chores.filter(chore => {
    const choreIndex = dayOrder.indexOf(chore.day_of_week);
    return choreIndex <= todayIndex;
  });

  const uncompletedTodayAndPast = todayAndPastChores.filter(c => !c.is_completed);

  // Check uncompleted tasks that are due today or overdue
  const today2 = new Date();
  today2.setHours(0, 0, 0, 0);
  const uncompletedTasks = tasks.filter(t => {
    if (t.completed_at) return false;
    const dueDate = new Date(t.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= today2;
  });

  const allCaughtUp =
    uncompletedTodayAndPast.length === 0 && uncompletedTasks.length === 0 && (chores.length > 0 || tasks.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={handleSwitchUser} className="font-medium text-blue-500 hover:text-blue-600">
            Switch User
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{kidName}'s Chores</h1>
          <div className="w-20"></div>
        </div>

        {!allCaughtUp && (
          <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
            {dayLabels[today as keyof typeof dayLabels]} - {uncompletedTodayAndPast.length + uncompletedTasks.length}{" "}
            {uncompletedTodayAndPast.length + uncompletedTasks.length === 1 ? "item" : "items"} to do
          </p>
        )}

        {allCaughtUp && (
          <div className="mb-6 rounded-lg border-2 border-green-300 bg-green-100 p-4 text-center dark:border-green-700 dark:bg-green-900/30">
            <div className="mb-2 text-2xl">🎉</div>
            <p className="text-lg font-semibold text-green-800 dark:text-green-200">Great job, {kidName}!</p>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              You're all done for today! Feel free to relax or get ahead on tomorrow's chores.
            </p>
          </div>
        )}

        {chores.length === 0 && tasks.length === 0 ? (
          <p className="py-8 text-center text-gray-600 dark:text-gray-400">
            No chores or tasks scheduled yet. Ask a parent to add some!
          </p>
        ) : (
          <div className="space-y-2">
            {/* Mix tasks and chores together, sorted by completion status and time */}
            {(() => {
              // Create a unified list of items with type information
              const allItems: Array<{
                type: "task" | "chore";
                item: Task | ChoreScheduleWithCompletion;
                isCompleted: boolean;
                completedAt?: Date;
                sortOrder: number;
              }> = [];

              // Helper to determine if a task is current/overdue
              const isTaskCurrentOrOverdue = (task: Task): boolean => {
                if (task.completed_at) return false;
                const dueDate = new Date(task.due_date);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate <= today2;
              };

              // Helper to determine if a chore is current/overdue
              const isChoreCurrentOrOverdue = (chore: ChoreScheduleWithCompletion): boolean => {
                if (chore.is_completed) return false;
                const choreIndex = dayOrder.indexOf(chore.day_of_week);
                return choreIndex <= todayIndex;
              };

              // Add tasks with proper categorization
              tasks.forEach(task => {
                let sortOrder: number;
                if (task.completed_at) {
                  sortOrder = 5; // Completed
                } else if (isTaskCurrentOrOverdue(task)) {
                  sortOrder = 1; // Current/overdue task
                } else {
                  sortOrder = 3; // Upcoming task
                }

                allItems.push({
                  type: "task",
                  item: task,
                  isCompleted: !!task.completed_at,
                  completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
                  sortOrder,
                });
              });

              // Add chores with proper categorization
              chores.forEach(chore => {
                let sortOrder: number;
                if (chore.is_completed) {
                  sortOrder = 5; // Completed
                } else if (isChoreCurrentOrOverdue(chore)) {
                  sortOrder = 2; // Current/overdue chore
                } else {
                  sortOrder = 4; // Upcoming chore
                }

                allItems.push({
                  type: "chore",
                  item: chore,
                  isCompleted: chore.is_completed,
                  completedAt: chore.completed_at ? new Date(chore.completed_at) : undefined,
                  sortOrder,
                });
              });

              // Sort according to the specified order:
              // 1. Uncompleted tasks for today or past (sortOrder = 1)
              // 2. Uncompleted chores for today or past (sortOrder = 2)
              // 3. Upcoming uncompleted tasks (sortOrder = 3)
              // 4. Upcoming uncompleted chores (sortOrder = 4)
              // 5. All completed items (sortOrder = 5)
              allItems.sort((a, b) => {
                // First sort by category (sortOrder)
                if (a.sortOrder !== b.sortOrder) {
                  return a.sortOrder - b.sortOrder;
                }

                // Within completed items (sortOrder === 5), sort by completion time (most recent first)
                if (a.sortOrder === 5 && a.completedAt && b.completedAt) {
                  return b.completedAt.getTime() - a.completedAt.getTime();
                }

                // Within other categories, maintain original order
                return 0;
              });

              return allItems.map(({ type, item }) => {
                if (type === "task") {
                  const task = item as Task;
                  return (
                    <TaskCard
                      key={`task-${task.id}`}
                      task={task}
                      onToggle={() => {
                        fetchTasks();
                        fetchChores();
                      }}
                    />
                  );
                } else {
                  const chore = item as ChoreScheduleWithCompletion;
                  return (
                    <ChoreCard
                      key={`chore-${chore.id}-${chore.day_of_week}`}
                      chore={chore}
                      onToggle={() => {
                        fetchChores();
                        fetchTasks();
                      }}
                    />
                  );
                }
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
