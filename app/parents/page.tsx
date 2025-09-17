import Link from "next/link";
import { getAllChores, getUniqueKidNames } from "../lib/db";
import { ChoreList } from "./chore-list";
import { AddChoreForm } from "./add-chore-form";

export default async function ParentsPage() {
  const chores = await getAllChores();
  const kidNames = await getUniqueKidNames();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="font-medium text-blue-500 hover:text-blue-600">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Chores</h1>
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
