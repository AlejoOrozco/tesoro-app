# Frontend handoff — connect www, app, and the API

Copy this into the app repo and the www repo. It is the contract for the pages that must work before any product catalog exists.

The browser talks only to this API. It does not call Supabase. There is no Supabase client, no anon key, and no service key in either frontend.

## Hosts

| Site | Local | Production | Talks to |
|---|---|---|---|
| www | `http://localhost:3001` | `https://www.tesoroglobalsas.com` | API, and links to app |
| app | `http://localhost:3000` | `https://app.tesoroglobalsas.com` | API, and links to www |
| API | `http://localhost:8000` | `https://api.tesoroglobalsas.com` | — |

One public env var in each frontend:

- Local: `NEXT_PUBLIC_API_URL=http://localhost:8000`
- Production: `NEXT_PUBLIC_API_URL=https://api.tesoroglobalsas.com`

No `/api` prefix. No trailing slash.

## What to build now

Three screens. Spanish is what the visitor sees. Code, routes, and variable names stay English.

**www `/`**

- On load, `GET /auth/me` with credentials.
- **200:** show `Cuenta` linking to the app account page.
- **401:** show `Iniciar sesión` linking to the app login page.
- Also link `Crear cuenta` to the app register page.

**app `/login`**

- Email and password form. `POST /auth/login`.
- **200:** keep `csrfToken` in memory and go to `/account`.
- Link to `/register` and back to www.

**app `/register`**

- Email and password form. `POST /auth/register`.
- **201:** the account exists and the visitor is not signed in. Send them to `/login`.
- Link to `/login` and back to www.

**app `/account`**

- On load, `GET /auth/me`. **401** sends the visitor to `/login`.
- Show `email` and `role` exactly as the API returned them.
- `Cerrar sesión` calls `POST /auth/logout`, then go to `/login`.
- Link back to www.

There is no product page, cart, or staff screen in this step.

## How every request is made

```ts
await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
```

`credentials: 'include'` is required on every call, including `GET /auth/me`. Without it the browser drops the cookies.

Send JSON. The body type is `application/json`. An extra property is rejected with **400**.

## Session

Login sets two cookies, `tesoro_session` and `tesoro_csrf`. Both are `HttpOnly`. Page JavaScript cannot read them. Do not copy them into `localStorage`, `sessionStorage`, or a JS-readable cookie.

`csrfToken` in the JSON is the only copy the page may hold. Keep it in memory (React state or a module variable). After a refresh, memory is empty. `GET /auth/me` returns the same `csrfToken` again. Call it when the app or www loads.

The cookie lasts 7 days. In production its domain is `.tesoroglobalsas.com`, so www and app share one session. Locally the domain is omitted; `localhost` still shares it across ports 3000, 3001, and 8000.

## Routes

### `POST /auth/register`

Body: `{ "email": "...", "password": "..." }`

Password rule, shown on the form: at least 8 characters, one uppercase letter, one lowercase letter, one digit, one symbol.

**201**

```json
{ "id": "...", "email": "person@example.com", "role": "Cliente" }
```

No cookie is set. Sign in after this.

| Status | `message` |
|---|---|
| 400 | `Email must be a valid email address` or `Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a digit, and a symbol` |
| 409 | `Email already registered` |
| 429 | `Too Many Requests` |
| 503 | `Service unavailable` |

Five attempts per IP per minute. A **400** whose message is `Registration could not be completed` means Supabase rejected the signup.

### `POST /auth/login`

Body: `{ "email": "...", "password": "..." }`

The login password is not checked against the register rule. Empty is rejected. Longer than 200 characters is rejected.

**200**

```json
{
  "id": "...",
  "email": "person@example.com",
  "role": "Cliente",
  "csrfToken": "..."
}
```

`role` is one of `Cliente`, `Colaborador`, `Administrador`. Show it as returned.

| Status | `message` |
|---|---|
| 400 | `Email must be a valid email address` or `Password is required` |
| 401 | `Invalid email or password` |
| 403 | `Email address is not confirmed` |
| 429 | `Too Many Requests` |
| 503 | `Service unavailable` |

Five attempts per IP per minute. Confirm-email is off while testing, so **403** should not appear until that setting is turned back on.

### `GET /auth/me`

No body. Cookies go by themselves.

**200** is the same JSON as login, including `csrfToken`. Replace the in-memory token with this value.

**401**

```json
{ "statusCode": 401, "message": "Unauthorized", "error": "Unauthorized" }
```

That covers a missing cookie, an expired cookie, and a cookie cancelled by logout. Treat them the same: the visitor is signed out.

### `POST /auth/logout`

No body. Send the in-memory token:

```ts
headers: {
  'x-csrf-token': csrfToken,
}
```

**204** with an empty body. Clear the in-memory token and go to `/login`.

| Status | `message` |
|---|---|
| 401 | `Unauthorized` |
| 403 | `Invalid CSRF token` |

On **403**, call `GET /auth/me` once, store the new `csrfToken`, and retry logout once. If that also fails, go to `/login`.

## reCAPTCHA

Do not send a reCAPTCHA field. The API does not accept one. `forbidNonWhitelisted` turns an extra property into **400**, and login or register will fail.

reCAPTCHA v3 is the next API change, on register and login only. The site key will be public in the frontend. The secret stays on the API. Wire the widget when that field exists, not before.

## Check that the three hosts agree

1. On www, signed out, the header says `Iniciar sesión` and the link opens app `/login`.
2. Register on app, then sign in. `/account` shows the email and `Cliente`.
3. Refresh app `/account`. The session is still there.
4. Open www in the same browser. The header says `Cuenta`.
5. Sign out on app. www, after refresh, says `Iniciar sesión` again.
6. `GET /auth/me` after sign-out is **401**.
