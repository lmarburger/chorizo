'use client';

import { Chore } from "../lib/db";
import { deleteChoreAction } from "./actions";

interface ChoreListProps {
  chores: Chore[];
}

export function ChoreList({ chores }: ChoreListProps) {
  const choresByKid = chores.reduce((acc, chore) => {
    if (!acc[chore.kid_name]) {
      acc[chore.kid_name] = [];
    }
    acc[chore.kid_name].push(chore);
    return acc;
  }, {} as Record<string, Chore[]>);

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun'
  };

  return (
    <div className="space-y-8">
      {Object.entries(choresByKid).map(([kidName, kidChores]) => (
        <div key={kidName} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {kidName}'s Chores
          </h2>
          
          <div className="space-y-2">
            {kidChores.sort((a, b) => 
              dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week)
            ).map((chore) => (
              <div
                key={chore.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {chore.name}
                  </div>
                  {chore.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {chore.description}
                    </div>
                  )}
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">
                    {dayLabels[chore.day_of_week]}
                  </div>
                </div>
                
                <form action={deleteChoreAction}>
                  <input type="hidden" name="choreId" value={chore.id} />
                  <button
                    type="submit"
                    className="text-red-500 hover:text-red-600 font-medium text-sm px-3 py-1"
                  >
                    Delete
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {Object.keys(choresByKid).length === 0 && (
        <p className="text-center text-gray-600 dark:text-gray-400 py-8">
          No chores scheduled yet. Add some chores to get started!
        </p>
      )}
    </div>
  );
}