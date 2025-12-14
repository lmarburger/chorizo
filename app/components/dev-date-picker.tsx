"use client";

import { useState, useEffect } from "react";
import { DEV_DATE_COOKIE } from "../lib/time";
import { formatDateString } from "../lib/date-utils";

export function DevDatePicker() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [displayDate, setDisplayDate] = useState<string>("");

  useEffect(() => {
    // Read current override from cookie
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === DEV_DATE_COOKIE && value) {
        setSelectedDate(value);
        setDisplayDate(formatDisplayDate(value));
        return;
      }
    }
    // No override, show today
    const today = formatDateString(new Date());
    setDisplayDate(formatDisplayDate(today));
  }, []);

  function formatDisplayDate(dateStr: string): string {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  function setCookie(value: string) {
    document.cookie = `${DEV_DATE_COOKIE}=${value};path=/;max-age=${60 * 60 * 24 * 30}`;
  }

  function clearCookie() {
    document.cookie = `${DEV_DATE_COOKIE}=;path=/;max-age=0`;
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setDisplayDate(formatDisplayDate(newDate));
    setCookie(newDate);
    window.location.reload();
  }

  function handleReset() {
    setSelectedDate("");
    clearCookie();
    window.location.reload();
  }

  // Only render in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {isExpanded ? (
        <div className="rounded-lg border border-slate-600 bg-slate-800 p-3 shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs text-slate-400">Dev Date Override</span>
            <button onClick={() => setIsExpanded(false)} className="ml-auto text-sm text-slate-400 hover:text-white">
              x
            </button>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="mb-2 w-full rounded border border-slate-600 bg-slate-700 px-2 py-1 text-sm text-white"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-600">
              Reset to Today
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium shadow-lg ${
            selectedDate
              ? "bg-amber-600 text-white hover:bg-amber-500"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}>
          {selectedDate ? displayDate : displayDate}
        </button>
      )}
    </div>
  );
}
