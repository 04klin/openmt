"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter(); const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => { e.preventDefault(); const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) }); const data = await res.json(); if (!res.ok) return setError(data.error); localStorage.setItem("openmt-user", JSON.stringify(data.user)); router.push("/"); };
  return <AuthShell title="Welcome back" subtitle="Sign in to keep your media shelf in sync."><form onSubmit={submit} className="space-y-4"><Field label="Username" value={username} onChange={setUsername} /><Field label="Password" type="password" value={password} onChange={setPassword} />{error && <p className="text-sm text-rose-400">{error}</p>}<button className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500">Log in</button></form><p className="mt-6 text-center text-sm text-zinc-500">New to OpenMT? <Link className="text-indigo-300 hover:text-white" href="/signup">Create an account</Link></p></AuthShell>;
}
function Field({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (v: string) => void }) { return <label className="block text-sm text-zinc-300">{label}<input required type={type} value={value} onChange={e => onChange(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-white outline-none focus:border-indigo-500" /></label>; }
export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4"><div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl"><Link href="/" className="text-sm font-bold text-indigo-300">← OpenMT</Link><h1 className="mt-8 text-3xl font-extrabold text-white">{title}</h1><p className="mt-2 mb-8 text-sm text-zinc-400">{subtitle}</p>{children}</div></main>; }
