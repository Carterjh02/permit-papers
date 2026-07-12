import { cookies } from "next/headers";

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function logCookies() {
  const cookieStore = await cookies();
  console.log("🍪 [server cookies]", cookieStore.getAll());
}
