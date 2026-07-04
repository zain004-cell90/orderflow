const controls = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
export function sanitizeText(value: unknown, maxLength = 120) {
  return String(value ?? "")
    .replace(controls, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
export function sanitizeMultiline(value: unknown, maxLength = 1000) {
  return String(value ?? "")
    .replace(controls, "")
    .replace(/\r\n?/g, "\n")
    .trim()
    .slice(0, maxLength);
}
export function sanitizeEmail(value: unknown) {
  return sanitizeText(value, 254).toLowerCase();
}
export function sanitizePhone(value: unknown) {
  return sanitizeText(value, 32).replace(/[^\d+()\-\s]/g, "");
}
export function safeImageSource(value: unknown) {
  const source = String(value ?? "").trim();
  if (!source) return "";
  if (source.startsWith("/") && !source.startsWith("//")) return source;
  if (/^https:\/\//i.test(source)) return source;
  if (/^data:image\/(png|jpeg|webp|svg\+xml);base64,/i.test(source))
    return source;
  return "";
}
export function validateImageFile(file: File, maxBytes = 2_000_000) {
  if (
    !["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(
      file.type,
    )
  )
    return "Upload a PNG, JPG, WEBP, or SVG image.";
  if (file.size > maxBytes)
    return `Image must be smaller than ${Math.round(maxBytes / 1_000_000)} MB.`;
  return "";
}
export function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}
