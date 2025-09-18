"use client";

import { useState, useEffect } from "react";
import { DAY_LABELS, DAYS_OF_WEEK } from "../lib/utils";

export type ScheduleEntry = {
  kid_name: string;
  days: string[];
};

interface ScheduleManagerProps {
  initialSchedules?: ScheduleEntry[];
  onSchedulesChange: (schedules: ScheduleEntry[]) => void;
}

export function ScheduleManager({ initialSchedules = [], onSchedulesChange }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>(initialSchedules);
  const [existingKidNames, setExistingKidNames] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/kids")
      .then(res => res.json())
      .then(data => {
        setExistingKidNames(data.kids || []);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    onSchedulesChange(schedules);
  }, [schedules, onSchedulesChange]);

  const allKidNames = [...new Set([...existingKidNames, ...schedules.map(s => s.kid_name)])];

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
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(index, day)}
                className={`rounded px-2 py-1 text-xs ${
                  schedule.days.includes(day)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300"
                }`}>
                {DAY_LABELS[day]}
              </button>
            ))}
          </div>
        </div>
      ))}

      {schedules.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">Click on a kid name above to start adding schedule</p>
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
  );
}
