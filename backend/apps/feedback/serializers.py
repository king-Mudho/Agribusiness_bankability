from rest_framework import serializers

from apps.frameworks.models import Dimension, Question

from .models import PilotFeedback


class PilotFeedbackSerializer(serializers.ModelSerializer):
    # Referenced by code (like every other question/dimension reference in
    # the API) rather than internal PK -- the frontend only ever sees codes
    # from GET /frameworks/{version}/.
    most_relevant_dimension = serializers.SlugRelatedField(
        slug_field="code", queryset=Dimension.objects.all(), required=False, allow_null=True
    )
    unclear_question = serializers.SlugRelatedField(
        slug_field="code", queryset=Question.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = PilotFeedback
        fields = [
            "id",
            "score_reflects_enterprise",
            "most_relevant_dimension",
            "unclear_question",
            "missing_factor_notes",
            "would_help_prepare_for_finance",
            "willing_to_provide_evidence_later",
            "perceived_duration_minutes",
            "would_recommend",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
