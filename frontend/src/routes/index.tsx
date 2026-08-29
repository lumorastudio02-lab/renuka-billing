import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, User } from "lucide-react";
import { Btn, Field, Input } from "@/components/ui-kit";
import { isLoggedIn, login } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Admin Login — Renuka Paramedical Baramati" },
      {
        name: "description",
        content:
          "Secure admin login for Renuka Paramedical Baramati Institute Fee Management System.",
      },
      {
        property: "og:title",
        content: "Admin Login — Renuka Paramedical Baramati",
      },
      {
        property: "og:description",
        content:
          "Secure admin login for the institute fee management and receipt system.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoggedIn()) {
      navigate({ to: "/dashboard" });
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    if (login(username, password)) {
      navigate({ to: "/dashboard" });
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl sm:p-8">
        
        {/* Institute Branding */}
        <div className="mb-6 text-center">
          <img
            src="/logo.png"
            alt="Renuka Paramedical Institute Logo"
            className="mx-auto mb-4 h-24 w-24 object-contain"
          />

          <h1 className="text-xl font-semibold text-foreground">
            Renuka Paramedical Baramati
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Institute Fee Management System
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Admin login to continue
          </p>
        </div>

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* Username */}
          <Field label="Username">
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

              <Input
                className="pl-9"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>
          </Field>

          {/* Password */}
          <Field label="Password">
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />

              <Input
                className="pl-9"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>
          </Field>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}

          {/* Login Button */}
          <Btn type="submit" className="w-full">
            Login
          </Btn>
        </form>

      </div>
    </div>
  );
}