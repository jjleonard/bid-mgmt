import { prisma } from "@/lib/prisma";

export type BrandingSettings = {
  companyName: string | null;
  companyWebsite: string | null;
  supportEmail: string | null;
  logoPath: string | null;
};

const DEFAULT_ID = 1;

export async function getBranding() {
  return prisma.appBranding.findUnique({
    where: { id: DEFAULT_ID },
  });
}

export async function upsertBranding(data: BrandingSettings) {
  return prisma.appBranding.upsert({
    where: { id: DEFAULT_ID },
    create: { id: DEFAULT_ID, ...data },
    update: data,
  });
}
