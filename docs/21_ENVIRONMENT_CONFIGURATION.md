# 21 — Environment configuration

The domain is confirmed as `agribusinessbankability.com`, but it must still be read from
environment configuration everywhere — never hardcoded in source, so staging/local
setups and any future domain change don't require code edits.

## `backend/.env.example`

```
DJANGO_SETTINGS_MODULE=config.settings.prod
DJANGO_SECRET_KEY=changeme
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=agribusinessbankability.com,www.agribusinessbankability.com

DATABASE_URL=postgres://abi_user:changeme@localhost:5432/abi_db

JWT_SIGNING_KEY=changeme
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=30
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

CORS_ALLOWED_ORIGINS=https://agribusinessbankability.com,https://www.agribusinessbankability.com

# Celery/Redis intentionally omitted for v0.1 — see 04_TECH_STACK.md
```

## `frontend/.env.example`

```
NEXT_PUBLIC_APP_DOMAIN=agribusinessbankability.com
NEXT_PUBLIC_API_BASE_URL=https://agribusinessbankability.com/api/v1
NEXT_PUBLIC_APP_ENV=production
```

## Local development overrides

For local dev, copy each `.env.example` to `.env` and override:
```
DJANGO_SETTINGS_MODULE=config.settings.dev
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgres://abi_user:devpassword@localhost:5432/abi_dev
CORS_ALLOWED_ORIGINS=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_ENV=development
```

## Rules

- Never commit a real `.env` file — only `.env.example` files are checked in.
- Every secret (Django secret key, JWT signing key, DB password) must come from the
  environment, never a literal in `settings/*.py` or in frontend config files.
- The frontend must build its API base URL from `NEXT_PUBLIC_API_BASE_URL`, never a
  hardcoded `agribusinessbankability.com` string inside components.
