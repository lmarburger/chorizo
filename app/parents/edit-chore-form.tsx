"use client";

import { useState } from "react";
import { ChoreWithSchedules } from "../lib/db";
import { updateChoreWithSchedulesAction } from "./actions";
import { ChoreScheduleEditor, type ScheduleEntry } from "./chore-schedule-editor";

interface EditChoreFormProps {
  chore: ChoreWithSchedules;
  kidNames: string[];
  onCancel: () => void;
  onSuccess?: () => void;
}

export function EditChoreForm({ chore, kidNames: existingKidNames, onCancel, onSuccess }: EditChoreFormProps) {
  const initialSchedules: ScheduleEntry[] = [];
  const scheduleMap = new Map<string, string[]>();

  chore.schedules.forEach(schedule => {
    if (!scheduleMap.has(schedule.kid_name)) {
      scheduleMap.set(schedule.kid_name, []);
    }
    scheduleMap.get(schedule.kid_name)!.push(schedule.day_of_week);
  });

  const sortedKidNames = Array.from(scheduleMap.keys()).sort((a, b) => a.localeCompare(b));
  sortedKidNames.forEach(kid_name => {
    initialSchedules.push({ kid_name, days: scheduleMap.get(kid_name)! });
  });

  const [schedules, setSchedules] = useState<ScheduleEntry[]>(initialSchedules);
  const [isFixed, setIsFixed] = useState(!chore.flexible);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    try {
      await updateChoreWithSchedulesAction(formData);
      if (onSuccess) {
        onSuccess();
      } else {
        onCancel();
      }
    } catch {
      setError("Failed to save changes. Try again.");
    }
  };

  return (
    <form action={handleSubmit} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Edit Chore</h3>

      <input type="hidden" name="choreId" value={chore.id} />

      <div className="space-y-4">
        <div>
          <label
            htmlFor={`name-${chore.id}`}
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Chore Name
          </label>
          <input
            type="text"
            id={`name-${chore.id}`}
            name="name"
            defaultValue={chore.name}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor={`description-${chore.id}`}
            className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description (Optional)
          </label>
          <textarea
            id={`description-${chore.id}`}
            name="description"
            defaultValue={chore.description || ""}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isFixed}
              onChange={e => setIsFixed(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🔒 Fixed</span>
          </label>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isFixed ? "Must be done on scheduled day" : "Can be done any day during the week"}
          </span>
          <input type="hidden" name="flexible" value={isFixed ? "false" : "true"} />
        </div>

        <ChoreScheduleEditor schedules={schedules} onSchedulesChange={setSchedules} kidNames={existingKidNames} />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-md bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600">
          Save Changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-md bg-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-400">
          Cancel
        </button>
      </div>
    </form>
  );
}
