import { ReactNode } from "react";import { AuthProvider } from "@/components/auth/auth-provider";
export default function PublicLayout({children}:{children:ReactNode}){return <AuthProvider>{children}</AuthProvider>}
