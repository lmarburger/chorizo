import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="mb-12 text-center text-4xl font-bold text-gray-900 dark:text-white">Chorizo</h1>

        <div className="space-y-4">
          <Link
            href="/kids"
            className="block w-full rounded-lg bg-blue-500 px-6 py-4 text-center text-lg font-semibold text-white transition-colors hover:bg-blue-600">
            Kid View
          </Link>

          <Link
            href="/parents"
            className="block w-full rounded-lg bg-green-500 px-6 py-4 text-center text-lg font-semibold text-white transition-colors hover:bg-green-600">
            Parent View
          </Link>
        </div>

        <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Track chores, screen time, and practice time
        </p>
      </div>
    </div>
  );
}
