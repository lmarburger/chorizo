"use client";

import { useState, useRef } from "react";
import { addChoreWithSchedulesAction } from "./actions";

interface AddChoreFormProps {
  kidNames: string[];
}

type ScheduleEntry = {
  kid_name: string;
  days: string[];
};

export function AddChoreForm({ kidNames: existingKidNames }: AddChoreFormProps) {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [newKidName, setNewKidName] = useState("");
  const [showNewKidInput, setShowNewKidInput] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    await addChoreWithSchedulesAction(formData);
    // Reset form state and inputs after successful submission
    setSchedules([]);
    setNewKidName("");
    setShowNewKidInput(false);
    formRef.current?.reset();
  };

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

  return (
    <form ref={formRef} action={handleSubmit} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Add New Chore</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Chore Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Do the dishes"
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Wash, dry, and put away all dishes"
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

          {schedules.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click on a kid name above to start adding schedule
            </p>
          )}

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

      <button
        type="submit"
        disabled={schedules.length === 0 || schedules.every(s => s.days.length === 0)}
        className="mt-4 w-full rounded-md bg-blue-500 px-4 py-2 font-medium text-white hover:bg-blue-600 disabled:opacity-50">
        Add Chore
      </button>
    </form>
  );
}
