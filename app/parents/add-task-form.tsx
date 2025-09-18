"use client";

import { useState, useRef } from "react";
import { FormInput, FormTextarea, FormSelect, FormButton } from "../components/form-components";
import { useKidNames } from "../hooks/use-kid-names";
import { getTomorrowDateString } from "../lib/utils";

interface AddTaskFormProps {
  onSuccess?: () => void;
}

export function AddTaskForm({ onSuccess }: AddTaskFormProps = {}) {
  const { kidNames } = useKidNames();
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

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
  const defaultDueDate = getTomorrowDateString();

  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Add One-Time Task</h2>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <FormInput name="title" id="title" label="Task Title" required placeholder="Pack for trip" />

        <FormTextarea
          name="description"
          id="description"
          label="Description (optional)"
          rows={2}
          placeholder="Any details about the task"
        />

        <FormSelect
          name="kid_name"
          id="kid_name"
          label="Assign to"
          required
          options={[{ value: "", label: "Select a kid" }, ...kidNames.map(name => ({ value: name, label: name }))]}
        />

        <FormInput type="date" name="due_date" id="due_date" label="Due Date" required defaultValue={defaultDueDate} />

        <FormButton type="submit" loading={submitting} className="w-full">
          Add Task
        </FormButton>
      </form>
    </div>
  );
}
