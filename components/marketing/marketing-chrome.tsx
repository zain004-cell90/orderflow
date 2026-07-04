"use client";

import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { companyFooterLinks, marketingNavigation, type NavigationLink, productFooterLinks, routes } from "@/lib/routes";

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return <><header className="marketing-nav"><Link className="brand" href={routes.home}><span className="brand-mark text-[11px]">OF</span><span>OrderFlow</span></Link><nav className="marketing-links" aria-label="Main navigation">{marketingNavigation.map(({label,href})=><Link key={label} href={href!}>{label}</Link>)}</nav><div className="marketing-nav-actions flex items-center gap-2"><Link className="hidden sm:inline-flex btn-secondary !rounded-full" href={routes.login}>Login</Link><Link className="btn-primary !rounded-full" href={routes.signup}>Start Free <ArrowRight size={14}/></Link><button type="button" className="marketing-menu-toggle icon-button" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Toggle menu" aria-expanded={mobileOpen} aria-controls="mobile-marketing-menu">{mobileOpen?<X size={18}/>:<Menu size={18}/>}</button></div></header>{mobileOpen&&<nav id="mobile-marketing-menu" className="marketing-mobile-menu fixed z-40 top-20 left-4 right-4 card p-3" aria-label="Mobile navigation">{marketingNavigation.map(({label,href})=><Link key={label} onClick={()=>setMobileOpen(false)} className="block px-4 py-3 text-sm font-semibold" href={href!}>{label}</Link>)}</nav>}</>;
}

export function MarketingFooter() {
  return <footer className="marketing-footer"><div className="footer-cta"><div><h2>Still collecting orders in DMs?</h2><p>Send one link and get every order automatically.</p></div><Link href={routes.signup} className="btn-primary">Start Free Now</Link></div><div className="footer-grid"><div><Link href={routes.home} className="brand"><span className="brand-mark text-sm">OF</span><span>OrderFlow</span></Link><p className="text-sm leading-6 text-gray-400 max-w-xs mt-5">One checkout link. Every order organized. Built for the next generation of social commerce sellers.</p></div><FooterLinks title="Product" links={productFooterLinks}/><FooterLinks title="Company" links={companyFooterLinks}/></div><div className="footer-bottom"><span>© 2026 OrderFlow. All rights reserved.</span><span>Twitter · Instagram · LinkedIn</span></div></footer>;
}

function FooterLinks({title,links}:{title:string;links:NavigationLink[]}) {
  return <div><h4>{title}</h4><div className="footer-links">{links.map(({label,href,disabled})=>disabled?<span className="cursor-not-allowed opacity-50" aria-disabled="true" key={label}>{label}</span>:<Link href={href!} key={label}>{label}</Link>)}</div></div>;
}
