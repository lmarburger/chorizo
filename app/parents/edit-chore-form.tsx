"use client";

import { useState } from "react";
import { ChoreWithSchedules } from "../lib/db";
import { updateChoreWithSchedulesAction } from "./actions";

interface EditChoreFormProps {
  chore: ChoreWithSchedules;
  kidNames: string[];
  onCancel: () => void;
  onSuccess?: () => void;
}

type ScheduleEntry = {
  kid_name: string;
  days: string[];
};

export function EditChoreForm({ chore, kidNames: existingKidNames, onCancel, onSuccess }: EditChoreFormProps) {
  // Initialize schedules from existing chore schedules
  const initialSchedules: ScheduleEntry[] = [];
  const scheduleMap = new Map<string, string[]>();

  chore.schedules.forEach(schedule => {
    if (!scheduleMap.has(schedule.kid_name)) {
      scheduleMap.set(schedule.kid_name, []);
    }
    scheduleMap.get(schedule.kid_name)!.push(schedule.day_of_week);
  });

  // Sort kid names alphabetically before creating schedule entries
  const sortedKidNames = Array.from(scheduleMap.keys()).sort((a, b) => a.localeCompare(b));
  sortedKidNames.forEach(kid_name => {
    initialSchedules.push({ kid_name, days: scheduleMap.get(kid_name)! });
  });

  const [schedules, setSchedules] = useState<ScheduleEntry[]>(initialSchedules);

  const allKidNames = [...new Set([...existingKidNames, ...schedules.map(s => s.kid_name)])];

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const dayLabels: Record<string, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };

  const addExistingKidSchedule = (kidName: string) => {
    if (!schedules.some(s => s.kid_name === kidName)) {
      const newSchedules = [...schedules, { kid_name: kidName, days: [] }];
      // Sort alphabetically by kid name
      newSchedules.sort((a, b) => a.kid_name.localeCompare(b.kid_name));
      setSchedules(newSchedules);
    }
  };

  const removeScheduleEntry = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const toggleDay = (scheduleIndex: number, day: string) => {
    const updated = [...schedules];
    const schedule = updated[scheduleIndex];
    if (schedule.days.includes(day)) {
      schedule.days = schedule.days.filter(d => d !== day);
    } else {
      schedule.days = [...schedule.days, day];
    }
    setSchedules(updated);
  };

  const handleSubmit = async (formData: FormData) => {
    await updateChoreWithSchedulesAction(formData);
    if (onSuccess) {
      onSuccess(); // This will close the form and refresh the data
    } else {
      onCancel(); // Fallback to just closing the form
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

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Schedule</label>

          <div className="mb-3 flex flex-wrap gap-2">
            {allKidNames
              .filter(name => !schedules.some(s => s.kid_name === name))
              .map(kidName => (
                <button
                  key={kidName}
                  type="button"
                  onClick={() => addExistingKidSchedule(kidName)}
                  className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500">
                  + {kidName}
                </button>
              ))}
          </div>

          {schedules.map((schedule, index) => (
            <div key={index} className="mb-3 rounded border border-gray-200 p-3 dark:border-gray-600">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">{schedule.kid_name}</span>
                <button
                  type="button"
                  onClick={() => removeScheduleEntry(index)}
                  className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Remove schedule">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {days.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(index, day)}
                    className={`rounded px-2 py-1 text-xs ${
                      schedule.days.includes(day)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300"
                    }`}>
                    {dayLabels[day]}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {schedules.map((schedule, schedIdx) =>
            schedule.days.map((day, dayIdx) => (
              <input
                key={`${schedIdx}-${dayIdx}`}
                type="hidden"
                name="schedules"
                value={JSON.stringify({ kid_name: schedule.kid_name, day_of_week: day })}
              />
            ))
          )}
        </div>
      </div>

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
