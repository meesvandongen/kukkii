import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import {
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
  deleteCookie,
  setSealedCookie,
  getSealedCookie,
} from ".";
import { seal, unseal } from "./iron-webcrypto/iron-webcrypto";

// Sealing passwords must be at least 32 characters, as in iron.
const SECRET = "secret choco chips that are long enough!";

describe("Parse cookie", () => {
  it("gets cookie", async () => {
    const headers = new Headers({
      Cookie: "yummy_cookie=choco; tasty_cookie=strawberry",
    });

    expect(getCookie(headers)).toEqual({
      yummy_cookie: "choco",
      tasty_cookie: "strawberry",
    });
  });

  it("gets cookie with key", async () => {
    const headers = new Headers({
      Cookie: "yummy_cookie=choco; tasty_cookie=strawberry",
    });

    expect(getCookie(headers, "yummy_cookie")).toBe("choco");
    expect(getCookie(headers, "tasty_cookie")).toBe("strawberry");
  });

  it("gets signed cookies", async () => {
    const headers = new Headers({
      Cookie:
        "fortune_cookie=lots-of-money.UO6vMygDM6NCDU4LdvBnzdVb2Xcdj+h+ZTnmS8X7iH8%3D; fruit_cookie=mango.lRwgtW9ooM9%2Fd9ZZA%2FInNRG64CbQsfWGXQyFLPM9520%3D",
    });

    expect(await getSignedCookie(headers, "secret lucky charm")).toEqual({
      fortune_cookie: "lots-of-money",
      fruit_cookie: "mango",
    });
  });

  it("gets signed cookies with key", async () => {
    const headers = new Headers({
      Cookie:
        "fortune_cookie=lots-of-money.UO6vMygDM6NCDU4LdvBnzdVb2Xcdj+h+ZTnmS8X7iH8%3D; fruit_cookie=mango.lRwgtW9ooM9%2Fd9ZZA%2FInNRG64CbQsfWGXQyFLPM9520%3D",
    });

    expect(
      await getSignedCookie(headers, "secret lucky charm", "fortune_cookie"),
    ).toBe("lots-of-money");

    expect(
      await getSignedCookie(headers, "secret lucky charm", "fruit_cookie"),
    ).toBe("mango");
  });

  it("does not get cookies with invalid signature", async () => {
    const headers = new Headers({
      Cookie:
        // fruit_cookie has invalid signature
        "fortune_cookie=lots-of-money.UO6vMygDM6NCDU4LdvBnzdVb2Xcdj+h+ZTnmS8X7iH8%3D; fruit_cookie=mango.LAa7RX43t2vCrLNcKmNG65H41OkyV02sraRPuY5RuVg%3D",
    });

    const signedCookie = await getSignedCookie(headers, "secret lucky charm");

    expect(signedCookie).toEqual({
      fortune_cookie: "lots-of-money",
      fruit_cookie: false,
    });
  });

  it("does not get cookies with invalid signature with key", async () => {
    const headers = new Headers({
      Cookie:
        // fruit_cookie has invalid signature
        "fortune_cookie=lots-of-money.UO6vMygDM6NCDU4LdvBnzdVb2Xcdj+h+ZTnmS8X7iH8%3D; fruit_cookie=mango.LAa7RX43t2vCrLNcKmNG65H41OkyV02sraRPuY5RuVg%3D",
    });

    expect(
      await getSignedCookie(headers, "secret lucky charm", "fortune_cookie"),
    ).toBe("lots-of-money");

    expect(
      await getSignedCookie(headers, "secret lucky charm", "fruit_cookie"),
    ).toBe(false);
  });

  it("gets null if the value is undefined", () => {
    const headers = new Headers({
      Cookie: "yummy_cookie=",
    });

    expect(getCookie(headers, "yummy_cookie")).toBe("");
  });
});

