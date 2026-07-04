export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return normalizeUrl(explicit);

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProduction) return normalizeUrl(vercelProduction);

  const vercelDeployment = process.env.VERCEL_URL;
  if (vercelDeployment) return normalizeUrl(vercelDeployment);

  return "http://localhost:3000";
}

function normalizeUrl(value: string) {
  const withProtocol = value.startsWith("http") ? value : `https://${value}`;
  return withProtocol.replace(/\/$/, "");
}
