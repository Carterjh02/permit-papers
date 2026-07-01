import { cookies } from "next/headers";

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
