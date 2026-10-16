"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState("pastel");

  useEffect(() => {
    if (typeof window !== "undefined") setTheme(localStorage.getItem("openmt-theme") || "pastel");
  }, []);

  const updateTheme = (value: string) => {
    setTheme(value);
    localStorage.setItem("openmt-theme", value);
    window.dispatchEvent(new Event("openmt-theme-change"));
  };

  return <main className="min-h-screen surface content px-4 py-10"><div className="mx-auto max-w-2xl"><Link href="/" className="text-sm text-indigo-400 hover:text-indigo-500">← Back to shelf</Link><h1 className="mt-8 text-3xl font-extrabold">Settings</h1>
    <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"><h2 className="font-bold">Appearance</h2><p className="mt-1 text-sm text-zinc-500">Choose the color system used throughout OpenMT.</p><label className="mt-4 block text-sm font-medium"><span className="mb-2 block">Theme</span><select value={theme} onChange={e => updateTheme(e.target.value)} className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3"><option value="pastel">Pastel — Soft lavender and violet</option><option value="light">Light — Bright neutral surfaces</option><option value="dark">Dark — Deep charcoal surfaces</option><option value="carbon">Carbon — Grey, low-saturation surfaces</option></select></label></section>
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"><h2 className="font-bold">Change password</h2><form onSubmit={async e => { e.preventDefault(); const res = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) }); const data = await res.json(); setMessage(data.error || "Password changed successfully."); }} className="mt-4 space-y-3"><input required type="password" placeholder="Current password" value={currentPassword} onChange={e => setCurrent(e.target.value)} className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3" /><input required type="password" placeholder="New password (8+ characters)" value={newPassword} onChange={e => setNew(e.target.value)} className="h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3" /><button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold">Update password</button>{message && <p className="text-sm text-zinc-400">{message}</p>}</form></section></div></main>;
}
