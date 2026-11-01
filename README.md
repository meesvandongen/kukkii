# Kukkii

Cookie helpers for the edge.

```bash
npm i kukkii
```

See also https://hono.dev/helpers/cookie

## API

### Sealed cookies

Sealed cookies are encrypted (AES-256-CBC) and authenticated (HMAC-SHA256) with
[iron](https://github.com/hapijs/iron): whoever holds the cookie can neither
read nor change its value.

- The secret must be **at least 32 characters** and random, for example
  `openssl rand -base64 32`. Keys are derived with a single PBKDF2 iteration,
  as in iron, so the secret's randomness is what protects every cookie.
- A cookie set with `maxAge` or `expires` gets the same expiry inside the seal.
  `getSealedCookie` rejects it afterwards, even if someone kept a copy.

### getSealedCookie

```ts
import { getSealedCookie } from "kukkii";

// Get all cookies from the request headers
const cookies = await getSealedCookie(req.headers, secret);

// Get a specific cookie (false when missing, tampered with or expired)
const myCookie = await getSealedCookie(req.headers, secret, "myCookie");
```

### setSealedCookie

```ts
import { setSealedCookie } from "kukkii";

const secret = process.env.COOKIE_SECRET; // 32+ random characters

// Set a cookie: headers, value, secret, name
await setSealedCookie(res.headers, "myValue", secret, "myCookie");

// Set cookie with options
await setSealedCookie(res.headers, "myValue", secret, "myCookie", {
  path: "/",
  secure: true,
  domain: "example.com",
  httpOnly: true,
  maxAge: 1000,
  expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
  sameSite: "Strict",
});
```

### getCookie

```ts
import { getCookie } from "kukkii";

// Get all cookies from the request headers
const cookie = getCookie(req.headers);

// Get a specific cookie
const myCookie = getCookie(req.headers, "myCookie");
```

### getSignedCookie

```ts
import { getSignedCookie } from "kukkii";

// Get all cookies from the request headers
const cookie = await getSignedCookie(req.headers, "mySecret");

// Get a specific cookie
const myCookie = await getSignedCookie(req.headers, "mySecret", "myCookie");
```

### setCookie

```ts
import { setCookie } from "kukkii";

// Set a cookie
setCookie(res.headers, "myCookie", "myValue");

// Set cookie with options
setCookie(res.headers, "myCookie", "myValue", {
  path: "/",
  secure: true,
  domain: "example.com",
  httpOnly: true,
  maxAge: 1000,
  expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
  sameSite: "Strict",
});
```

### setSignedCookie

```ts
import { setSignedCookie } from "kukkii";

// Set a cookie: headers, value, secret, name
await setSignedCookie(res.headers, "myValue", "mySecret", "myCookie");

// Set cookie with options
await setSignedCookie(res.headers, "myValue", "mySecret", "myCookie", {
  path: "/",
  secure: true,
  domain: "example.com",
  httpOnly: true,
  maxAge: 1000,
  expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
  sameSite: "Strict",
});
```

### deleteCookie

```ts
import { deleteCookie } from "kukkii";

// Delete a cookie
deleteCookie(res.headers, "myCookie");

// Delete cookie with options
deleteCookie(res.headers, "myCookie", {
  path: "/",
  secure: true,
  domain: "example.com",
});
```
