from django.urls import path

from . import views

urlpatterns = [
    path("admin/overview/", views.OverviewView.as_view(), name="portal-overview"),
    path("admin/assessments/", views.AssessmentListView.as_view(), name="portal-assessments"),
    path("admin/enterprises/", views.EnterpriseListView.as_view(), name="portal-enterprises"),
    path("admin/reports/", views.ReportListView.as_view(), name="portal-reports"),
    path("admin/feedback/", views.FeedbackListView.as_view(), name="portal-feedback"),
    path("admin/expert-reviews/", views.ExpertReviewListView.as_view(), name="portal-expert-reviews"),
    path("admin/pretest-notes/", views.PretestNoteListView.as_view(), name="portal-pretest-notes"),
    path("admin/audit-log/", views.AuditLogListView.as_view(), name="portal-audit-log"),
    path("admin/users/", views.UserListView.as_view(), name="portal-users"),
    path("admin/frameworks/", views.FrameworkVersionsView.as_view(), name="portal-frameworks"),
    path("admin/export/<str:dataset>/", views.ExportView.as_view(), name="portal-export"),
]
