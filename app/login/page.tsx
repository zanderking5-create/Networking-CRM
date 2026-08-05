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
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">Log in</h1>

        {mode === "signin" ? (
          <>
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
                {status === "loading" ? "Logging in..." : "Log in"}
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
              className="block w-full text-center text-sm text-muted-foreground hover:underline"
            >
              Forgot password, or setting it for the first time?
            </button>
          </>
        ) : (
          <>
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
                    ? "Sending..."
                    : "Send password link"}
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
              className="block w-full text-center text-sm text-muted-foreground hover:underline"
            >
              Back to log in
            </button>
          </>
        )}
      </div>
    </main>
  );
}
