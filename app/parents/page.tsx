"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "./dashboard";
import { ChoreList } from "./chore-list";
import { AddChoreForm } from "./add-chore-form";
import { AddTaskForm } from "./add-task-form";

export default function ParentsPage() {
  const router = useRouter();

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
          <button onClick={handleSwitchUser} className="font-medium text-blue-500 hover:text-blue-600">
            Switch User
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parent Dashboard</h1>
          <div className="w-20"></div>
        </div>

        {/* Dashboard showing kids' status */}
        <Dashboard />

        {/* Divider */}
        <hr className="my-8 border-gray-300 dark:border-gray-600" />

        {/* Task Management */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Add Task</h2>
          <AddTaskForm />
        </div>

        {/* Divider */}
        <hr className="my-8 border-gray-300 dark:border-gray-600" />

        {/* Chore Management */}
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Chores</h2>
          <AddChoreForm />
          <div className="mt-6">
            <ChoreList />
          </div>
        </div>

        {/* Settings link at the bottom */}
        <div className="mt-12 border-t border-gray-300 pt-8 dark:border-gray-600">
          <button
            onClick={() => router.push("/settings")}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
            Settings (Manage Kids)
          </button>
        </div>
      </div>
    </div>
  );
}
