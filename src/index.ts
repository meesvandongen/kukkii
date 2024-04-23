import {
  CookieOptions,
  MaybeCookie,
  parse,
  parseSealed,
  parseSigned,
  serialize,
  serializeSealed,
  serializeSigned,
} from "./utils";

export function getCookie(headers: Headers, key?: string) {
  const cookie = headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return undefined;
    }
    const obj = parse(cookie, key);
    return obj[key];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);

  return obj as any;
}

interface GetSignedCookie {
  (
    headers: Headers,
    secret: string | BufferSource,
    key: string,
  ): Promise<MaybeCookie>;
  (headers: Headers, secret: string): Promise<Record<string, MaybeCookie>>;
}

export const getSignedCookie: GetSignedCookie = async (
  headers,
  secret,
  key?,
) => {
  const cookie = headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return false;
    }
    const obj = await parseSigned(cookie, secret, key);
    return obj[key] ?? false;
  }
  if (!cookie) {
    return {};
  }
  const obj = await parseSigned(cookie, secret);

  return obj as any;
};

export function setCookie(
  headers: Headers,
  name: string,
  value: string,
  opt?: CookieOptions,
): void {
  const cookie = serialize(name, value, { path: "/", ...opt });
  headers.append("set-cookie", cookie);
}

export async function setSignedCookie(
  headers: Headers,
  value: string,
  secret: string | BufferSource,
  name: string,
  opt?: CookieOptions,
): Promise<void> {
  const cookie = await serializeSigned(name, value, secret, {
    path: "/",
    ...opt,
  });
  headers.append("set-cookie", cookie);
}

export function deleteCookie(
  headers: Headers,
  name: string,
  opt?: CookieOptions,
): void {
  setCookie(headers, name, "", { ...opt, maxAge: 0 });
}

export async function setSealedCookie(
  headers: Headers,
  value: string,
  secret: string,
  name: string,
  opt?: CookieOptions,
): Promise<void> {
  const cookie = await serializeSealed(name, value, secret, {
    path: "/",
    ...opt,
  });
  headers.append("set-cookie", cookie);
}

interface GetSealedCookie {
  (headers: Headers, secret: string, key: string): Promise<MaybeCookie>;
  (headers: Headers, secret: string): Promise<Record<string, MaybeCookie>>;
}

export const getSealedCookie: GetSealedCookie = async (
  headers,
  secret,
  key?,
) => {
  const cookie = headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return false;
    }
    const obj = await parseSealed(cookie, secret, key);
    return obj[key] ?? false;
  }
  if (!cookie) {
    return {};
  }
  const obj = await parseSealed(cookie, secret);

  return obj as any;
};
