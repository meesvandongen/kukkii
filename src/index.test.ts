import { expect, it, describe } from "bun:test";

import {
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
  deleteCookie,
  setSealedCookie,
  getSealedCookie,
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
    await setSealedCookie(
      responseHeaders,
      "macha",
      "secret choco chips",
      "delicious_cookie",
    );
    const header = responseHeaders.get("Set-Cookie")!;
    expect(header).toMatch(/delicious_cookie=.*; Path=\//);

    const sealed = header.split(";")[0].split("=")[1];

    const requestHeaders = new Headers({
      Cookie: `delicious_cookie=${sealed}`,
    });

    const value = await getSealedCookie(
      requestHeaders,
      "secret choco chips",
      "delicious_cookie",
    );

    expect(value).toBe("macha");
  });

  it("Set/Get sealed cookie with options", async () => {
    const responseHeaders = new Headers();
    await setSealedCookie(
      responseHeaders,
      "macha",
      "secret choco chips",
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
      "secret choco chips",
      "delicious_cookie",
    );

    expect(value).toBe("macha");
  });

  it("Get sealed cookie with multiple values", async () => {
    const requestHeaders = new Headers({
      Cookie: `delicious_cookie=8a5d7b4a8dcfb3ac0913c2b5ccbbab0edd92eb3f4310f3855795fd3f5627a971*yWLj-68VC_pBNO5IEVSLnQ*Me1qiB1z2QzHNgyiOffxmg*6a86ee89ab37c2ba412fc5c209c3b410ae74b4bc58252e3c243105e29f886b70*u2aXeBW7u_GxzBZegqec4DLQ7EUBu8jd2E4LhETUk9M; more_delicious_cookie=c1695ec7a4c3a1dc4aa6d20dcff7e883b1f67a8e9d51d01091ad1fe32c7367c1*RPNWq0S0wdCDay9YLYu_qA*IagkAhDRtGA5JUx9QTVUpg*6304d35fe58fa0fb1f8dd51e861a8e2dec3a4bae1daa94a5bfd1946a48aeba88*bP4Yt5y-EZ9U1iI1BfZbXd8MWWE1IyGKj5AQTuZVmIg;`,
    });

    const value = await getSealedCookie(requestHeaders, "secret");

    expect(value).toEqual({
      delicious_cookie: "macha",
      more_delicious_cookie: "choco",
    });
  });

  it("rejects when sealed cookie has invalid signature", async () => {
    const responseHeaders = new Headers();
    await setSealedCookie(
      responseHeaders,
      "macha",
      "secret choco chips",
      "delicious_cookie",
    );
    const header = responseHeaders.get("Set-Cookie")!;
    expect(header).toMatch(/delicious_cookie=.*\*.*; Path=\//);

    const sealed = header.split(";")[0].split("=")[1];

    const requestHeaders = new Headers({
      Cookie: `delicious_cookie=${sealed}`,
    });

    expect(
      await getSealedCookie(
        requestHeaders,
        "invalid secret",
        "delicious_cookie",
      ),
    ).toBe(false);
  });

  it("rejects when sealed cookie has invalid value", async () => {
    const requestHeaders = new Headers({
      Cookie: `delicious_cookie=invalid_value`,
    });

    expect(
      await getSealedCookie(
        requestHeaders,
        "secret choco chips",
        "delicious_cookie",
      ),
    ).toBe(false);
  });
});
