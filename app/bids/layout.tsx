import type { ReactNode } from "react";

import { requireAdminUser } from "@/lib/auth";

export default async function BidsLayout({ children }: { children: ReactNode }) {
  await requireAdminUser();

  return <>{children}</>;
}
