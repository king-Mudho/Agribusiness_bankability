from rest_framework.views import exception_handler


def abi_exception_handler(exc, context):
    """Wraps DRF's default error response in the documented envelope:
    { "error": { "code": ..., "message": ..., "field_errors": {} } }
    See docs/06_API_ARCHITECTURE.md.
    """
    response = exception_handler(exc, context)
    if response is None:
        return None

    detail = response.data
    field_errors = {}
    message = "An error occurred."

    if isinstance(detail, dict):
        if "detail" in detail and len(detail) == 1:
            message = str(detail["detail"])
        else:
            field_errors = detail
            message = "Validation failed."
    elif isinstance(detail, list):
        message = " ".join(str(item) for item in detail)

    response.data = {
        "error": {
            "code": exc.__class__.__name__,
            "message": message,
            "field_errors": field_errors,
        }
    }
    return response
