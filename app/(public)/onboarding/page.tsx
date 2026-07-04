import type { Metadata } from "next";import { OnboardingPage } from "@/components/public/onboarding-page";
export const metadata:Metadata={title:"OrderFlow Onboarding",robots:{index:false,follow:false}};export default function Page(){return <OnboardingPage/>}
