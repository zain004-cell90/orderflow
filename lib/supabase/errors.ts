export function isInvalidRefreshTokenError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message || "")
        : String(error || "");

  return /invalid refresh token|refresh token not found|refresh_token_not_found|auth session missing|AuthSessionMissingError/i.test(
    message,
  );
}
