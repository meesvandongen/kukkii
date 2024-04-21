import { expect, it, describe } from "bun:test";

import {
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
  deleteCookie,
} from ".";

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
      "delicious_cookie",
      "macha",
      "secret chocolate chips",
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
      "delicious_cookie",
      "macha",
      "secret chocolate chips",
      { path: "/a" },
    );
    const header = headers.get("Set-Cookie");
    expect(header).toBe(
      "delicious_cookie=macha.diubJPY8O7hI1pLa42QSfkPiyDWQ0I4DnlACH%2FN2HaA%3D; Path=/a",
    );
  });

  it("Set cookie with secure prefix", async () => {
    const headers = new Headers();
    setCookie(headers, "delicious_cookie", "macha", {
      prefix: "secure",
      secure: false,
    });
    const header = headers.get("Set-Cookie");
    expect(header).toBe("__Secure-delicious_cookie=macha; Path=/; Secure");
  });

  it("Get cookie with secure prefix", async () => {
    const headers = new Headers({
      Cookie: "__Secure-delicious_cookie=macha",
    });
    const cookie = getCookie(headers, "delicious_cookie", "secure");
    expect(cookie).toBe("macha");
  });

  it("Set cookie with host prefix", async () => {
    const headers = new Headers();
    setCookie(headers, "delicious_cookie", "macha", {
      prefix: "host",
      path: "/foo",
      domain: "example.com",
      secure: false,
    });
    const header = headers.get("Set-Cookie");
    expect(header).toBe("__Host-delicious_cookie=macha; Path=/; Secure");
  });

  it("Get cookie with host prefix", async () => {
    const headers = new Headers({
      Cookie: "__Host-delicious_cookie=macha",
    });
    const cookie = getCookie(headers, "delicious_cookie", "host");
    expect(cookie).toBe("macha");
  });

  it("Set signed cookie with secure prefix", async () => {
    const headers = new Headers();
    await setSignedCookie(
      headers,
      "delicious_cookie",
      "macha",
      "secret choco chips",
      {
        prefix: "secure",
      },
    );
    const header = headers.get("Set-Cookie");
    expect(header).toBe(
      "__Secure-delicious_cookie=macha.i225faTyCrJUY8TvpTuJHI20HBWbQ89B4GV7lT4E%2FB0%3D; Path=/; Secure",
    );
  });

  it("Set signed cookie with host prefix", async () => {
    const headers = new Headers({});
    await setSignedCookie(
      headers,
      "delicious_cookie",
      "macha",
      "secret choco chips",
      {
        prefix: "host",
        domain: "example.com", // this will be ignored
        path: "example.com", // thi will be ignored
        secure: false, // this will be ignored
      },
    );
    const header = headers.get("Set-Cookie");
    expect(header).toBe(
      "__Host-delicious_cookie=macha.i225faTyCrJUY8TvpTuJHI20HBWbQ89B4GV7lT4E%2FB0%3D; Path=/; Secure",
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
      "great_cookie",
      "banana",
      "secret chocolate chips",
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
