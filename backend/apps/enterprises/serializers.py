import uuid

from django.utils import timezone
from rest_framework import serializers

from .models import Enterprise, EnterpriseProfile


class EnterpriseProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnterpriseProfile
        fields = [
            "finance_required_amount",
            "finance_required_currency",
            "finance_type_sought",
            "intended_use",
            "previous_borrowing",
            "previous_borrowing_notes",
            "preferred_financier_type",
            "consent_given",
            "consent_timestamp",
        ]
        read_only_fields = ["consent_timestamp"]


class EnterpriseSerializer(serializers.ModelSerializer):
    profile = EnterpriseProfileSerializer(required=False)

    class Meta:
        model = Enterprise
        fields = [
            "id",
            "name",
            "code",
            "anonymous_respondent_code",
            "organisation_type",
            "value_chain",
            "province",
            "district",
            "years_operating",
            "workers_count",
            "turnover_band",
            "profile",
            "created_at",
        ]
        read_only_fields = ["id", "code", "anonymous_respondent_code", "created_at"]

    def create(self, validated_data):
        profile_data = validated_data.pop("profile", None)
        validated_data["code"] = f"ENT-{uuid.uuid4().hex[:10].upper()}"
        validated_data["anonymous_respondent_code"] = f"ANON-{uuid.uuid4().hex[:10].upper()}"
        request = self.context.get("request")
        if request is not None and request.user and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        enterprise = Enterprise.objects.create(**validated_data)
        if profile_data is not None:
            self._save_profile(enterprise, profile_data)
        return enterprise

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if profile_data is not None:
            self._save_profile(instance, profile_data)
            # update_or_create() operates via a fresh queryset lookup, so the
            # reverse o2o `instance.profile` cached on this object (if it was
            # already accessed, e.g. by the serializer's own initial read)
            # would otherwise still show pre-update values in the response.
            instance.refresh_from_db()
        return instance

    @staticmethod
    def _save_profile(enterprise, profile_data):
        consent_given = profile_data.pop("consent_given", None)
        profile_data.pop("consent_timestamp", None)
        profile, _created = EnterpriseProfile.objects.update_or_create(
            enterprise=enterprise, defaults=profile_data
        )
        if consent_given is True and not profile.consent_given:
            profile.consent_given = True
            profile.consent_timestamp = timezone.now()
            profile.save(update_fields=["consent_given", "consent_timestamp"])
        elif consent_given is False and profile.consent_given:
            profile.consent_given = False
            profile.save(update_fields=["consent_given"])
        return profile
