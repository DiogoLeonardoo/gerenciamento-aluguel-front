"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api";

export default function AuthCheck({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push("/auth/login");
    }
  }, [router]);

  return <>{children}</>;
}
