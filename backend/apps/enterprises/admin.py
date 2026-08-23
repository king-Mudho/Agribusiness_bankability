from django.contrib import admin

from apps.enterprises.models import Enterprise, EnterpriseProfile


class EnterpriseProfileInline(admin.StackedInline):
    model = EnterpriseProfile
    can_delete = False


@admin.register(Enterprise)
class EnterpriseAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "value_chain", "province", "organisation_type")
    search_fields = ("name", "code", "anonymous_respondent_code")
    list_filter = ("value_chain", "province", "organisation_type")
    inlines = [EnterpriseProfileInline]
