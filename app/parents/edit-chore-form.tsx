"use client";

import { useState } from "react";
import { ChoreWithSchedules } from "../lib/db";
import { updateChoreWithSchedulesAction } from "./actions";

interface EditChoreFormProps {
  chore: ChoreWithSchedules;
  kidNames: string[];
  onCancel: () => void;
}

type ScheduleEntry = {
  kid_name: string;
  days: string[];
};

export function EditChoreForm({ chore, kidNames: existingKidNames, onCancel }: EditChoreFormProps) {
  // Initialize schedules from existing chore schedules
  const initialSchedules: ScheduleEntry[] = [];
  const scheduleMap = new Map<string, string[]>();

  chore.schedules.forEach(schedule => {
    if (!scheduleMap.has(schedule.kid_name)) {
      scheduleMap.set(schedule.kid_name, []);
    }
    scheduleMap.get(schedule.kid_name)!.push(schedule.day_of_week);
  });

  scheduleMap.forEach((days, kid_name) => {
    initialSchedules.push({ kid_name, days });
  });

  const [schedules, setSchedules] = useState<ScheduleEntry[]>(initialSchedules);
  const [newKidName, setNewKidName] = useState("");
  const [showNewKidInput, setShowNewKidInput] = useState(false);

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

  const addScheduleEntry = () => {
    if (showNewKidInput && newKidName) {
      setSchedules([...schedules, { kid_name: newKidName, days: [] }]);
      setNewKidName("");
      setShowNewKidInput(false);
    }
  };

  const addExistingKidSchedule = (kidName: string) => {
    if (!schedules.some(s => s.kid_name === kidName)) {
      setSchedules([...schedules, { kid_name: kidName, days: [] }]);
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
    onCancel(); // Close the form after successful save
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

          {/* Add kid buttons */}
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
            {!showNewKidInput && (
              <button
                type="button"
                onClick={() => setShowNewKidInput(true)}
                className="rounded-md bg-green-100 px-3 py-1 text-sm text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800">
                + New Kid
              </button>
            )}
          </div>

          {/* New kid input */}
          {showNewKidInput && (
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                value={newKidName}
                onChange={e => setNewKidName(e.target.value)}
                placeholder="Kid's name"
                className="flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={addScheduleEntry}
                disabled={!newKidName}
                className="rounded-md bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600 disabled:opacity-50">
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewKidInput(false);
                  setNewKidName("");
                }}
                className="rounded-md bg-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-400">
                Cancel
              </button>
            </div>
          )}

          {/* Schedule entries */}
          {schedules.map((schedule, index) => (
            <div key={index} className="mb-3 rounded border border-gray-200 p-3 dark:border-gray-600">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">{schedule.kid_name}</span>
                <button
                  type="button"
                  onClick={() => removeScheduleEntry(index)}
                  className="text-sm text-red-500 hover:text-red-600">
                  Remove
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

          {/* Hidden inputs for form submission */}
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
