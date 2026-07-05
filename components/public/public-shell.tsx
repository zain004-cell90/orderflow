import Link from "next/link";
import type { ReactNode } from "react";
import { routes } from "@/lib/routes";

export function Wordmark({ className = "" }: { className?: string }) {
  return <Link href={routes.home} className={`text-[24px] font-bold leading-[1.3] tracking-[-0.01em] text-[#3525cd] ${className}`}>OrderFlow</Link>;
}

export function PublicHeader({ active }: { active?: "tracking" | "help" }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-[#c7c4d8]/30 bg-[#f9f9ff]/80 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-6">
        <Wordmark />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Public navigation">
          <Link className="text-[14px] text-[#464555] transition-colors hover:text-[#3525cd]" href={routes.home}>Home</Link>
          <Link className="text-[14px] text-[#464555] transition-colors hover:text-[#3525cd]" href={routes.dashboard}>Dashboard</Link>
          <Link className={`text-[14px] transition-colors ${active === "help" ? "border-b-2 border-[#3525cd] font-semibold text-[#3525cd]" : "text-[#464555] hover:text-[#3525cd]"}`} href={routes.contact}>Help</Link>
          <Link className={`text-[14px] transition-colors ${active === "tracking" ? "border-b-2 border-[#3525cd] font-semibold text-[#3525cd]" : "text-[#464555] hover:text-[#3525cd]"}`} href={routes.track}>Tracking</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link className="hidden text-[12px] font-medium text-[#464555] hover:text-[#3525cd] sm:block" href={routes.login}>Log In</Link>
          <Link className="rounded-lg bg-[#3525cd] px-6 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90" href={routes.signup}>Get Started</Link>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="w-full border-t border-[#c7c4d8]/50 bg-white py-12">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-5 px-6 md:flex-row">
        <div><Link href={routes.home} className="text-[18px] font-bold text-[#141b2b]">OrderFlow</Link><p className="mt-1 text-[10px] text-[#464555]/60">© 2026 OrderFlow. All rights reserved.</p></div>
        <div className="flex flex-wrap justify-center gap-6 text-[10px] text-[#464555]">
          <Link href={routes.features}>Features</Link><Link href={routes.track}>Track Order</Link><Link href={routes.login}>Log In</Link><Link href={routes.signup}>Start Free</Link><Link href={routes.privacy}>Privacy</Link><Link href={routes.terms}>Terms</Link><Link href={routes.contact}>Contact</Link>
        </div>
      </div>
    </footer>
  );
}

export function BrandIcon({ children }: { children: ReactNode }) {
  return <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-[#3525cd] shadow-lg">{children}</span>;
}
