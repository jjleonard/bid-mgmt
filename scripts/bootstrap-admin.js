const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { execSync } = require("child_process");

const deployEnvPath = path.join(process.cwd(), "deploy", ".env");

if (fs.existsSync(deployEnvPath)) {
  dotenv.config({ path: deployEnvPath });
} else {
  dotenv.config();
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:/data/dev.db";
}

const prisma = new PrismaClient();

const required = [
  "ADMIN_BOOTSTRAP_EMAIL",
  "ADMIN_BOOTSTRAP_PASSWORD",
  "ADMIN_BOOTSTRAP_FIRST_NAME",
  "ADMIN_BOOTSTRAP_SURNAME",
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

execSync("npx prisma migrate deploy", {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || "file:/data/dev.db",
  },
});

const email = String(process.env.ADMIN_BOOTSTRAP_EMAIL).trim().toLowerCase();
const password = String(process.env.ADMIN_BOOTSTRAP_PASSWORD);
const firstName = String(process.env.ADMIN_BOOTSTRAP_FIRST_NAME).trim();
const surname = String(process.env.ADMIN_BOOTSTRAP_SURNAME).trim();
const role = "admin";

if (!email.includes("@")) {
  console.error("ADMIN_BOOTSTRAP_EMAIL must be a valid email address.");
  process.exit(1);
}

if (password.length < 10) {
  console.error("ADMIN_BOOTSTRAP_PASSWORD must be at least 10 characters.");
  process.exit(1);
}

if (!firstName || !surname) {
  console.error("ADMIN_BOOTSTRAP_FIRST_NAME and ADMIN_BOOTSTRAP_SURNAME are required.");
  process.exit(1);
}

async function run() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true, email: true },
  });

  if (existingAdmin) {
    console.log("An admin user already exists. Bootstrap aborted.");
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    console.log("User already exists. Bootstrap aborted.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      firstName,
      surname,
      email,
      role,
      passwordHash,
    },
  });

  console.log(`Admin user created for ${email}.`);
}

run()
  .catch((error) => {
    console.error("Failed to bootstrap admin user:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
