from rest_framework import serializers

from apps.frameworks.models import FrameworkVersion

from .models import Assessment, CriticalGateResult


class AssessmentSerializer(serializers.ModelSerializer):
    framework_version_label = serializers.CharField(
        source="framework_version.version_label", read_only=True
    )

    class Meta:
        model = Assessment
        fields = [
            "id",
            "enterprise",
            "framework_version",
            "framework_version_label",
            "status",
            "started_at",
            "submitted_at",
            "completion_seconds",
            "offline_created",
        ]
        read_only_fields = ["id", "status", "started_at", "submitted_at", "completion_seconds"]


class AssessmentCreateSerializer(serializers.ModelSerializer):
    # Accepted/returned by version_label (e.g. "0.1"), matching the
    # GET /frameworks/{version}/ URL convention -- not the internal PK.
    framework_version = serializers.SlugRelatedField(
        slug_field="version_label", queryset=FrameworkVersion.objects.all(), required=False
    )

    class Meta:
        model = Assessment
        fields = ["id", "enterprise", "framework_version", "status", "offline_created"]
        read_only_fields = ["id", "status"]

    def create(self, validated_data):
        if "framework_version" not in validated_data:
            validated_data["framework_version"] = (
                FrameworkVersion.objects.filter(status=FrameworkVersion.Status.ACTIVE)
                .order_by("-effective_from")
                .first()
            )
        return Assessment.objects.create(**validated_data)


class ResponseUpsertItemSerializer(serializers.Serializer):
    question_code = serializers.CharField()
    scale_value = serializers.IntegerField(min_value=1, max_value=5)


class GateUpsertItemSerializer(serializers.Serializer):
    gate_code = serializers.CharField()
    result = serializers.ChoiceField(choices=CriticalGateResult.Result.choices)
    note = serializers.CharField(required=False, allow_blank=True, default="")


class EvidenceUpsertItemSerializer(serializers.Serializer):
    question_code = serializers.CharField(required=False, allow_null=True)
    dimension_code = serializers.CharField(required=False, allow_null=True)
    evidence_level = serializers.IntegerField(min_value=0, max_value=4)
    description = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        has_question = bool(attrs.get("question_code"))
        has_dimension = bool(attrs.get("dimension_code"))
        if has_question == has_dimension:
            raise serializers.ValidationError(
                "Exactly one of question_code or dimension_code is required."
            )
        return attrs
