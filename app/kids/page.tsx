import { Suspense } from "react";
import KidsClient from "./kids-client";

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  );
}

export default function KidsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <KidsClient />
    </Suspense>
  );
}