describe("Set cookie", () => {
  it("Set cookie with setCookie()", async () => {
    const headers = new Headers();
    setCookie(headers, "delicious_cookie", "macha");
    const header = headers.get("Set-Cookie");
    expect(header).toBe("delicious_cookie=macha; Path=/");
  });

  it("Set cookie with setCookie() and path option", async () => {
    const headers = new Headers();
    setCookie(headers, "delicious_cookie", "macha", { path: "/a" });
    const header = headers.get("Set-Cookie");
    expect(header).toBe("delicious_cookie=macha; Path=/a");
  });

  it("Set signed cookie with setSignedCookie()", async () => {
    const headers = new Headers();
    await setSignedCookie(
      headers,
      "macha",
      "secret chocolate chips",
      "delicious_cookie",
    );
    const header = headers.get("Set-Cookie");
    expect(header).toBe(
      "delicious_cookie=macha.diubJPY8O7hI1pLa42QSfkPiyDWQ0I4DnlACH%2FN2HaA%3D; Path=/",
    );
  });

  it("Set signed cookie with setSignedCookie() and path option", async () => {
    const headers = new Headers();
    await setSignedCookie(
      headers,
      "macha",
      "secret chocolate chips",
      "delicious_cookie",
      { path: "/a" },
    );
    const header = headers.get("Set-Cookie");
    expect(header).toBe(
      "delicious_cookie=macha.diubJPY8O7hI1pLa42QSfkPiyDWQ0I4DnlACH%2FN2HaA%3D; Path=/a",
    );
  });

  it("Complex pattern", async () => {
    const headers = new Headers();
    setCookie(headers, "great_cookie", "banana", {
      path: "/",
      secure: true,
      domain: "example.com",
      httpOnly: true,
      maxAge: 1000,
      expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
      sameSite: "Strict",
    });
    const header = headers.get("Set-Cookie");
    expect(header).toBe(
      "great_cookie=banana; Max-Age=1000; Domain=example.com; Path=/; Expires=Sun, 24 Dec 2000 10:30:59 GMT; HttpOnly; Secure; SameSite=Strict",
    );
  });

  it("Complex pattern (signed)", async () => {
    const headers = new Headers();
    await setSignedCookie(
      headers,
      "banana",
      "secret chocolate chips",
      "great_cookie",
      {
        path: "/",
        secure: true,
        domain: "example.com",
        httpOnly: true,
        maxAge: 1000,
        expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
        sameSite: "Strict",
      },
    );

    const header = headers.get("Set-Cookie");
    expect(header).toBe(
      "great_cookie=banana.hSo6gB7YT2db0WBiEAakEmh7dtwEL0DSp76G23WvHuQ%3D; Max-Age=1000; Domain=example.com; Path=/; Expires=Sun, 24 Dec 2000 10:30:59 GMT; HttpOnly; Secure; SameSite=Strict",
    );
  });

  it("Multiple values", async () => {
    const headers = new Headers();
    setCookie(headers, "delicious_cookie", "macha");
    setCookie(headers, "delicious_cookie", "choco");
    const header = headers.get("Set-Cookie");

    expect(header).toBe(
      "delicious_cookie=macha; Path=/, delicious_cookie=choco; Path=/",
    );
  });
});

describe("Delete cookie", () => {
  it("Delete cookie", async () => {
    const headers = new Headers();
    deleteCookie(headers, "delicious_cookie");
    const header = headers.get("Set-Cookie");
    expect(header).toBe("delicious_cookie=; Max-Age=0; Path=/");
  });

  it("Delete multiple cookies", async () => {
    const headers = new Headers();
    deleteCookie(headers, "delicious_cookie");
    deleteCookie(headers, "delicious_cookie2");

    const header = headers.get("Set-Cookie");
    expect(header).toBe(
      "delicious_cookie=; Max-Age=0; Path=/, delicious_cookie2=; Max-Age=0; Path=/",
    );
  });

  it("Delete cookie with options", async () => {
    const headers = new Headers();
    deleteCookie(headers, "delicious_cookie", {
      path: "/",
      secure: true,
      domain: "example.com",
    });
    const header = headers.get("Set-Cookie");
    expect(header).toBe(
      "delicious_cookie=; Max-Age=0; Domain=example.com; Path=/; Secure",
    );
  });
});

