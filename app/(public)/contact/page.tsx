import type { Metadata } from "next";import { ContactPage } from "@/components/public/contact-page";
export const metadata:Metadata={title:"Contact Us | OrderFlow",description:"Contact OrderFlow support.",alternates:{canonical:"/contact"}};export default function Page(){return <ContactPage/>}
