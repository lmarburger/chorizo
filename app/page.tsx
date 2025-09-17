import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Chorizo
        </h1>
        
        <div className="space-y-4">
          <Link
            href="/kids"
            className="block w-full bg-blue-500 text-white text-center py-4 px-6 rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Kid View
          </Link>
          
          <Link
            href="/parents"
            className="block w-full bg-green-500 text-white text-center py-4 px-6 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Parent View
          </Link>
        </div>
        
        <p className="text-center text-gray-600 dark:text-gray-400 mt-8 text-sm">
          Track chores, screen time, and practice time
        </p>
      </div>
    </div>
  );
}