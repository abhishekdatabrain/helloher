export const normalizeBaseUrl = (value?: string) => {
  if (!value) return "";
  return value.endsWith("/") ? value : `${value}/`;
};

export const buildApiUrl = (baseUrl: string | undefined, path: string) => {
  const normalizedBase = normalizeBaseUrl(baseUrl);

  if (!normalizedBase) return path;

  try {
    return new URL(path, normalizedBase).toString();
  } catch {
    return `${normalizedBase}${path.replace(/^\/+/, "")}`;
  }
};
