"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "reset">("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<
    "idle" | "loading" | "sent"
  >("idle");
  const [resetError, setResetError] = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setStatus("idle");
      return;
    }

    router.push("/today");
    router.refresh();
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    setResetStatus("loading");
    setResetError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setResetError(error.message);
      setResetStatus("idle");
    } else {
      setResetStatus("sent");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-8">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-serif text-sm font-semibold text-primary-foreground">
            N
          </span>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Networking CRM
            </p>
            <h1 className="text-balance font-serif text-3xl font-medium tracking-tight">
              {mode === "signin" ? "Welcome back" : "Reset your password"}
            </h1>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          {mode === "signin" ? (
            <div className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "Logging In…" : "Log In"}
                </Button>
                {error && (
                  <p className="text-sm text-destructive text-center">
                    {error}
                  </p>
                )}
              </form>
              <button
                type="button"
                onClick={() => setMode("reset")}
                className="block w-full text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                Forgot password, or setting it for the first time?
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {resetStatus === "sent" ? (
                <p className="text-center text-sm text-muted-foreground">
                  Check {resetEmail} for a link to set your password.
                </p>
              ) : (
                <form onSubmit={handleResetRequest} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={resetStatus === "loading"}
                  >
                    {resetStatus === "loading"
                      ? "Sending…"
                      : "Send Password Link"}
                  </Button>
                  {resetError && (
                    <p className="text-sm text-destructive text-center">
                      {resetError}
                    </p>
                  )}
                </form>
              )}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="block w-full text-center text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                Back to log in
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
