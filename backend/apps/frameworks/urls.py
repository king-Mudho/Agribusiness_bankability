from django.urls import path

from .views import FrameworkDefinitionView, FrameworkVersionListView

urlpatterns = [
    path("frameworks/", FrameworkVersionListView.as_view(), name="framework-list"),
    path(
        "frameworks/<str:version_label>/",
        FrameworkDefinitionView.as_view(),
        name="framework-detail",
    ),
]
