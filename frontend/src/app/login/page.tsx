"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import Icon from "@/components/Icon";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleInstantDemoLogin = async (demoEmail: string, demoRole: string) => {
    setDemoLoading(demoRole);
    setError(null);
    try {
      const res = await api.login({ email: demoEmail, password: "password123" });
      localStorage.setItem("agri_token", res.access_token);
      localStorage.setItem("agri_user", JSON.stringify(res.user));
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setDemoLoading(null);
    }
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
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-abyss shadow-[0_0_24px_rgba(52,211,153,0.5)]">
            <Icon name="sprout" size={24} strokeWidth={2.4} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Agri<span className="text-brand">Twin</span> AI
          </h1>
          <p className="mt-0.5 text-xs text-mist font-mono">
            Pakistan Agriculture & Satellite Twin Console
          </p>
        </div>

        {/* 1-Click Instant Demo Launch Cards */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-dim">
              ⚡ 1-Click Instant Demo Access
            </span>
            <span className="hud-pill text-[10px] text-brand border-brand/30 bg-brand/10">
              Zero-Setup Login
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card 1: Punjab Farmer */}
            <div className="glass-panel p-4 flex flex-col justify-between border-emerald-500/20 hover:border-emerald-500/40 transition-all hover:shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-brand">
                    <Icon name="wheat" size={13} />
                  </span>
                  <span className="text-xs font-bold text-ink">Punjab Farmer</span>
                </div>
                <h4 className="text-sm font-bold text-ink mb-1">Ahmad Khan</h4>
                <p className="text-[11px] text-mist mb-3 leading-relaxed">
                  Field operations, private parcel Warabandi turn water rights & diesel tubewell fuel savings.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleInstantDemoLogin("farmer@agritwin.pk", "farmer")}
                disabled={demoLoading !== null}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2 text-xs font-bold text-abyss shadow-md hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {demoLoading === "farmer" ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-abyss border-t-transparent" />
                ) : (
                  <>
                    <span>Enter as Farmer</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>

            {/* Card 2: Agriculture Extension Officer */}
            <div className="glass-panel p-4 flex flex-col justify-between border-sky-500/20 hover:border-sky-500/40 transition-all hover:shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/10 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
                    <Icon name="activity" size={13} />
                  </span>
                  <span className="text-xs font-bold text-ink">Agri Extension Officer</span>
                </div>
                <h4 className="text-sm font-bold text-ink mb-1">Dr. Tariq Mahmood</h4>
                <p className="text-[11px] text-mist mb-3 leading-relaxed">
                  Regional surveillance, multi-district Punjab farm telemetry & government advisory broadcasts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleInstantDemoLogin("officer@agritwin.pk", "officer")}
                disabled={demoLoading !== null}
                className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-3 py-2 text-xs font-bold text-white shadow-md hover:shadow-sky-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                {demoLoading === "officer" ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Enter as Officer</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-ink/8" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
            <span className="bg-abyss px-3 text-dim">Or Sign In with Custom Account</span>
          </div>
        </div>

        {/* Manual Login / Register Card */}
        <div className="glass-panel p-6 relative overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">
              {mode === "login" ? "Account Credentials" : "Create Twin Account"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="text-[11px] font-semibold text-brand hover:underline"
            >
              {mode === "login" ? "Register New" : "Already have an account?"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" && (
              <>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-mist">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="input-theme px-3.5 py-2 text-xs"
                    placeholder="e.g. Chaudhry Ahmad"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-mist">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-theme px-3.5 py-2 text-xs"
                    placeholder="03001234567"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-[11px] font-medium text-mist">
                Email Address
              </label>
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
              <label className="mb-1 block text-[11px] font-medium text-mist">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-theme px-3.5 py-2 text-xs"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-ink/10 border border-ink/12 py-2 text-xs font-semibold text-ink hover:bg-ink/15 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
