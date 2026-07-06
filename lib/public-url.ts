const productionUrl = "https://orderflow-eight-eta.vercel.app";

export function getPublicAppUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && !isLocalUrl(configured)) return normalizeUrl(configured);

  return productionUrl;
}

export function getAuthRedirectUrl(path = "/login") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getPublicAppUrl()}${normalizedPath}`;
}

function normalizeUrl(value: string) {
  const withProtocol = value.startsWith("http") ? value : `https://${value}`;
  return withProtocol.replace(/\/$/, "");
}

function isLocalUrl(value: string) {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/i.test(value);
}
