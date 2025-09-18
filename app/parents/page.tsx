"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "./dashboard";
import { ChoreList } from "./chore-list";
import { AddChoreForm } from "./add-chore-form";
import { AddTaskForm } from "./add-task-form";
import { FeedbackSection } from "./feedback-section";

export default function ParentsPage() {
  const router = useRouter();
  const [choreListKey, setChoreListKey] = useState(0);
  const [dashboardKey, setDashboardKey] = useState(0);

  const refreshData = useCallback(() => {
    setChoreListKey(prev => prev + 1);
    setDashboardKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    // Check if user is supposed to be here
    const storedUserType = localStorage.getItem("userType");
    if (storedUserType !== "parent") {
      // If not a parent, check if they have a preference
      const storedUser = localStorage.getItem("selectedUser");
      if (storedUser && storedUserType === "kid") {
        router.push(`/kids?name=${encodeURIComponent(storedUser)}`);
      } else {
        router.push("/");
      }
    }
  }, [router]);

  const handleSwitchUser = () => {
    localStorage.removeItem("selectedUser");
    localStorage.removeItem("userType");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleSwitchUser}
            className="rounded-full p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            title="Switch User">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parent Dashboard</h1>
          <div className="w-20"></div>
        </div>

        {/* Incomplete feedback at the top */}
        <FeedbackSection type="incomplete" />

        {/* Dashboard showing kids' status */}
        <Dashboard key={dashboardKey} />

        {/* Divider */}
        <hr className="my-8 border-gray-300 dark:border-gray-600" />

        {/* Chore Schedule */}
        <div className="mt-8">
          <ChoreList key={choreListKey} />
        </div>

        {/* Divider */}
        <hr className="my-8 border-gray-300 dark:border-gray-600" />

        {/* Add One-Time Task */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Add One-Time Task</h2>
          <AddTaskForm onSuccess={refreshData} />
        </div>

        {/* Divider */}
        <hr className="my-8 border-gray-300 dark:border-gray-600" />

        {/* Add Chore */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Add Chore</h2>
          <AddChoreForm onSuccess={refreshData} />
        </div>

        {/* Divider before completed feedback */}
        <hr className="my-8 border-gray-300 dark:border-gray-600" />

        {/* Completed feedback at the bottom */}
        <FeedbackSection type="completed" />

        {/* Settings link at the bottom */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => router.push("/settings")}
            className="rounded-full bg-gray-200 p-3 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            title="Settings">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
