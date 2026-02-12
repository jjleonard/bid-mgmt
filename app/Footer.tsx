import { getCurrentUser } from "@/lib/auth";
import { getBranding } from "@/lib/branding";

export default async function Footer() {
  const [user, branding] = await Promise.all([getCurrentUser(), getBranding()]);
  const fallbackName = "Bid Manager";
  const fallbackWebsite = process.env.APP_BASE_URL?.trim() || "http://localhost:3000";
  const companyName = branding?.companyName || fallbackName;
  const companyWebsite = branding?.companyWebsite || fallbackWebsite;
  const hasBranding = Boolean(companyName || companyWebsite);
  const showSupportEmail = Boolean(user && branding?.supportEmail);

  if (!hasBranding && !showSupportEmail) {
    return null;
  }

  return (
    <footer className="border-t border-sand-200/80 bg-sand-50/90">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 py-6 text-sm text-ink-600 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {companyName ? (
            <span className="font-medium text-ink-700">{companyName}</span>
          ) : null}
          {companyWebsite ? (
            <a
              href={companyWebsite}
              target="_blank"
              rel="noreferrer"
              className="text-ink-500 transition hover:text-ink-700"
            >
              {companyWebsite}
            </a>
          ) : null}
        </div>
        {showSupportEmail ? (
          <a
            href={`mailto:${branding?.supportEmail ?? ""}`}
            className="text-ink-500 transition hover:text-ink-700"
          >
            {branding?.supportEmail}
          </a>
        ) : null}
      </div>
    </footer>
  );
}
