import {
  CookieOptions,
  parse,
  parseSigned,
  serialize,
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

export async function getSignedCookie(
  headers: Headers,
  secret: string | BufferSource,
  key?: string,
) {
  const cookie = headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return undefined;
    }
    const obj = await parseSigned(cookie, secret, key);
    return obj[key];
  }
  if (!cookie) {
    return {};
  }
  const obj = await parseSigned(cookie, secret);

  return obj as any;
}

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
  name: string,
  value: string,
  secret: string | BufferSource,
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
