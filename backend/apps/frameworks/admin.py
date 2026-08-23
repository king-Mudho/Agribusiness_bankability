from django.contrib import admin

from apps.frameworks.models import (
    CriticalGateDefinition,
    Dimension,
    FrameworkVersion,
    Question,
    ReadinessBand,
    ResponseOption,
)


class DimensionInline(admin.TabularInline):
    model = Dimension
    extra = 0


class CriticalGateInline(admin.TabularInline):
    model = CriticalGateDefinition
    extra = 0


class ReadinessBandInline(admin.TabularInline):
    model = ReadinessBand
    extra = 0


@admin.register(FrameworkVersion)
class FrameworkVersionAdmin(admin.ModelAdmin):
    list_display = ("version_label", "status", "effective_from")
    inlines = [DimensionInline, CriticalGateInline, ReadinessBandInline]


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0


@admin.register(Dimension)
class DimensionAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "framework_version", "weight_percent", "display_order")
    inlines = [QuestionInline]


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ("code", "dimension", "display_order")


@admin.register(ResponseOption)
class ResponseOptionAdmin(admin.ModelAdmin):
    list_display = ("scale_value", "label", "score_value", "question", "framework_version")


@admin.register(CriticalGateDefinition)
class CriticalGateDefinitionAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "framework_version", "display_order")


@admin.register(ReadinessBand)
class ReadinessBandAdmin(admin.ModelAdmin):
    list_display = ("code", "label", "min_score", "max_score", "framework_version")
