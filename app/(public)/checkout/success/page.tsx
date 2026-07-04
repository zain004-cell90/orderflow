import type { Metadata } from "next";import { Suspense } from "react";import { CheckoutSuccessPage } from "@/components/public/checkout-success-page";
export const metadata:Metadata={title:"Order Received | OrderFlow",robots:{index:false,follow:false}};export default function Page(){return <Suspense fallback={<main className="checkout-success-page"/>}><CheckoutSuccessPage/></Suspense>}
