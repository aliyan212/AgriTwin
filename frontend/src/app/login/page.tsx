"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import Icon from "@/components/Icon";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"farmer" | "extension_officer">("farmer");

  const handleInstantDemoLogin = async (demoEmail: string, demoRole: string) => {
    setDemoLoading(demoRole);
    setError(null);
    try {
      const res = await api.login({ email: demoEmail, password: "password123" });
      login(res.access_token, res.user);
      router.replace("/");
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
        await api.register({
          name,
          email,
          phone: phone || undefined,
          role: selectedRole,
          password,
        });
      }

      const res = await api.login({ email, password });
      login(res.access_token, res.user);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-abyss shadow-[0_0_24px_rgba(52,211,153,0.4)]">
            <Icon name="sprout" size={24} strokeWidth={2.4} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            Agri<span className="text-brand">Twin</span> AI
          </h1>
          <p className="mt-0.5 text-xs text-mist font-mono">
            Punjab Agriculture Intelligence Platform
          </p>
        </div>

        {/* Main Card */}
        <div className="glass-panel p-6 sm:p-7 relative overflow-hidden shadow-xl">
          {/* Subtle top glow bar */}
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-500 via-brand to-sky-400" />

          {/* Lowkey 1-Tap Demo Switcher */}
          <div className="mb-5 rounded-xl border border-ink/8 bg-ink/[0.02] p-2.5">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-dim flex items-center gap-1.5">
                <Icon name="spark" size={11} className="text-brand" />
                <span>Demo Accounts</span>
              </span>
              <span className="text-[10px] font-mono text-dim">1-Tap Login</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleInstantDemoLogin("farmer@agritwin.pk", "farmer")}
                disabled={demoLoading !== null}
                className="flex items-center justify-between rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>🌱</span>
                  <span className="truncate">Farmer</span>
                </span>
                <span className="text-[10px] opacity-70">→</span>
              </button>
              <button
                type="button"
                onClick={() => handleInstantDemoLogin("officer@agritwin.pk", "officer")}
                disabled={demoLoading !== null}
                className="flex items-center justify-between rounded-lg border border-sky-500/25 bg-sky-500/8 px-2.5 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-500/15 transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span>🏛️</span>
                  <span className="truncate">Officer</span>
                </span>
                <span className="text-[10px] opacity-70">→</span>
              </button>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-4 flex items-center justify-between border-b border-ink/6 pb-3">
            <h2 className="text-sm font-bold text-ink">
              {mode === "login" ? "Sign In to Mission Control" : "Register Custom Account"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="text-[11px] font-semibold text-brand hover:underline"
            >
              {mode === "login" ? "Create Account" : "Sign In instead"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "register" && (
              <>
                {/* Role Switcher for Custom Registration */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-mist">
                    Select Account Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole("farmer")}
                      className={`flex items-center gap-2 rounded-xl p-2.5 border text-xs font-semibold transition-all ${selectedRole === "farmer"
                          ? "border-brand/40 bg-brand/15 text-brand shadow-sm"
                          : "border-ink/8 bg-ink/[0.02] text-mist hover:text-ink hover:bg-ink/5"
                        }`}
                    >
                      <Icon name="wheat" size={14} />
                      <div className="text-left">
                        <div className="text-xs">Punjab Farmer</div>
                        <div className="text-[9px] text-mist font-normal">Field Landowner</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole("extension_officer")}
                      className={`flex items-center gap-2 rounded-xl p-2.5 border text-xs font-semibold transition-all ${selectedRole === "extension_officer"
                          ? "border-sky-400/40 bg-sky-500/15 text-sky-400 shadow-sm"
                          : "border-ink/8 bg-ink/[0.02] text-mist hover:text-ink hover:bg-ink/5"
                        }`}
                    >
                      <Icon name="activity" size={14} />
                      <div className="text-left">
                        <div className="text-xs">Agri Officer</div>
                        <div className="text-[9px] text-mist font-normal">Supervisory Mode</div>
                      </div>
                    </button>
                  </div>
                </div>

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
                    placeholder="e.g. Tariq Mahmood"
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
                placeholder="user@agritwin.pk"
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
              className="w-full rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 py-2.5 text-xs font-bold text-abyss shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-abyss border-t-transparent" />
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                `Register as ${selectedRole === "extension_officer" ? "Agri Officer" : "Farmer"}`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
