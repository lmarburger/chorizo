"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Kid {
  name: string;
  choreCount: number;
  taskCount: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [kids, setKids] = useState<Kid[]>([]);
  const [newKidName, setNewKidName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchKids = async () => {
    try {
      // Get all kid names
      const kidsResponse = await fetch("/api/kids");
      const data = await kidsResponse.json();
      const kidNames: string[] = data.kids || [];

      // Get counts for each kid
      const kidsWithCounts: Kid[] = [];
      for (const name of kidNames) {
        const [choresResponse, tasksResponse] = await Promise.all([
          fetch(`/api/kids/${encodeURIComponent(name)}/chores`),
          fetch(`/api/kids/${encodeURIComponent(name)}/tasks`),
        ]);

        const choresData = await choresResponse.json();
        const tasksData = await tasksResponse.json();

        kidsWithCounts.push({
          name,
          choreCount: choresData.chores?.length || 0,
          taskCount: tasksData.tasks?.length || 0,
        });
      }

      setKids(kidsWithCounts);
    } catch (err) {
      console.error("Failed to fetch kids:", err);
      setError("Failed to load kids");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKids();
  }, []);

  const handleAddKid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKidName.trim()) return;

    try {
      const response = await fetch("/api/kids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKidName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add kid");
      }

      setNewKidName("");
      setError("");
      fetchKids();
    } catch (err) {
      console.error("Failed to add kid:", err);
      setError(err instanceof Error ? err.message : "Failed to add kid");
    }
  };

  const handleDeleteKid = async (kidName: string) => {
    if (!confirm(`Are you sure you want to remove ${kidName}? This will delete all their chores and tasks.`)) {
      return;
    }

    try {
      // Use the new DELETE endpoint that handles cascading deletes
      const response = await fetch(`/api/kids/${encodeURIComponent(kidName)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete kid");
      }

      // Refresh the list
      fetchKids();
    } catch (err) {
      console.error("Failed to delete kid:", err);
      setError("Failed to remove kid");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => router.push("/parents")} className="font-medium text-blue-500 hover:text-blue-600">
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <div className="w-24"></div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Manage Kids</h2>

          {/* Add new kid form */}
          <form onSubmit={handleAddKid} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newKidName}
                onChange={e => setNewKidName(e.target.value)}
                placeholder="Enter kid's name"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="submit"
                disabled={!newKidName.trim()}
                className="rounded-md bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50">
                Add Kid
              </button>
            </div>
          </form>

          {/* List of kids */}
          {loading ? (
            <p className="text-gray-500">Loading kids...</p>
          ) : kids.length === 0 ? (
            <p className="text-gray-500">No kids added yet.</p>
          ) : (
            <div className="space-y-2">
              {kids.map(kid => (
                <div
                  key={kid.name}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{kid.name}</span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      ({kid.choreCount} chores, {kid.taskCount} tasks)
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteKid(kid.name)}
                    className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Remove kid">
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
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Warning:</strong> Removing a kid will permanently delete all their chores and tasks. This action
            cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
}
