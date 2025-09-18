"use client";

import { useState, useEffect } from "react";
import { Feedback } from "../lib/db";
import { format } from "date-fns";

interface FeedbackSectionProps {
  type: "incomplete" | "completed";
}

export function FeedbackSection({ type }: FeedbackSectionProps) {
  const [incompleteFeedback, setIncompleteFeedback] = useState<Feedback[]>([]);
  const [completedFeedback, setCompletedFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    try {
      // Fetch incomplete feedback
      const incompleteRes = await fetch("/api/feedback?filter=incomplete");
      const incompleteData = await incompleteRes.json();
      setIncompleteFeedback(incompleteData.feedback || []);

      // Fetch completed feedback
      const completedRes = await fetch("/api/feedback?filter=completed");
      const completedData = await completedRes.json();
      setCompletedFeedback(completedData.feedback || []);
    } catch (error) {
      console.error("Failed to fetch feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
    // Refresh feedback every 10 seconds
    const interval = setInterval(fetchFeedback, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleFeedback = async (id: number, currentlyCompleted: boolean) => {
    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !currentlyCompleted }),
      });

      if (response.ok) {
        fetchFeedback();
      }
    } catch (error) {
      console.error("Failed to toggle feedback:", error);
    }
  };

  const handleDeleteFeedback = async (id: number) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;

    try {
      const response = await fetch(`/api/feedback/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchFeedback();
      }
    } catch (error) {
      console.error("Failed to delete feedback:", error);
    }
  };

  if (loading) {
    return null;
  }

  // Render only the requested type
  if (type === "incomplete") {
    return incompleteFeedback.length > 0 ? (
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Feedback from Kids</h2>
        <div className="space-y-3">
          {incompleteFeedback.map(feedback => (
            <div
              key={feedback.id}
              className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/30">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-white">{feedback.kid_name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(feedback.created_at), "MMM d, h:mm a")}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{feedback.message}</p>
                </div>
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => handleToggleFeedback(feedback.id, false)}
                    className="rounded-full p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                    title="Mark as read">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteFeedback(feedback.id)}
                    className="rounded-full p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    title="Delete">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : null;
  }

  // Render completed feedback
  if (type === "completed") {
    return completedFeedback.length > 0 ? (
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Feedback</h2>
        <div className="space-y-2">
          {completedFeedback.map(feedback => (
            <div
              key={feedback.id}
              className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{feedback.kid_name}</span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(feedback.created_at), "MMM d, h:mm a")}
                    </span>
                    {feedback.completed_at && (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
                        Read {format(new Date(feedback.completed_at), "MMM d")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feedback.message}</p>
                </div>
                <div className="ml-4 flex gap-1">
                  <button
                    onClick={() => handleToggleFeedback(feedback.id, true)}
                    className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    title="Mark as unread">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteFeedback(feedback.id)}
                    className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                    title="Delete">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : null;
  }

  return null;
}
