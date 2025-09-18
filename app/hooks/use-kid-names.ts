"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to fetch and manage kid names
 * Used across multiple forms that need kid selection
 */
export function useKidNames() {
  const [kidNames, setKidNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKidNames = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/kids");

        if (!response.ok) {
          throw new Error(`Failed to fetch kid names: ${response.status}`);
        }

        const data = await response.json();
        setKidNames(data.kids || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch kid names");
        console.error("Failed to fetch kid names:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchKidNames();
  }, []);

  return { kidNames, loading, error };
}
