"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [kids, setKids] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("selectedUser");
    const storedUserType = localStorage.getItem("userType");

    if (storedUser && storedUserType) {
      if (storedUserType === "parent") {
        router.push("/parents");
      } else if (storedUserType === "kid") {
        router.push(`/kids?name=${encodeURIComponent(storedUser)}`);
      }
    }

    fetch("/api/kids")
      .then(res => res.json())
      .then(data => {
        setKids(data.kids);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleSelection = (userType: "parent" | "kid", userName?: string) => {
    if (userType === "parent") {
      localStorage.setItem("selectedUser", "parent");
      localStorage.setItem("userType", "parent");
      router.push("/parents");
    } else if (userType === "kid" && userName) {
      localStorage.setItem("selectedUser", userName);
      localStorage.setItem("userType", "kid");
      router.push(`/kids?name=${encodeURIComponent(userName)}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="mb-12 text-center text-4xl font-bold text-gray-900 dark:text-white">Chorizo</h1>

        <div className="space-y-4">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-700 dark:text-gray-300">Who's this?</h2>

          {kids.map(kidName => (
            <button
              key={kidName}
              onClick={() => handleSelection("kid", kidName)}
              className="block w-full rounded-lg bg-blue-500 px-6 py-4 text-center text-lg font-semibold text-white transition-colors hover:bg-blue-600">
              {kidName}
            </button>
          ))}

          <button
            onClick={() => handleSelection("parent")}
            className="block w-full rounded-lg bg-gray-500 px-6 py-4 text-center text-lg font-semibold text-white transition-colors hover:bg-gray-600">
            Parents
          </button>
        </div>
      </div>
    </div>
  );
}
