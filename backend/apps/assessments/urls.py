from rest_framework.routers import SimpleRouter

from .views import AssessmentViewSet

router = SimpleRouter(trailing_slash=True)
router.register("assessments", AssessmentViewSet, basename="assessment")

urlpatterns = router.urls
