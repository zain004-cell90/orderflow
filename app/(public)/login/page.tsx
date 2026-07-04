import type { Metadata } from "next";import { Suspense } from "react";import { LoginPage } from "@/components/public/auth-pages";
export const metadata:Metadata={title:"Log In | OrderFlow",description:"Log in to manage your OrderFlow store.",alternates:{canonical:"/login"}};export default function Page(){return <Suspense fallback={null}><LoginPage/></Suspense>}
