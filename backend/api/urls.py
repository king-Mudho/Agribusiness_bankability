from django.urls import include, path

urlpatterns = [
    path("auth/", include("apps.accounts.urls")),
    path("", include("apps.enterprises.urls")),
    path("", include("apps.frameworks.urls")),
    path("", include("apps.assessments.urls")),
    path("", include("apps.reports.urls")),
    path("", include("apps.research.urls")),
]
