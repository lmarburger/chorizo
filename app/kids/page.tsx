"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChoreCard } from "./chore-card";
import { ChoreScheduleWithCompletion } from "../lib/db";

export default function KidsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const kidName = searchParams.get("name");

  const [chores, setChores] = useState<ChoreScheduleWithCompletion[]>([]);
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

    // Fetch chores for this kid
    fetchChores();
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
  const allCaughtUp = uncompletedTodayAndPast.length === 0 && chores.length > 0;

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
            {dayLabels[today as keyof typeof dayLabels]} - {uncompletedTodayAndPast.length}{" "}
            {uncompletedTodayAndPast.length === 1 ? "chore" : "chores"} to do
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

        {chores.length === 0 ? (
          <p className="py-8 text-center text-gray-600 dark:text-gray-400">
            No chores scheduled yet. Ask a parent to add some!
          </p>
        ) : (
          <div className="space-y-2">
            {chores.map(chore => (
              <ChoreCard key={`${chore.id}-${chore.day_of_week}`} chore={chore} onToggle={fetchChores} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
