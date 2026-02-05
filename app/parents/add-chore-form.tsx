"use client";

import { useState, useRef } from "react";
import { addChoreWithSchedulesAction } from "./actions";
import { FormInput, FormTextarea, FormButton } from "../components/form-components";
import { useKidNames } from "../hooks/use-kid-names";
import { ChoreScheduleEditor, type ScheduleEntry } from "./chore-schedule-editor";

interface AddChoreFormProps {
  onSuccess?: () => void;
}

export function AddChoreForm({ onSuccess }: AddChoreFormProps = {}) {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [isFixed, setIsFixed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { kidNames: existingKidNames } = useKidNames();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    try {
      await addChoreWithSchedulesAction(formData);
      setSchedules([]);
      setIsFixed(false);
      formRef.current?.reset();
      onSuccess?.();
    } catch {
      setError("Failed to add chore. Try again.");
    }
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

        <ChoreScheduleEditor schedules={schedules} onSchedulesChange={setSchedules} kidNames={existingKidNames} />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <FormButton
        type="submit"
        disabled={schedules.length === 0 || schedules.every(s => s.days.length === 0)}
        className="mt-4 w-full">
        Add Chore
      </FormButton>
    </form>
  );
}
