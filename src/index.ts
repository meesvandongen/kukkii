import {
  Cookie,
  CookieOptions,
  CookiePrefixOptions,
  SignedCookie,
  parse,
  parseSigned,
  serialize,
  serializeSigned,
} from "./utils";
import { seal, unseal, defaults as sealDefaults } from "iron-webcrypto";

interface GetCookie {
  (headers: Headers, key: string): string | undefined;
  (headers: Headers): Cookie;
  (
    headers: Headers,
    key: string,
    prefixOptions: CookiePrefixOptions,
  ): string | undefined;
}

export const getCookie: GetCookie = (
  headers,
  key?,
  prefix?: CookiePrefixOptions,
) => {
  const cookie = headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return undefined;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj = parse(cookie, finalKey);
    return obj[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = parse(cookie);
  return obj as any;
};

interface GetSignedCookie {
  (
    headers: Headers,
    secret: string | BufferSource,
    key: string,
  ): Promise<string | undefined | false>;
  (headers: Headers, secret: string): Promise<SignedCookie>;
  (
    headers: Headers,
    secret: string | BufferSource,
    key: string,
    prefixOptions: CookiePrefixOptions,
  ): Promise<string | undefined | false>;
}

export const getSignedCookie: GetSignedCookie = async (
  headers,
  secret,
  key?,
  prefix?: CookiePrefixOptions,
) => {
  const cookie = headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) {
      return undefined;
    }
    let finalKey = key;
    if (prefix === "secure") {
      finalKey = "__Secure-" + key;
    } else if (prefix === "host") {
      finalKey = "__Host-" + key;
    }
    const obj = await parseSigned(cookie, secret, finalKey);
    return obj[finalKey];
  }
  if (!cookie) {
    return {};
  }
  const obj = await parseSigned(cookie, secret);
  return obj as any;
};

export const setCookie = (
  headers: Headers,
  name: string,
  value: string,
  opt?: CookieOptions,
): void => {
  // Cookie names prefixed with __Secure- can be used only if they are set with the secure attribute.
  // Cookie names prefixed with __Host- can be used only if they are set with the secure attribute, must have a path of / (meaning any path at the host)
  // and must not have a Domain attribute.
  // Read more at https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#cookie_prefixes'
  let cookie;
  if (opt?.prefix === "secure") {
    cookie = serialize("__Secure-" + name, value, {
      path: "/",
      ...opt,
      secure: true,
    });
  } else if (opt?.prefix === "host") {
    cookie = serialize("__Host-" + name, value, {
      ...opt,
      path: "/",
      secure: true,
      domain: undefined,
    });
  } else {
    cookie = serialize(name, value, { path: "/", ...opt });
  }
  headers.append("set-cookie", cookie);
};

export const setSignedCookie = async (
  headers: Headers,
  name: string,
  value: string,
  secret: string | BufferSource,
  opt?: CookieOptions,
): Promise<void> => {
  let cookie;
  if (opt?.prefix === "secure") {
    cookie = await serializeSigned("__Secure-" + name, value, secret, {
      path: "/",
      ...opt,
      secure: true,
    });
  } else if (opt?.prefix === "host") {
    cookie = await serializeSigned("__Host-" + name, value, secret, {
      ...opt,
      path: "/",
      secure: true,
      domain: undefined,
    });
  } else {
    cookie = await serializeSigned(name, value, secret, { path: "/", ...opt });
  }
  headers.append("set-cookie", cookie);
};

export const deleteCookie = (
  headers: Headers,
  name: string,
  opt?: CookieOptions,
): void => {
  setCookie(headers, name, "", { ...opt, maxAge: 0 });
};

export const setSealedCookie = async (
  headers: Headers,
  name: string,
  value: string,
  secret: string | Uint8Array,
  opt?: CookieOptions,
): Promise<void> => {
  const sealed = await seal(globalThis.crypto, value, secret, {
    ...sealDefaults,
    ttl: opt?.maxAge ? opt.maxAge * 1000 : 0,
  });
  setCookie(headers, name, sealed, opt);
};
