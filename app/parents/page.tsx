import Link from "next/link";
import { getAllChores, deleteChore, addChore, getUniqueKidNames } from "../lib/db";
import { ChoreList } from "./chore-list";
import { AddChoreForm } from "./add-chore-form";

export default async function ParentsPage() {
  const chores = await getAllChores();
  const kidNames = await getUniqueKidNames();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manage Chores
          </h1>
          <div className="w-16"></div>
        </div>

        <AddChoreForm kidNames={kidNames} />
        
        <div className="mt-8">
          <ChoreList chores={chores} />
        </div>
      </div>
    </div>
  );
}