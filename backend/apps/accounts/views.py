from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class MeView(APIView):
    """GET /auth/me/ -- who is signed in and which role they hold, so the
    frontend admin portal can show only the sections that role may open.
    The server still enforces every permission on each endpoint; this only
    drives what the navigation displays.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = getattr(user, "role", None)
        return Response(
            {
                "username": user.username,
                "full_name": user.get_full_name(),
                "email": user.email,
                "role": role.name if role else None,
                "role_label": role.get_name_display() if role else None,
            }
        )
