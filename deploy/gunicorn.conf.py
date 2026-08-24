"""Gunicorn configuration for the Django API.

Sized for a ~956MB RAM / 1 vCPU VPS that also runs PostgreSQL, nginx and the
Node SSR frontend. The usual `2 * cpu + 1` formula would be 3 workers; that's
too many here, because each worker is a full Python process holding its own
database connection. Two workers keep one slow request (e.g. PDF report
generation) from blocking the whole API while leaving memory for everything
else running on the box.

Raise `workers` via the GUNICORN_WORKERS env var if the server is resized to
a larger plan.
"""

import os

# Bind to loopback only. nginx is the sole entry point from the internet; the
# API must never be reachable directly on port 8000.
bind = "127.0.0.1:8000"

workers = int(os.environ.get("GUNICORN_WORKERS", 2))

# Threads let a worker keep serving other requests while one is blocked on
# the database or on generating a PDF/CSV report.
threads = int(os.environ.get("GUNICORN_THREADS", 4))
worker_class = "gthread"

# Report generation (POST /api/v1/reports/) is synchronous. Must exceed
# nginx's proxy_read_timeout (60s in nginx/agribizframework.conf), or nginx
# would return 504 to the client while gunicorn is still working.
timeout = 90
graceful_timeout = 30

# Slightly under nginx's default keepalive so nginx closes connections first.
keepalive = 5

# Recycle workers periodically to bound the effect of any slow memory growth.
# The jitter stops both workers restarting at the same instant.
max_requests = 1000
max_requests_jitter = 100

# journalctl captures stdout/stderr for the systemd unit.
accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("GUNICORN_LOG_LEVEL", "info")
# Include the real client IP that nginx forwarded, not nginx's own address.
access_log_format = '%({x-forwarded-for}i)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" %(D)sus'

# The systemd unit uses Type=notify. Gunicorn detects NOTIFY_SOCKET on its
# own and signals readiness, so nothing extra is needed here -- but do not
# add `daemon = True`, which would break that handshake.
