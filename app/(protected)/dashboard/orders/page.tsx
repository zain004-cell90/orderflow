import { Suspense } from "react";import { OrdersPage } from "@/components/dashboard/orders-page";
export default function Page(){return <Suspense fallback={null}><OrdersPage/></Suspense>}
