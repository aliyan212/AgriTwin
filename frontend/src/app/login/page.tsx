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
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-abyss brand-glow">
            <Icon name="sprout" size={28} strokeWidth={2.2} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            AgriTwin <span className="text-brand">AI</span>
          </h1>
          <p className="mt-1 text-sm text-mist">
            Pakistan-focused agriculture intelligence
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8">
          <h2 className="mb-6 text-xl font-semibold text-ink">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-mist">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="input-dark px-4 py-2.5"
                    placeholder="Ahmad Khan"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-mist">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-dark px-4 py-2.5"
                    placeholder="+92 300 1234567"
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-mist">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-dark px-4 py-2.5"
                placeholder="farmer@agritwin.pk"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-mist">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-dark px-4 py-2.5"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-400/25 bg-red-500/10 p-3">
                <Icon name="alert" size={14} className="mt-0.5 flex-shrink-0 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 py-3 text-sm font-semibold text-abyss transition-all hover:from-emerald-400 hover:to-emerald-300 hover:brand-glow disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="text-sm text-brand transition-colors hover:text-brand-light hover:underline"
            >
              {mode === "login"
                ? "Don't have an account? Register"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        {/* Skip auth for demo */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-xs text-dim transition-colors hover:text-mist hover:underline"
          >
            Continue without signing in (demo mode)
          </button>
        </div>
      </div>
    </div>
  );
}
