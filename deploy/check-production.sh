#!/usr/bin/env bash
#
# External-facing production health check for https://agribizframework.com.
# Safe to run from the server itself or from any machine with internet
# access (DNS must have propagated for the latter).
#
#   bash deploy/check-production.sh
#
# Every hostname-sensitive check uses the real domain, never a bare
# 127.0.0.1 request -- see docs/PRODUCTION_ARCHITECTURE.md "The 127.0.0.1
# lesson" for why that matters with this nginx/certbot setup.

set -uo pipefail  # not -e: this script reports failures, it doesn't stop on the first one

DOMAIN="${SITE_DOMAIN:-agribizframework.com}"
SERVER_IP="${SERVER_IP:-66.29.139.201}"

pass=0
fail=0

ok()   { printf '  \033[1;32m[PASS]\033[0m %s\n' "$1"; pass=$((pass+1)); }
bad()  { printf '  \033[1;31m[FAIL]\033[0m %s\n' "$1"; fail=$((fail+1)); }
note() { printf '  \033[1;33m[SKIP]\033[0m %s\n' "$1"; }
section() { printf '\n\033[1;34m== %s ==\033[0m\n' "$1"; }

section "DNS"
for host in "$DOMAIN" "www.$DOMAIN"; do
    resolved="$(getent hosts "$host" 2>/dev/null | awk '{print $1}' | head -1)"
    if [[ -z "$resolved" ]]; then
        resolved="$(python3 -c "import socket; print(socket.gethostbyname('$host'))" 2>/dev/null)"
    fi
    if [[ "$resolved" == "$SERVER_IP" ]]; then
        ok "$host resolves to $SERVER_IP"
    elif [[ -n "$resolved" ]]; then
        bad "$host resolves to $resolved, expected $SERVER_IP"
    else
        bad "$host did not resolve"
    fi
done

section "HTTP (port 80)"
http_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "http://$DOMAIN/" 2>/dev/null || echo 000)"
if [[ "$http_code" == "301" || "$http_code" == "308" ]]; then
    ok "http://$DOMAIN/ redirects ($http_code)"
    location="$(curl -sS -o /dev/null -w '%{redirect_url}' --max-time 10 "http://$DOMAIN/" 2>/dev/null)"
    if [[ "$location" == https://* ]]; then
        ok "redirects to HTTPS: $location"
    else
        bad "redirect target is not HTTPS: $location"
    fi
elif [[ "$http_code" == "000" ]]; then
    bad "http://$DOMAIN/ did not respond (connection failed)"
else
    bad "http://$DOMAIN/ returned $http_code, expected a redirect (301/308)"
fi

section "HTTPS (port 443)"
https_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "https://$DOMAIN/" 2>/dev/null || echo 000)"
if [[ "$https_code" == "200" ]]; then
    ok "https://$DOMAIN/ returned 200"
else
    bad "https://$DOMAIN/ returned $https_code, expected 200"
fi

if command -v openssl >/dev/null 2>&1; then
    cert_info="$(echo | timeout 10 openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null)"
    if [[ -n "$cert_info" ]]; then
        ok "TLS certificate present"
        echo "$cert_info" | sed 's/^/         /'
    else
        bad "Could not retrieve a TLS certificate for $DOMAIN"
    fi
else
    note "openssl not available -- skipping certificate inspection"
fi

section "Application"
homepage="$(curl -sS --max-time 10 "https://$DOMAIN/" 2>/dev/null || true)"
if echo "$homepage" | grep -qi "Agribusiness Bankability"; then
    ok "Homepage HTML contains expected content"
else
    bad "Homepage HTML did not contain expected content"
fi

api_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "https://$DOMAIN/api/v1/frameworks/0.1/" 2>/dev/null || echo 000)"
if [[ "$api_code" == "200" ]]; then
    ok "GET /api/v1/frameworks/0.1/ returned 200"
else
    bad "GET /api/v1/frameworks/0.1/ returned $api_code, expected 200"
fi

demo_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "https://$DOMAIN/demo" 2>/dev/null || echo 000)"
if [[ "$demo_code" == "200" ]]; then
    ok "GET /demo returned 200"
else
    bad "GET /demo returned $demo_code, expected 200"
fi

admin_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "https://$DOMAIN/django-admin/" 2>/dev/null || echo 000)"
if [[ "$admin_code" == "200" || "$admin_code" == "302" ]]; then
    ok "GET /django-admin/ returned $admin_code (reachable)"
else
    bad "GET /django-admin/ returned $admin_code"
fi

section "Local services (only meaningful when run on the server itself)"
for svc in agribiz-backend agribiz-frontend nginx postgresql; do
    if systemctl is-active --quiet "$svc" 2>/dev/null; then
        ok "systemd unit '$svc' is active"
    else
        note "systemd unit '$svc' not active or not checkable from here"
    fi
done

section "Summary"
printf '  %d passed, %d failed\n' "$pass" "$fail"
if (( fail > 0 )); then
    printf '\n\033[1;31mProduction check found problems -- see FAIL lines above.\033[0m\n'
    exit 1
fi
printf '\n\033[1;32mAll checks passed.\033[0m\n'
