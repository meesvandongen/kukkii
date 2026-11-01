# kukkii

## 0.4.0

### Minor Changes

- e324c35: Harden sealed cookies.

  - **Breaking:** sealing and unsealing require a secret of at least 32 characters, as in iron. Keys are derived with a single PBKDF2 iteration, so short secrets could be brute-forced from any sealed cookie. Generate one with `openssl rand -base64 32`.
  - Sealed cookies set with `maxAge` or `expires` carry the same expiry inside the authenticated seal, so `getSealedCookie` rejects copies after the cookie expires. Values sealed without an expiry, including existing cookies, still unseal.
  - `seal()` accepts a `ttl` option.
  - Fixed the argument order in the README for `setSignedCookie` and `setSealedCookie`: `(headers, value, secret, name, options)`.

## 0.3.0

### Minor Changes

- a0f41d2: add sealed cookies

## 0.2.0

### Minor Changes

- a19796f: make up-to-date with upstream hono
