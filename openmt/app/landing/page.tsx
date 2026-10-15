"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LandingPage } from "../page";

export default function LandingRoute() {
  const router = useRouter();
  const { data, isLoading } = useQuery({ queryKey: ["auth", "me"], queryFn: async () => (await fetch("/api/auth/me")).json(), retry: false });
  useEffect(() => { if (data?.user) router.replace("/"); }, [data, router]);
  if (isLoading || data?.user) return <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-400">Opening OpenMT…</div>;
  return <LandingPage />;
}
