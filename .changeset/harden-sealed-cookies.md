---
"kukkii": minor
---

Harden sealed cookies.

- **Breaking:** sealing and unsealing require a secret of at least 32 characters, as in iron. Keys are derived with a single PBKDF2 iteration, so short secrets could be brute-forced from any sealed cookie. Generate one with `openssl rand -base64 32`.
- Sealed cookies set with `maxAge` or `expires` carry the same expiry inside the authenticated seal, so `getSealedCookie` rejects copies after the cookie expires. Values sealed without an expiry, including existing cookies, still unseal.
- `seal()` accepts a `ttl` option.
- Fixed the argument order in the README for `setSignedCookie` and `setSealedCookie`: `(headers, value, secret, name, options)`.
