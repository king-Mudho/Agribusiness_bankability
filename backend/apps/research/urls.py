from django.urls import path

from .views import CognitivePretestNoteCreateView, ExpertReviewCreateView, ResearchDashboardView

urlpatterns = [
    path("research/dashboard/", ResearchDashboardView.as_view(), name="research-dashboard"),
    path(
        "research/expert-review/", ExpertReviewCreateView.as_view(), name="research-expert-review"
    ),
    path(
        "research/pretest-note/",
        CognitivePretestNoteCreateView.as_view(),
        name="research-pretest-note",
    ),
]
