"use client";

import { useState, useRef, useEffect } from "react";

interface AddTaskFormProps {
  onSuccess?: () => void;
}

export function AddTaskForm({ onSuccess }: AddTaskFormProps = {}) {
  const [existingKidNames, setExistingKidNames] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch("/api/kids")
      .then(res => res.json())
      .then(data => {
        setExistingKidNames(data.kids || []);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const kidName = formData.get("kid_name");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description") || null,
          kid_name: kidName,
          due_date: formData.get("due_date"),
        }),
      });

      if (response.ok) {
        formRef.current?.reset();

        // Trigger a refresh of the task list and dashboard
        onSuccess?.();
      }
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Get tomorrow's date as the default due date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDueDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Add One-Time Task</h2>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Task Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Pack for trip"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description (optional)
          </label>
          <textarea
            name="description"
            id="description"
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Any details about the task"
          />
        </div>

        <div>
          <label htmlFor="kid_name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Assign to
          </label>
          <select
            name="kid_name"
            id="kid_name"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            <option value="">Select a kid</option>
            {existingKidNames.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="due_date" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Due Date
          </label>
          <input
            type="date"
            name="due_date"
            id="due_date"
            required
            defaultValue={defaultDueDate}
            className="box-border w-full max-w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
            {submitting ? "Adding..." : "Add Task"}
          </button>
        </div>
      </form>
    </div>
  );
}
