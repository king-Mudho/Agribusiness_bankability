from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    # Mounted at "django-admin/", not Django's conventional "admin/", because
    # the frontend already has its own documented /admin route (Next.js
    # "Internal / researcher tools" page -- see frontend/app/admin/page.tsx)
    # and both apps share one production origin behind a single nginx proxy
    # (docs/PRODUCTION_ARCHITECTURE.md). Mounting it here, rather than
    # rewriting the path at the nginx layer, means Django's own
    # self-referential URLs (login redirects, admin change-list/change-form
    # links) are correct without any proxy-level path surgery -- Django
    # always knows its real external path. Not documented as a fixed
    # contract anywhere in docs/, so safe to change; nothing else references
    # this path.
    path("django-admin/", admin.site.urls),
    # Schema/docs live at /api/schema/ and /api/docs/ (not under /api/v1/) per
    # docs/06_API_ARCHITECTURE.md.
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="api-docs"),
    path("api/v1/", include("api.urls")),
]
