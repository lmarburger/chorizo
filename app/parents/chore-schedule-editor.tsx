"use client";

import { DAYS_OF_WEEK, DAY_LABELS, type DayOfWeek } from "../lib/utils";

export type ScheduleEntry = {
  kid_name: string;
  days: string[];
};

interface ChoreScheduleEditorProps {
  schedules: ScheduleEntry[];
  onSchedulesChange: (schedules: ScheduleEntry[]) => void;
  kidNames: string[];
}

export function ChoreScheduleEditor({ schedules, onSchedulesChange, kidNames }: ChoreScheduleEditorProps) {
  const allKidNames = [...new Set([...kidNames, ...schedules.map(s => s.kid_name)])];

  const addKidSchedule = (kidName: string) => {
    if (!schedules.some(s => s.kid_name === kidName)) {
      const newSchedules = [...schedules, { kid_name: kidName, days: [] as string[] }];
      newSchedules.sort((a, b) => a.kid_name.localeCompare(b.kid_name));
      onSchedulesChange(newSchedules);
    }
  };

  const removeScheduleEntry = (index: number) => {
    onSchedulesChange(schedules.filter((_, i) => i !== index));
  };

  const toggleDay = (scheduleIndex: number, day: string) => {
    const updated = [...schedules];
    const schedule = updated[scheduleIndex];
    if (schedule.days.includes(day)) {
      schedule.days = schedule.days.filter(d => d !== day);
    } else {
      schedule.days = [...schedule.days, day];
    }
    onSchedulesChange(updated);
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Schedule</label>

      <div className="mb-3 flex flex-wrap gap-2">
        {allKidNames
          .filter(name => !schedules.some(s => s.kid_name === name))
          .map(kidName => (
            <button
              key={kidName}
              type="button"
              onClick={() => addKidSchedule(kidName)}
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
                {DAY_LABELS[day as DayOfWeek]}
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
  );
}
