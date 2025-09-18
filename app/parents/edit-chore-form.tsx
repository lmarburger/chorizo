"use client";

import { Chore } from "../lib/db";
import { updateChoreAction } from "./actions";
import { useState } from "react";

interface EditChoreFormProps {
  chore: Chore;
  kidNames: string[];
  onCancel: () => void;
}

export function EditChoreForm({ chore, kidNames, onCancel }: EditChoreFormProps) {
  const [newKid, setNewKid] = useState("");
  const [selectedKid, setSelectedKid] = useState(chore.kid_name);

  return (
    <form
      action={async formData => {
        await updateChoreAction(formData);
        onCancel();
      }}
      className="space-y-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
      <input type="hidden" name="choreId" value={chore.id.toString()} />
      <div>
        <label htmlFor={`edit-name-${chore.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Chore Name
        </label>
        <input
          type="text"
          name="name"
          id={`edit-name-${chore.id}`}
          defaultValue={chore.name}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor={`edit-description-${chore.id}`}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Description (optional)
        </label>
        <input
          type="text"
          name="description"
          id={`edit-description-${chore.id}`}
          defaultValue={chore.description || ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor={`edit-kid-${chore.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Assign to Kid
        </label>
        <div className="mt-1 flex gap-2">
          <select
            name="kid_name"
            id={`edit-kid-${chore.id}`}
            value={newKid ? "" : selectedKid}
            onChange={e => {
              setSelectedKid(e.target.value);
              setNewKid("");
            }}
            required={!newKid}
            className="block flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            <option value="">Select existing...</option>
            {kidNames.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="text"
            name={newKid ? "kid_name" : ""}
            placeholder="Or add new..."
            value={newKid}
            onChange={e => {
              setNewKid(e.target.value);
              if (e.target.value) setSelectedKid("");
            }}
            className="block flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`edit-day-${chore.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Day of Week
        </label>
        <select
          name="day_of_week"
          id={`edit-day-${chore.id}`}
          defaultValue={chore.day_of_week}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white">
          <option value="monday">Monday</option>
          <option value="tuesday">Tuesday</option>
          <option value="wednesday">Wednesday</option>
          <option value="thursday">Thursday</option>
          <option value="friday">Friday</option>
          <option value="saturday">Saturday</option>
          <option value="sunday">Sunday</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none">
          Save Changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-400 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
          Cancel
        </button>
      </div>
    </form>
  );
}
