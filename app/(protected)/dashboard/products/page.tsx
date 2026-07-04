import { Suspense } from "react";import { ProductsPage } from "@/components/dashboard/products-page";
export default function Page(){return <Suspense fallback={null}><ProductsPage/></Suspense>}
