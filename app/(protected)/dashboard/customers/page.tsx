import { Suspense } from "react";import { CustomersPage } from "@/components/dashboard/customers-page";
export default function Page(){return <Suspense fallback={null}><CustomersPage/></Suspense>}
