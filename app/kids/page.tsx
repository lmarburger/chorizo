import Link from "next/link";
import { getTodayAndOverdueChores, getUniqueKidNames } from "../lib/db";
import { ChoreCard } from "./chore-card";

export default async function KidsPage() {
  const allChores = await getTodayAndOverdueChores();
  const kidNames = await getUniqueKidNames();
  
  // Group chores by kid
  const choresByKid = allChores.reduce((acc, chore) => {
    if (!acc[chore.kid_name]) {
      acc[chore.kid_name] = [];
    }
    acc[chore.kid_name].push(chore);
    return acc;
  }, {} as Record<string, typeof allChores>);
  
  // Get today's day name
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const dayLabels: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Today's Chores
          </h1>
          <div className="w-16"></div>
        </div>
        
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          {dayLabels[today as keyof typeof dayLabels]}
        </p>
        
        {kidNames.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400 py-8">
            No chores scheduled yet. Ask a parent to add some!
          </p>
        ) : (
          <div className="space-y-6">
            {kidNames.map((kidName) => {
              const kidChores = choresByKid[kidName] || [];
              const completedCount = kidChores.filter(c => c.is_completed).length;
              const totalCount = kidChores.length;
              
              return (
                <div key={kidName} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {kidName}
                    </h2>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {completedCount}/{totalCount} done
                    </span>
                  </div>
                  
                  {kidChores.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                      No chores today!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {kidChores.map((chore) => (
                        <ChoreCard key={`${chore.id}-${chore.day_of_week}`} chore={chore} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}