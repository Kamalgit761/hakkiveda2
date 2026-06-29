import { useEffect, useState } from "react";

const BACKEND = process.env.REACT_APP_BACKEND_URL;

/**
 * Resolves an image URL — prepends backend host for /api/static paths.
 */
export const useImage = (src) => {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  if (src.startsWith("/api/")) return `${BACKEND}${src}`;
  return src;
};

export const resolveImage = (src) => {
  if (!src) return "";
  if (src.startsWith("http")) return src;
  if (src.startsWith("/api/")) return `${BACKEND}${src}`;
  return src;
};
