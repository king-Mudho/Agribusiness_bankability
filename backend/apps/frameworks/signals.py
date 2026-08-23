from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import FrameworkVersion


@receiver(post_save, sender=FrameworkVersion)
def log_framework_version_change(sender, instance, created, **kwargs):
    from apps.audit.utils import log_action

    log_action(
        "framework_version.created" if created else "framework_version.changed",
        instance,
        {"version_label": instance.version_label, "status": instance.status},
    )
