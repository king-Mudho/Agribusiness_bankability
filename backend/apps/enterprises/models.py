import uuid

from django.conf import settings
from django.db import models


class Enterprise(models.Model):
    class OrganisationType(models.TextChoices):
        SOLE_TRADER = "SOLE_TRADER", "Sole trader"
        PARTNERSHIP = "PARTNERSHIP", "Partnership"
        COOPERATIVE = "COOPERATIVE", "Cooperative"
        PRIVATE_COMPANY = "PRIVATE_COMPANY", "Private company"
        OTHER = "OTHER", "Other"

    class ValueChain(models.TextChoices):
        POULTRY = "POULTRY", "Poultry"
        HORTICULTURE = "HORTICULTURE", "Horticulture"
        GRAIN = "GRAIN", "Grain"
        LIVESTOCK = "LIVESTOCK", "Livestock"
        DAIRY = "DAIRY", "Dairy"

    class Province(models.TextChoices):
        HARARE = "HARARE", "Harare"
        BULAWAYO = "BULAWAYO", "Bulawayo"
        MANICALAND = "MANICALAND", "Manicaland"
        MASHONALAND_CENTRAL = "MASHONALAND_CENTRAL", "Mashonaland Central"
        MASHONALAND_EAST = "MASHONALAND_EAST", "Mashonaland East"
        MASHONALAND_WEST = "MASHONALAND_WEST", "Mashonaland West"
        MASVINGO = "MASVINGO", "Masvingo"
        MATABELELAND_NORTH = "MATABELELAND_NORTH", "Matabeleland North"
        MATABELELAND_SOUTH = "MATABELELAND_SOUTH", "Matabeleland South"
        MIDLANDS = "MIDLANDS", "Midlands"

    class TurnoverBand(models.TextChoices):
        UNDER_10K = "UNDER_10K", "Under USD 10,000"
        USD_10K_50K = "USD_10K_50K", "USD 10,000 - 50,000"
        USD_50K_250K = "USD_50K_250K", "USD 50,000 - 250,000"
        USD_250K_1M = "USD_250K_1M", "USD 250,000 - 1,000,000"
        OVER_1M = "OVER_1M", "Over USD 1,000,000"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=32, unique=True)
    anonymous_respondent_code = models.CharField(max_length=32, unique=True)
    organisation_type = models.CharField(max_length=32, choices=OrganisationType.choices)
    value_chain = models.CharField(max_length=32, choices=ValueChain.choices)
    province = models.CharField(max_length=32, choices=Province.choices)
    district = models.CharField(max_length=128, blank=True)
    years_operating = models.PositiveIntegerField()
    workers_count = models.PositiveIntegerField()
    turnover_band = models.CharField(max_length=32, choices=TurnoverBand.choices)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_enterprises",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class EnterpriseProfile(models.Model):
    class FinanceType(models.TextChoices):
        WORKING_CAPITAL = "WORKING_CAPITAL", "Working capital"
        ASSET_FINANCE = "ASSET_FINANCE", "Asset finance"
        TRADE_FINANCE = "TRADE_FINANCE", "Trade finance"
        INFRASTRUCTURE = "INFRASTRUCTURE", "Infrastructure finance"
        EQUITY = "EQUITY", "Equity"
        OTHER = "OTHER", "Other"

    class FinancierType(models.TextChoices):
        BANK = "BANK", "Bank"
        MFI = "MFI", "MFI"
        INVESTOR = "INVESTOR", "Investor"
        DEVELOPMENT_FINANCE = "DEVELOPMENT_FINANCE", "Development finance"
        OTHER = "OTHER", "Other"

    enterprise = models.OneToOneField(
        Enterprise, on_delete=models.CASCADE, related_name="profile"
    )
    finance_required_amount = models.DecimalField(max_digits=14, decimal_places=2)
    finance_required_currency = models.CharField(max_length=8, default="USD")
    finance_type_sought = models.CharField(max_length=32, choices=FinanceType.choices)
    intended_use = models.TextField(blank=True)
    previous_borrowing = models.BooleanField(default=False)
    previous_borrowing_notes = models.TextField(blank=True)
    preferred_financier_type = models.CharField(
        max_length=32, choices=FinancierType.choices
    )
    consent_given = models.BooleanField(default=False)
    consent_timestamp = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.enterprise.name}"
