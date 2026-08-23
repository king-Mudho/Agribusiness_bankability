from rest_framework import serializers

from .models import CognitivePretestNote, ExpertReview


class ExpertReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpertReview
        fields = [
            "id",
            "framework_version",
            "reviewer_name",
            "reviewer_affiliation",
            "comments",
            "suggested_weight_changes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class CognitivePretestNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CognitivePretestNote
        fields = [
            "id",
            "assessment",
            "observer_name",
            "question",
            "observation",
            "perceived_usefulness_rating",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
