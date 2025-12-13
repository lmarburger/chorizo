"use client";

import { useRouter } from "next/navigation";

export function useUserSession() {
  const router = useRouter();

  const switchUser = () => {
    localStorage.removeItem("selectedUser");
    localStorage.removeItem("userType");
    router.push("/");
  };

  return { switchUser };
}
