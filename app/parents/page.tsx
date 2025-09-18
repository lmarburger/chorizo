"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChoreList } from "./chore-list";
import { AddChoreForm } from "./add-chore-form";

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Chores</h1>
          <div className="w-20"></div>
        </div>

        <AddChoreForm />

        <div className="mt-8">
          <ChoreList />
        </div>
      </div>
    </div>
  );
}
