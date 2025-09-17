'use client';

import { useState } from "react";
import { addChoreAction } from "./actions";

interface AddChoreFormProps {
  kidNames: string[];
}

export function AddChoreForm({ kidNames }: AddChoreFormProps) {
  const [kidName, setKidName] = useState("");
  const [isNewKid, setIsNewKid] = useState(false);
  
  return (
    <form action={addChoreAction} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Add New Chore
      </h2>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Chore Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Make bed"
          />
        </div>
        
        <div>
          <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Day of Week
          </label>
          <select
            id="day_of_week"
            name="day_of_week"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select a day</option>
            <option value="monday">Monday</option>
            <option value="tuesday">Tuesday</option>
            <option value="wednesday">Wednesday</option>
            <option value="thursday">Thursday</option>
            <option value="friday">Friday</option>
            <option value="saturday">Saturday</option>
            <option value="sunday">Sunday</option>
          </select>
        </div>
        
        <div className="sm:col-span-2">
          <label htmlFor="kid_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kid's Name
          </label>
          <div className="flex gap-2">
            {!isNewKid && kidNames.length > 0 ? (
              <>
                <select
                  id="kid_name"
                  name="kid_name"
                  required
                  value={kidName}
                  onChange={(e) => setKidName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a kid</option>
                  {kidNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewKid(true);
                    setKidName("");
                  }}
                  className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  New Kid
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  id="kid_name"
                  name="kid_name"
                  required
                  value={kidName}
                  onChange={(e) => setKidName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter kid's name"
                />
                {kidNames.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewKid(false);
                      setKidName("");
                    }}
                    className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    Select Existing
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., Make your bed neatly with pillows arranged"
          />
        </div>
      </div>
      
      <button
        type="submit"
        className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 font-medium"
      >
        Add Chore
      </button>
    </form>
  );
}