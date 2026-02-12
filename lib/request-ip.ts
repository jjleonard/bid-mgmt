import { headers } from "next/headers";

export async function getRequestIp() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");

  if (forwardedFor) {
    const [first] = forwardedFor.split(",");
    return first?.trim() || null;
  }

  const realIp = headerStore.get("x-real-ip");
  return realIp?.trim() || null;
}
