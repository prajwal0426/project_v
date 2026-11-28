# Admin Device Security

The Admin account has three active browser-device slots. MongoDB enforces one active registration per slot with a unique partial index, so concurrent logins cannot allocate a fourth slot.

Admin login creates a server-generated random device token and stores only its SHA-256 hash. The raw token is returned only as the `HttpOnly` `vertex_admin_device` cookie, scoped to `/api`. Admin JWT sessions are bound to both the device record and the request browser user-agent hash. Device management and all Admin APIs require the Admin role and a live device-bound Admin session.

The device list and Security & Devices page retain registration/revocation events. Revoking a device marks its registration revoked and revokes all associated Admin sessions. A revoked browser must authenticate again; it can only register again if a slot is available.

## Recovery

If all authorized browsers are unavailable, run this command in an interactive terminal on the backend host:

```bash
npm run admin:devices:recover --prefix server
```

The command loads `server/.env`, prompts for the configured Admin username and password without echoing either value, and requires the exact confirmation `RECOVER VERTEX ADMIN DEVICES`. It is not an HTTP endpoint. It revokes every active Admin device registration and Admin session, records a security event, and preserves device/event history. The next successful Admin login can enroll a device in an available slot.

## Deployment Notes

- Keep `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, and `MONGODB_URI` server-side only.
- Serve the frontend/API over HTTPS in production so the device cookie is Secure.
- If the frontend calls a separate API origin, configure `CLIENT_URL` to the frontend origin and keep credentialed CORS enabled. Same-site hosting or a same-origin `/api` proxy is preferred.
- The browser/OS labels are derived from the request user-agent. A browser registration token identifies a browser profile, not cryptographic physical hardware; clearing site data at the three-device limit does not create a free slot.
