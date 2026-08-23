from rest_framework import serializers

from apps.frameworks.models import FrameworkVersion, Question

from .models import CognitivePretestNote, ExpertReview


class ExpertReviewSerializer(serializers.ModelSerializer):
    framework_version = serializers.SlugRelatedField(
        slug_field="version_label", queryset=FrameworkVersion.objects.all()
    )

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
    question = serializers.SlugRelatedField(
        slug_field="code", queryset=Question.objects.all(), required=False, allow_null=True
    )

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
