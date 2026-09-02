"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Icon from "@/components/Icon";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleAutofill = (demoEmail: string, demoPass: string, demoName?: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    if (demoName) setName(demoName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "register") {
        await api.register({ name, email, phone: phone || undefined, password });
      }

      const res = await api.login({ email, password });
      localStorage.setItem("agri_token", res.access_token);
      localStorage.setItem("agri_user", JSON.stringify(res.user));
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-abyss shadow-[0_0_24px_rgba(52,211,153,0.5)]">
            <Icon name="sprout" size={28} strokeWidth={2.4} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            Agri<span className="text-brand">Twin</span> AI
          </h1>
          <p className="mt-1 text-xs text-mist font-mono">
            Pakistan Agriculture Intelligence Platform
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 relative overflow-hidden">
          {/* Subtle top glow bar */}
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500 via-brand to-lime-400" />

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">
              {mode === "login" ? "Console Access" : "Create Twin Account"}
            </h2>
            <span className="hud-pill text-[10px] text-brand border-brand/30 bg-brand/10">
              JWT Secured
            </span>
          </div>

          {/* Demo account quick autofill */}
          <div className="mb-5 rounded-xl border border-ink/6 bg-ink/[0.02] p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-dim block mb-1.5">
              Demo Credentials (1-Click Fill)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAutofill("farmer@agritwin.pk", "password123", "Ahmad Khan")}
                className="flex-1 rounded-lg border border-brand/30 bg-brand/10 px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand/20 transition-colors"
              >
                Punjab Farmer
              </button>
              <button
                type="button"
                onClick={() => handleAutofill("officer@agritwin.pk", "password123", "Dr. Tariq Mahmood")}
                className="flex-1 rounded-lg border border-ink/10 bg-ink/6 px-2 py-1 text-[11px] font-medium text-mist hover:text-ink hover:bg-ink/10 transition-colors"
              >
                Agri Officer
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-mist">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="input-theme px-3.5 py-2 text-xs"
                    placeholder="e.g. Ahmad Khan"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-mist">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-theme px-3.5 py-2 text-xs"
                    placeholder="+92 300 1234567"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-mist">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-theme px-3.5 py-2 text-xs"
                placeholder="farmer@agritwin.pk"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-mist">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-theme px-3.5 py-2 text-xs"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-xs text-rose-300">
                <Icon name="alert" size={14} className="mt-0.5 shrink-0 text-rose-400" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 py-2.5 text-xs font-semibold text-abyss shadow-[0_4px_16px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_4px_24px_rgba(16,185,129,0.55)] disabled:opacity-50"
            >
              {loading
                ? "Authenticating Node…"
                : mode === "login"
                  ? "Sign In to Console"
                  : "Register Twin Account"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="text-xs text-brand transition-colors hover:text-brand-light hover:underline font-medium"
            >
              {mode === "login"
                ? "Need a new account? Register here"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        {/* Guest Demo Mode */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-xs text-dim transition-colors hover:text-mist hover:underline font-mono"
          >
            Continue in Guest Demo Mode &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
