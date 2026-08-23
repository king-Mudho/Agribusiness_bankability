class IncompleteAssessmentError(Exception):
    """Raised when compute_abi() is called on an assessment missing one or
    more of the framework's questions. Carries the missing question codes so
    the API can return a 400 with the exact list per docs/10_SCORING_ENGINE.md.
    """

    def __init__(self, missing_question_codes: list[str]):
        self.missing_question_codes = missing_question_codes
        super().__init__(
            f"Assessment is missing responses for: {', '.join(missing_question_codes)}"
        )
