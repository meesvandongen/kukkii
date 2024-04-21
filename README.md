# Kukkii

A copy of HonoJS cookie helpers, but changed to not be Hono specific.

```bash
npm i kukkii
```

See also https://hono.dev/helpers/cookie

## API

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

// Set a cookie
await setSignedCookie(res.headers, "mySecret", "myCookie", "myValue");

// Set cookie with options
await setSignedCookie(res.headers, "mySecret", "myCookie", "myValue", {
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
