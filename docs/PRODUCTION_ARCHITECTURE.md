# Production architecture — agribizframework.com

This document describes the actual production deployment of the ABI (Agribusiness
Bankability Index) application at `https://agribizframework.com`. It is separate from
`docs/20_DEPLOYMENT_ARCHITECTURE.md`, which is the original build spec's deployment
design for the app's documented domain (`agribusinessbankability.com`) — see
"Domain note" below for why this deployment uses a different hostname than the rest of
`docs/`.

## Diagram

```
                    Internet
                       |
                       v
              agribizframework.com
             www.agribizframework.com
                       |
                       v
                    Nginx
                 HTTPS :443 (Certbot / Let's Encrypt)
                 HTTP  :80  -> redirects to :443
                       |
            +----------+----------------------+
            |                                  |
            v                                  v
   Next.js SSR (Node)                   Django API (Gunicorn)
   127.0.0.1:3000                       127.0.0.1:8000
   /  and everything not /api/*         /api/*, /django-admin/*
            |                                  |
            |                                  v
            |                            PostgreSQL
            |                            127.0.0.1:5432
            v
   /django-static/ -> served directly
   by nginx from disk (collectstatic output)
```

No Redis, no Celery, no WebSockets — the application doesn't use any of them (confirmed
by inspecting `backend/requirements/*.txt` and `backend/config/settings/base.py:149`,
which explicitly documents Celery/Redis as intentionally omitted for v0.1). Including
them here would be unnecessary complexity for what the app actually needs.

## Components

| Component | Role | Bind address | Managed by |
|---|---|---|---|
| Nginx | TLS termination, reverse proxy, static file serving | `0.0.0.0:80`, `0.0.0.0:443` | systemd (`nginx`) |
| Next.js (standalone) | Server-rendered frontend | `127.0.0.1:3000` | systemd (`agribiz-frontend`) |
| Gunicorn (Django) | REST API, Django admin | `127.0.0.1:8000` | systemd (`agribiz-backend`) |
| PostgreSQL | Application database | `127.0.0.1:5432` | systemd (`postgresql`) |
| Certbot | SSL certificate issuance + renewal | — | systemd timer (`certbot-renew.timer`) |

Only `80`/`443` (and `22` for SSH) are open externally. PostgreSQL, Gunicorn and Node
all bind to loopback only and are reachable exclusively through Nginx — see
`deploy/setup-server.sh`'s firewall step.

## Why this shape

- **One Nginx origin, no CORS.** Nginx routes `/api/*` and `/django-admin/*` to Gunicorn
  and everything else to Next.js, so the browser only ever talks to
  `agribizframework.com` — no cross-origin requests, no CORS preflight overhead. The
  frontend's `NEXT_PUBLIC_API_BASE_URL` still points at the full API URL (per
  `docs/07_FRONTEND_ARCHITECTURE.md`'s API-client design), it just resolves back through
  the same origin.
- **Next.js standalone output**, not a plain `npm run start` against the full
  `node_modules` tree. The VPS has ~956MB RAM total; `next.config.ts` now sets
  `output: "standalone"` (see the QA/deployment log for why), which produces a
  self-contained `server.js` plus only the dependencies actually used at runtime —
  measured at ~86MB versus a full `node_modules` install.
- **Gunicorn, not `runserver`.** Two `gthread` workers, four threads each — sized down
  from the textbook `2 × cpu + 1` because each worker is a full Python process holding
  its own DB connection pool, and this box also has to run Postgres, Nginx and Node.
  See `deploy/gunicorn.conf.py` for the full reasoning (adapted from the MSU reference
  deployment's sizing note).
- **2GB swap file.** The Next.js production build step and, less often, a synchronous
  PDF report generation are the memory spikes; ~956MB of physical RAM alone risks an
  OOM kill during either. See `deploy/setup-server.sh`.
- **No Docker.** The application doesn't need container orchestration — one Django
  process, one Node process, one Postgres instance, on one VPS. Docker would add an
  extra virtualization/networking layer with no corresponding benefit here, and this
  matches the MSU reference deployment's own choice not to containerize.
- **Certbot writes the HTTPS server block itself.** `deploy/nginx/agribizframework.conf`
  intentionally has a single `listen 80` server block, not a hand-written `:443` block.
  `certbot --nginx --redirect` rewrites the file to add the `:443` block, the
  certificate paths, and the redirect. See "The 127.0.0.1 lesson" below for why this
  matters.

## The 127.0.0.1 lesson (carried over from the MSU deployment)

A prior deployment (MSU's `collectmytranscriptmsu.com`) hit this exact failure mode and
it is deliberately avoided here:

Certbot's generated `:80` block, after `--nginx --redirect` has run, ends with a
catch-all `return 404;  # managed by Certbot` for any `Host` header it wasn't issued a
certificate for. A health check that does `curl http://127.0.0.1/` sends `Host:
127.0.0.1`, which doesn't match any of the certificate's hostnames — so it falls through
to that 404, and looks exactly like "the app is broken" when actually the app is fine
and the health check itself is testing the wrong thing.

**The fix carried into this deployment:**
- Never write a second, hand-authored `:80`/`:443` server block. Let Certbot own the
  HTTPS block entirely.
- Every health check that matters uses the real hostname, not the loopback IP:
  `curl --resolve agribizframework.com:443:127.0.0.1 https://agribizframework.com/`
  (pins the domain to this machine while still sending the right `Host`/SNI), or
  `curl -H "Host: agribizframework.com" http://127.0.0.1/` before a certificate exists.
  See `deploy/deploy.sh`'s `check()` function and `deploy/check-production.sh`.

## Domain note

Every other file under `docs/` (starting with `AGENTS.md` ground rule 8) documents this
application's production domain as `agribusinessbankability.com`, and all of the
research disclaimers, the demo script, and the seeded contact information are written
around that identity. This specific deployment target —
`https://agribizframework.com` on `66.29.139.201` — uses a **different** domain than
what the rest of the documentation set describes. Nothing about the application's
behaviour depends on which domain it's deployed under (per ground rule 8, the domain is
always read from environment configuration, never hardcoded), so this is purely a
deployment-target choice and required no application code changes beyond what any
domain migration would need — but it's flagged here explicitly rather than silently
absorbed, since it's a genuine identity mismatch between this deployment and the rest of
`docs/`, and only the project owner can say whether that's intentional (a rebrand /
shorter production URL for the same research prototype) or a mix-up between two
different intended projects.
