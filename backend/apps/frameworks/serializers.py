from rest_framework import serializers

from .models import CriticalGateDefinition, Dimension, FrameworkVersion, Question, ReadinessBand, ResponseOption


class FrameworkVersionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = FrameworkVersion
        fields = ["version_label", "status", "effective_from"]


class ResponseOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResponseOption
        fields = ["scale_value", "label", "score_value"]


class QuestionDefinitionSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ["code", "prompt", "options"]

    def get_options(self, question):
        per_question = list(question.options.all().order_by("scale_value"))
        options = per_question if per_question else self.context["shared_options"]
        return ResponseOptionSerializer(options, many=True).data


class DimensionDefinitionSerializer(serializers.ModelSerializer):
    questions = serializers.SerializerMethodField()

    class Meta:
        model = Dimension
        fields = ["code", "name", "weight_percent", "questions"]

    def get_questions(self, dimension):
        questions = dimension.questions.all().order_by("display_order")
        return QuestionDefinitionSerializer(questions, many=True, context=self.context).data


class CriticalGateDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CriticalGateDefinition
        fields = ["code", "name", "description"]


class ReadinessBandSerializer(serializers.ModelSerializer):
    min = serializers.IntegerField(source="min_score")
    max = serializers.IntegerField(source="max_score")

    class Meta:
        model = ReadinessBand
        fields = ["code", "label", "min", "max"]
