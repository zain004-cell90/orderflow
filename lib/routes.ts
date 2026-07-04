export const routes = {
  home: "/",
  features: "/#features",
  howItWorks: "/#how-it-works",
  demo: "/#demo",
  pricing: "/#pricing",
  faq: "/#faq",
  contact: "/contact",
  track: "/track",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  checkEmail: "/check-email",
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  orders: "/dashboard/orders",
  products: "/dashboard/products",
  customers: "/dashboard/customers",
  checkout: "/dashboard/checkout",
  analytics: "/dashboard/analytics",
  settings: "/dashboard/settings",
  admin: "/admin",
} as const;

export type AppRoute = (typeof routes)[keyof typeof routes];

export interface NavigationLink {
  label: string;
  href?: AppRoute;
  disabled?: boolean;
}

export const marketingNavigation: NavigationLink[] = [
  { label: "Features", href: routes.features },
  { label: "How It Works", href: routes.howItWorks },
  { label: "Watch Demo", href: routes.demo },
  { label: "Pricing", href: routes.pricing },
  { label: "FAQ", href: routes.faq },
];

export const productFooterLinks: NavigationLink[] = [
  { label: "Features", href: routes.features },
  { label: "How It Works", href: routes.howItWorks },
  { label: "Watch Demo", href: routes.demo },
  { label: "Pricing", href: routes.pricing },
];

export const companyFooterLinks: NavigationLink[] = [
  { label: "Contact", href: routes.contact },
  { label: "Track Order", href: routes.track },
  { label: "Log In", href: routes.login },
  { label: "Start Free", href: routes.signup },
  { label: "Privacy", disabled: true },
  { label: "Terms", disabled: true },
];
