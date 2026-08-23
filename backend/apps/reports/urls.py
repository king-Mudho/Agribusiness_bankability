from rest_framework.routers import SimpleRouter

from .views import ReportViewSet

router = SimpleRouter(trailing_slash=True)
router.register("reports", ReportViewSet, basename="report")

urlpatterns = router.urls
