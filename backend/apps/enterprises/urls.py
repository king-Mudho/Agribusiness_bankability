from rest_framework.routers import SimpleRouter

from .views import EnterpriseViewSet

router = SimpleRouter(trailing_slash=True)
router.register("enterprises", EnterpriseViewSet, basename="enterprise")

urlpatterns = router.urls
