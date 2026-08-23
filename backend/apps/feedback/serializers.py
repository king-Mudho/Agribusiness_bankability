from rest_framework import serializers

from .models import PilotFeedback


class PilotFeedbackSerializer(serializers.ModelSerializer):
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
