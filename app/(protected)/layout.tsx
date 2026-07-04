import { ReactNode } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ProtectedAccountGate } from "@/components/auth/protected-account-gate";
import { DashboardProvider } from "@/components/dashboard/dashboard-store";
export default function ProtectedLayout({children}:{children:ReactNode}){return <AuthProvider><ProtectedAccountGate><DashboardProvider>{children}</DashboardProvider></ProtectedAccountGate></AuthProvider>}
