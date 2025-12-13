"use client";

import { useState } from "react";
import { FormInput, FormTextarea, FormButton } from "../components/form-components";
import type { Task } from "../lib/db";

interface TaskEditFormProps {
  task: Task;
  onSave: (values: { title: string; description: string; due_date: string }) => void;
  onCancel: () => void;
  onDelete: () => void;
  stopPropagation?: boolean;
}

export function TaskEditForm({ task, onSave, onCancel, onDelete, stopPropagation }: TaskEditFormProps) {
  const formattedDate = task.due_date.includes("T") ? task.due_date.split("T")[0] : task.due_date;
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    due_date: formattedDate,
  });

  const handleClick = stopPropagation ? (e: React.MouseEvent) => e.stopPropagation() : undefined;

  return (
    <div onClick={handleClick} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <div className="space-y-4">
        <FormInput
          name="title"
          label="Title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />

        <FormTextarea
          name="description"
          label="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={2}
        />

        <FormInput
          type="date"
          name="due_date"
          label="Due Date"
          value={form.due_date}
          onChange={e => setForm({ ...form, due_date: e.target.value })}
        />

        <div className="flex items-center justify-between">
          <FormButton variant="danger" onClick={onDelete}>
            Delete
          </FormButton>
          <div className="flex gap-2">
            <FormButton variant="secondary" onClick={onCancel}>
              Cancel
            </FormButton>
            <FormButton variant="primary" onClick={() => onSave(form)}>
              Save
            </FormButton>
          </div>
        </div>
      </div>
    </div>
  );
}
