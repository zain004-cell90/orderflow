import { cookies } from "next/headers";
import type { MockAuthSession } from "./types";
import { AUTH_COOKIE } from "./mock-auth";

export async function getServerMockSession():Promise<MockAuthSession|null>{
  const value=(await cookies()).get(AUTH_COOKIE)?.value;if(!value)return null;
  try{return JSON.parse(decodeURIComponent(value)) as MockAuthSession}catch{return null}
}
