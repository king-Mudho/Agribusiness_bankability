from apps.audit.middleware import get_current_user
from apps.audit.models import AuditLog


def log_action(action: str, obj, metadata: dict | None = None):
    """Record a sensitive action per docs/18_DATA_PRIVACY.md:
    assessment submission, report generation, gate overrides, framework
    version changes.
    """
    AuditLog.objects.create(
        user=get_current_user(),
        action=action,
        object_type=obj.__class__.__name__,
        object_id=str(obj.pk),
        metadata=metadata or {},
    )
