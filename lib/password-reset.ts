import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const DEFAULT_TTL_MINUTES = 30;
const DEFAULT_APP_BASE_URL = "http://localhost:3000";

const getTtlMinutes = () => {
  const raw = process.env.PASSWORD_RESET_TTL_MINUTES;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TTL_MINUTES;
};

const getAppBaseUrl = () => process.env.APP_BASE_URL?.trim() || DEFAULT_APP_BASE_URL;

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export type PasswordResetPayload = {
  token: string;
  expiresAt: Date;
};

export async function createPasswordResetToken(userId: string): Promise<PasswordResetPayload> {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + getTtlMinutes() * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({
    where: { userId },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function sendPasswordResetForEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
    },
  });

  if (!user) {
    return;
  }

  const { token, expiresAt } = await createPasswordResetToken(user.id);
  const appBaseUrl = getAppBaseUrl();
  const resetLink = `${appBaseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const ttlMinutes = getTtlMinutes();

  const subject = "Reset your password";
  const greeting = user.firstName ? `Hi ${user.firstName},` : "Hi,";
  const text = [
    greeting,
    "",
    "We received a request to reset your password.",
    `Use this link within ${ttlMinutes} minutes:`,
    resetLink,
    "",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
  const html = `
    <p>${greeting}</p>
    <p>We received a request to reset your password.</p>
    <p><a href="${resetLink}">Reset your password</a></p>
    <p>This link expires in ${ttlMinutes} minutes.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  await sendEmail({
    to: user.email,
    subject,
    text,
    html,
  });
}

export async function findValidPasswordResetToken(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  if (!record) {
    return null;
  }

  if (record.usedAt || record.expiresAt <= new Date()) {
    return null;
  }

  return record;
}

export async function markPasswordResetUsed(id: string) {
  await prisma.passwordResetToken.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}