describe("Sealed cookie", () => {
  it("Set/Get sealed cookie", async () => {
    const responseHeaders = new Headers();
    await setSealedCookie(responseHeaders, "macha", SECRET, "delicious_cookie");
    const header = responseHeaders.get("Set-Cookie")!;
    expect(header).toMatch(/delicious_cookie=.*; Path=\//);

    const sealed = header.split(";")[0].split("=")[1];

    const requestHeaders = new Headers({
      Cookie: `delicious_cookie=${sealed}`,
    });

    const value = await getSealedCookie(
      requestHeaders,
      SECRET,
      "delicious_cookie",
    );

    expect(value).toBe("macha");
  });

  it("Set/Get sealed cookie with options", async () => {
    const responseHeaders = new Headers();
    await setSealedCookie(
      responseHeaders,
      "macha",
      SECRET,
      "delicious_cookie",
      { path: "/a" },
    );
    const header = responseHeaders.get("Set-Cookie")!;

    expect(header).toMatch(/delicious_cookie=.*\*.*; Path=\/a/);

    const sealed = header.split(";")[0].split("=")[1];

    const requestHeaders = new Headers({
      Cookie: `delicious_cookie=${sealed}`,
    });

    const value = await getSealedCookie(
      requestHeaders,
      SECRET,
      "delicious_cookie",
    );

    expect(value).toBe("macha");
  });

  it("Get sealed cookie with multiple values", async () => {
    const requestHeaders = new Headers({
      Cookie: `delicious_cookie=${encodeURIComponent(await seal("macha", SECRET))}; more_delicious_cookie=${encodeURIComponent(await seal("choco", SECRET))};`,
    });

    const value = await getSealedCookie(requestHeaders, SECRET);

    expect(value).toEqual({
      delicious_cookie: "macha",
      more_delicious_cookie: "choco",
    });
  });

  it("rejects when sealed cookie has invalid signature", async () => {
    const responseHeaders = new Headers();
    await setSealedCookie(responseHeaders, "macha", SECRET, "delicious_cookie");
    const header = responseHeaders.get("Set-Cookie")!;
    expect(header).toMatch(/delicious_cookie=.*\*.*; Path=\//);

    const sealed = header.split(";")[0].split("=")[1];

    const requestHeaders = new Headers({
      Cookie: `delicious_cookie=${sealed}`,
    });

    expect(
      await getSealedCookie(
        requestHeaders,
        "a different secret that is long enough",
        "delicious_cookie",
      ),
    ).toBe(false);
  });

  it("rejects when sealed cookie has invalid value", async () => {
    const requestHeaders = new Headers({
      Cookie: `delicious_cookie=invalid_value`,
    });

    expect(
      await getSealedCookie(requestHeaders, SECRET, "delicious_cookie"),
    ).toBe(false);
  });
});

describe("Sealed cookie hardening", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects passwords shorter than 32 characters", async () => {
    await expect(
      setSealedCookie(new Headers(), "macha", "too short", "cookie"),
    ).rejects.toThrow(/min 32 characters/);
    await expect(seal("macha", "too short")).rejects.toThrow(/min 32/);

    const sealed = await seal("macha", SECRET);
    await expect(unseal(sealed, "too short")).rejects.toThrow(/min 32/);
    expect(
      await getSealedCookie(
        new Headers({ Cookie: `c=${encodeURIComponent(sealed)}` }),
        "too short",
        "c",
      ),
    ).toBe(false);
  });

  it("keeps unsealing values without an expiry", async () => {
    const sealed = await seal("macha", SECRET);
    expect(sealed.split("*")).toHaveLength(5);
    expect(await unseal(sealed, SECRET)).toBe("macha");
  });

  it("expires sealed cookies together with their Max-Age", async () => {
    vi.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") });
    const responseHeaders = new Headers();
    await setSealedCookie(responseHeaders, "macha", SECRET, "c", {
      maxAge: 60,
    });
    const value = responseHeaders.get("Set-Cookie")!.split(";")[0].slice(2);
    expect(decodeURIComponent(value).split("*")).toHaveLength(6);
    const requestHeaders = new Headers({ Cookie: `c=${value}` });

    vi.setSystemTime(new Date("2026-01-01T00:00:59Z"));
    expect(await getSealedCookie(requestHeaders, SECRET, "c")).toBe("macha");

    // A copy kept after the cookie expired no longer unseals.
    vi.setSystemTime(new Date("2026-01-01T00:01:00Z"));
    expect(await getSealedCookie(requestHeaders, SECRET, "c")).toBe(false);
  });

  it("expires sealed cookies at their Expires date", async () => {
    vi.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") });
    const sealedHeaders = new Headers();
    await setSealedCookie(sealedHeaders, "macha", SECRET, "c", {
      expires: new Date("2026-01-02T00:00:00Z"),
    });
    const value = sealedHeaders.get("Set-Cookie")!.split(";")[0].slice(2);
    const requestHeaders = new Headers({ Cookie: `c=${value}` });

    expect(await getSealedCookie(requestHeaders, SECRET, "c")).toBe("macha");
    vi.setSystemTime(new Date("2026-01-02T00:00:00Z"));
    expect(await getSealedCookie(requestHeaders, SECRET, "c")).toBe(false);
  });

  it("authenticates the expiry, so it cannot be extended", async () => {
    const sealed = await seal("macha", SECRET, { ttl: 60_000 });
    const parts = sealed.split("*");
    parts[3] = String(Number(parts[3]) + 365 * 24 * 60 * 60 * 1000);
    await expect(unseal(parts.join("*"), SECRET)).rejects.toThrow(
      "Bad hmac value",
    );
  });
});
