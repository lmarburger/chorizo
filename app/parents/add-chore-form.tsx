"use client";

import { useState, useRef } from "react";
import { addChoreWithSchedulesAction } from "./actions";
import { FormInput, FormTextarea, FormButton } from "../components/form-components";
import { useKidNames } from "../hooks/use-kid-names";

type ScheduleEntry = {
  kid_name: string;
  days: string[];
};

interface AddChoreFormProps {
  onSuccess?: () => void;
}

export function AddChoreForm({ onSuccess }: AddChoreFormProps = {}) {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [isFixed, setIsFixed] = useState(false);
  const { kidNames: existingKidNames } = useKidNames();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    await addChoreWithSchedulesAction(formData);
    // Reset form state and inputs after successful submission
    setSchedules([]);
    setIsFixed(false);
    formRef.current?.reset();
    // Call the success callback to refresh the chore list
    onSuccess?.();
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
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Add Chore</h2>
      <div className="space-y-4">
        <FormInput name="name" id="name" label="Chore Name" required placeholder="Do the dishes" />

        <FormTextarea
          name="description"
          id="description"
          label="Description (Optional)"
          rows={2}
          placeholder="Wash, dry, and put away all dishes"
        />

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
          </div>

          {/* Schedule entries */}
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

      <FormButton
        type="submit"
        disabled={schedules.length === 0 || schedules.every(s => s.days.length === 0)}
        className="mt-4 w-full">
        Add Chore
      </FormButton>
    </form>
  );
}
