"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChoreCard } from "./chore-card";
import { TaskCard } from "./task-card";
import { ChoreScheduleWithCompletion, Task } from "../lib/db";
import { createSortableItems, sortItems } from "../lib/sorting";

export default function KidsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const kidName = searchParams.get("name");

  const [chores, setChores] = useState<ChoreScheduleWithCompletion[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

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
    if (!kidName) {
      const storedUser = localStorage.getItem("selectedUser");
      const storedUserType = localStorage.getItem("userType");

      if (storedUserType === "kid" && storedUser) {
        router.push(`/kids?name=${encodeURIComponent(storedUser)}`);
      } else {
        router.push("/");
      }
      return;
    }

    fetchChores();
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kidName, router]);

  const handleSwitchUser = () => {
    localStorage.removeItem("selectedUser");
    localStorage.removeItem("userType");
    router.push("/");
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim() || !kidName) return;

    setSubmittingFeedback(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kid_name: kidName,
          message: feedbackMessage.trim(),
        }),
      });

      if (response.ok) {
        setFeedbackMessage("");
        setShowFeedback(false);
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading chores...</p>
      </div>
    );
  }

  // Calculate if all caught up
  const sortableItems = createSortableItems(chores, tasks);
  const uncompletedCurrentItems = sortableItems.filter(
    item => !item.isCompleted && (item.status === "overdue" || item.status === "today")
  );

  const allCaughtUp = uncompletedCurrentItems.length === 0 && (chores.length > 0 || tasks.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleSwitchUser}
            className="rounded-full p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            title="Switch User">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{kidName}</h1>
          <button
            onClick={() => setShowFeedback(true)}
            className="rounded-full p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            title="Send Feedback">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </button>
        </div>

        {showFeedback && (
          <div className="mb-6 rounded-lg border border-blue-300 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/30">
            <div className="mb-3">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Got an idea or suggestion? Tell me!
              </label>
              <textarea
                value={feedbackMessage}
                onChange={e => setFeedbackMessage(e.target.value)}
                placeholder="Type your message here..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                rows={3}
                disabled={submittingFeedback}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmitFeedback}
                disabled={!feedbackMessage.trim() || submittingFeedback}
                className="flex-1 rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
                {submittingFeedback ? "Sending..." : "Send"}
              </button>
              <button
                onClick={() => {
                  setShowFeedback(false);
                  setFeedbackMessage("");
                }}
                disabled={submittingFeedback}
                className="flex-1 rounded-md bg-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </div>
        )}

        {allCaughtUp && (
          <div className="mb-6 rounded-lg border-2 border-green-300 bg-green-100 p-4 text-center dark:border-green-700 dark:bg-green-900/30">
            <div className="mb-2 text-2xl">🎉</div>
            <p className="text-lg font-semibold text-green-800 dark:text-green-200">Great job, {kidName}!</p>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              You're all done for today! Go relax or get ahead on tomorrow if you want.
            </p>
          </div>
        )}

        {chores.length === 0 && tasks.length === 0 ? (
          <p className="py-8 text-center text-gray-600 dark:text-gray-400">
            No chores or tasks scheduled yet. I'll add some soon!
          </p>
        ) : (
          <div className="space-y-2">
            {(() => {
              const sortableItems = createSortableItems(chores, tasks);
              const sortedItems = sortItems(sortableItems);

              return sortedItems.map(item => {
                if (item.type === "task") {
                  const task = item.data as Task;
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
                  const chore = item.data as ChoreScheduleWithCompletion;
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
