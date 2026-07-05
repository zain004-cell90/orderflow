"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  Gift,
  KeyRound,
  Mail,
  Package2,
  ShoppingCart,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { routes } from "@/lib/routes";
import { useAuth } from "@/components/auth/auth-provider";

function GoogleMark() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09A6.97 6.97 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        fill="#EA4335"
      />
    </svg>
  );
}

const inputClass =
  "h-[50px] w-full rounded-xl border border-[#c7c4d8] bg-white px-4 text-[14px] text-[#141b2b] outline-none transition-all placeholder:text-[#777587] focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20";

export function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = await login(
      String(data.get("email")),
      String(data.get("password")),
      data.get("remember") === "on",
    );
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    const requested = params.get("next");
    router.push(
      result.nextPath ||
        (requested && requested.startsWith("/") && !requested.startsWith("//")
          ? requested
          : routes.dashboard),
    );
    router.refresh();
  };
  const features = [
    { icon: ShoppingCart, label: "Orders" },
    { icon: Users, label: "Customers" },
    { icon: BarChart3, label: "Analytics" },
    { icon: Truck, label: "Tracking" },
  ];
  return (
    <main className="flex min-h-screen bg-[#f9f9ff] text-[#141b2b]">
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#3525cd] p-12 md:flex lg:w-3/5 lg:p-20">
        <div className="relative z-10">
          <div className="mb-16 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#3525cd] shadow-lg">
              <Package2 size={20} />
            </span>
            <span className="text-[24px] font-bold tracking-[-0.01em] text-white">
              OrderFlow
            </span>
          </div>
          <div className="max-w-xl">
            <h1 className="mb-6 text-[48px] font-bold leading-[1.1] tracking-[-0.02em] text-white">
              Welcome back
            </h1>
            <p className="mb-12 text-[18px] leading-[1.6] text-[#dad7ff]/80">
              Effortlessly manage your orders, customers, and business logistics
              in one high-performance dashboard designed for social media
              entrepreneurs.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {features.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-white transition-colors hover:bg-white/10"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#4f46e5]/30 text-[#c3c0ff]">
                    <Icon size={19} />
                  </span>
                  <span className="text-[14px] font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-12 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-sm">
          <Image
            className="h-64 w-full rounded-xl object-cover opacity-90"
            src="/images/orderflow/stitch-01.png"
            alt="OrderFlow dashboard preview"
            width={512}
            height={512}
          />
        </div>
      </section>
      <section className="relative flex flex-1 flex-col items-center justify-center bg-[#f9f9ff] px-6 py-12 lg:px-12">
        <Link
          href={routes.home}
          className="absolute left-6 top-6 flex items-center gap-2 text-[12px] font-medium text-[#777587] transition-colors hover:text-[#3525cd] lg:left-12"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
        <Link
          href={routes.home}
          className="mb-12 flex items-center gap-3 md:hidden"
        >
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#3525cd] text-white shadow-lg">
            <Package2 size={20} />
          </span>
          <span className="text-[24px] font-bold text-[#3525cd]">
            OrderFlow
          </span>
        </Link>
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="mb-2 text-[24px] font-semibold leading-[1.3] tracking-[-0.01em]">
              Log in to your account
            </h2>
            <p className="text-[14px] text-[#464555]">
              Enter your credentials to access your dashboard.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-6">
            <label className="block">
              <span className="mb-2 block text-[14px] font-medium">
                Email Address
              </span>
              <input
                className={inputClass}
                name="email"
                type="email"
                required
                autoComplete="email"
                aria-invalid={Boolean(message)}
                aria-describedby={message ? "login-error" : undefined}
                placeholder="name@company.com"
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-[14px] font-medium">
                Password{" "}
                <Link
                  href={routes.forgotPassword}
                  className="text-[12px] text-[#3525cd] hover:underline"
                >
                  Forgot Password?
                </Link>
              </span>
              <span className="relative block">
                <input
                  className={`${inputClass} pr-12`}
                  name="password"
                  type={visible ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777587]"
                  aria-label="Toggle password visibility"
                >
                  {visible ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </span>
            </label>
            <label className="flex items-center gap-3 text-[14px] text-[#464555]">
              <input
                name="remember"
                type="checkbox"
                className="h-5 w-5 rounded border-[#c7c4d8] accent-[#3525cd]"
              />
              Remember Me
            </label>
            {message && (
              <p id="login-error" role="alert" className="auth-form-error">
                {message}
              </p>
            )}
            <button
              type="submit"
              className="h-14 w-full rounded-xl bg-gradient-to-b from-[#4f46e5] to-[#3525cd] text-[14px] font-semibold text-white shadow-lg shadow-[#3525cd]/20"
            >
              Log In
            </button>
            <div className="flex items-center py-1">
              <span className="h-px flex-1 bg-[#c7c4d8]/30" />
              <span className="mx-4 text-[10px] uppercase tracking-widest text-[#777587]">
                or
              </span>
              <span className="h-px flex-1 bg-[#c7c4d8]/30" />
            </div>
            <button
              type="button"
              onClick={() =>
                setMessage("Google sign-in will be connected with Supabase.")
              }
              className="flex h-[50px] w-full items-center justify-center gap-3 rounded-xl border border-[#c7c4d8] bg-white text-[14px] font-medium transition-colors hover:bg-[#f1f3ff]"
            >
              <GoogleMark />
              Continue with Google
            </button>
          </form>
          <p className="mt-10 text-center text-[14px] text-[#464555]">
            Don&apos;t have an account?{" "}
            <Link
              className="font-semibold text-[#3525cd] hover:underline"
              href={routes.signup}
            >
              Get Started
            </Link>
          </p>
        </div>
        <footer className="mt-auto pt-12 text-center text-[10px] text-[#777587]">
          <p>© 2026 OrderFlow. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-4">
            <Link href={routes.privacy}>Privacy Policy</Link>
            <span>•</span>
            <Link href={routes.terms}>Terms of Service</Link>
          </div>
        </footer>
      </section>
    </main>
  );
}

export function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [message, setMessage] = useState("");
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password"));
    if (password !== String(data.get("confirmPassword"))) {
      setMessage("Passwords do not match.");
      return;
    }
    const result = await signup(
      String(data.get("name")),
      String(data.get("email")),
      password,
    );
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    router.push(result.nextPath || routes.onboarding);
    router.refresh();
  };
  return (
    <div className="relative flex min-h-screen flex-col bg-[#f9f9ff] text-[#141b2b]">
      <Link
        href={routes.home}
        className="absolute left-6 top-6 z-10 flex items-center gap-2 text-[12px] font-medium text-[#777587] transition-colors hover:text-[#3525cd] md:left-10 md:top-8"
      >
        <ArrowLeft size={15} />
        Back to home
      </Link>
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-[480px] space-y-12">
          <div className="flex flex-col items-center space-y-4 text-center">
            <span className="mb-1 grid h-12 w-12 place-items-center rounded-xl bg-[#3525cd] text-white shadow-lg">
              <ShoppingCart size={27} />
            </span>
            <h1 className="text-[32px] font-bold leading-[1.2] tracking-[-0.01em] md:text-[48px] md:leading-[1.1] md:tracking-[-0.02em]">
              Start accepting
              <br />
              orders in minutes.
            </h1>
            <p className="max-w-[400px] text-[18px] leading-[1.6] text-[#464555]">
              Create your checkout page and stop collecting customer details
              manually.
            </p>
          </div>
          <div className="space-y-6 rounded-xl border border-[#c7c4d8]/30 bg-white p-12 shadow-[0_4px_6px_-1px_rgba(0,0,0,.05),0_2px_4px_-1px_rgba(0,0,0,.03)]">
            <form onSubmit={submit} className="space-y-4">
              <FormLabel label="Store Name">
                <input
                  className={inputClass}
                  name="name"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Acme Store"
                />
              </FormLabel>
              <FormLabel label="Email Address">
                <input
                  className={inputClass}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                />
              </FormLabel>
              <div className="grid gap-4 md:grid-cols-2">
                <FormLabel label="Password">
                  <input
                    className={inputClass}
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </FormLabel>
                <FormLabel label="Confirm Password">
                  <input
                    className={inputClass}
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </FormLabel>
              </div>
              {message && (
                <p id="signup-error" role="alert" className="auth-form-error">
                  {message}
                </p>
              )}
              <button
                type="submit"
                className="mt-6 h-12 w-full rounded-lg bg-gradient-to-b from-[#4f46e5] to-[#3525cd] text-[14px] font-medium text-white"
              >
                Create Free Account
              </button>
            </form>
            <div className="border-t border-[#c7c4d8]/30 pt-4">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] text-[#464555]">
                {[
                  [CheckCircle2, "No credit card required"],
                  [Zap, "Setup in 5 minutes"],
                  [Gift, "Free plan available"],
                ].map(([I, t]) => {
                  const Icon = I as typeof Zap;
                  return (
                    <span className="flex items-center gap-2" key={String(t)}>
                      <Icon size={16} className="text-[#3525cd]" />
                      {String(t)}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="space-y-4 text-center">
            <p className="text-[14px] text-[#464555]">
              Already have an account?{" "}
              <Link
                className="font-semibold text-[#3525cd] hover:underline"
                href={routes.login}
              >
                Log In
              </Link>
            </p>
            <div className="flex justify-center gap-6 text-[10px] text-[#777587]">
              <Link href={routes.privacy}>Privacy Policy</Link>
              <Link href={routes.terms}>Terms of Service</Link>
            </div>
          </div>
        </div>
      </main>
      <footer className="flex flex-col items-center justify-between gap-3 px-6 py-12 text-[10px] text-[#464555] md:flex-row">
        <span>© 2026 OrderFlow. All rights reserved.</span>
        <span>Secure checkout powered by OrderFlow Infrastructure</span>
      </footer>
    </div>
  );
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = await resetPassword(String(data.get("email")));
    setMessage(result.message || "");
    setSent(result.ok);
  };
  return (
    <AuthSimpleShell
      icon={<KeyRound size={24} />}
      title="Reset your password"
      text="Enter your account email. We will send password reset instructions if the account exists."
    >
      <form onSubmit={submit} className="space-y-5">
        <FormLabel label="Email Address">
          <input
            className={inputClass}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@company.com"
          />
        </FormLabel>
        {message && (
          <p role="alert" className={sent ? "auth-form-success" : "auth-form-error"}>
            {message}
          </p>
        )}
        <button type="submit" className="btn-primary h-12 w-full">
          Send reset link
        </button>
      </form>
      <p className="mt-8 text-center text-[14px] text-[#464555]">
        Remembered your password?{" "}
        <Link className="font-semibold text-[#3525cd] hover:underline" href={routes.login}>
          Log in
        </Link>
      </p>
    </AuthSimpleShell>
  );
}

export function CheckEmailPage() {
  return (
    <AuthSimpleShell
      icon={<Mail size={24} />}
      title="Check your email"
      text="We created your account. Confirm your email address, then log in to finish onboarding."
    >
      <div className="space-y-3">
        <Link className="btn-primary h-12 w-full" href={routes.login}>
          Go to login
        </Link>
        <Link className="btn-secondary h-12 w-full" href={routes.home}>
          Back to home
        </Link>
      </div>
    </AuthSimpleShell>
  );
}

function AuthSimpleShell({
  icon,
  title,
  text,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#f9f9ff] px-6 py-20 text-[#141b2b]">
      <Link
        href={routes.home}
        className="absolute left-6 top-6 flex items-center gap-2 text-[13px] font-medium text-[#777587] transition-colors hover:text-[#3525cd]"
      >
        <ArrowLeft size={15} />
        Back to home
      </Link>
      <section className="w-full max-w-[440px] rounded-2xl border border-[#c7c4d8]/30 bg-white p-8 shadow-[0_14px_45px_rgba(20,27,43,.07)]">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-[#3525cd] text-white shadow-lg">
            {icon}
          </span>
          <h1 className="text-[30px] font-bold leading-[1.15] tracking-[-0.02em]">
            {title}
          </h1>
          <p className="mt-3 text-[15px] leading-6 text-[#646273]">{text}</p>
        </div>
        {children}
      </section>
    </main>
  );
}

function FormLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="ml-1 block text-[14px] font-medium text-[#464555]">
        {label}
      </span>
      {children}
    </label>
  );
}
