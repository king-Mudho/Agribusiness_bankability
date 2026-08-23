/**
 * Mirrors the TextChoices enums on apps.enterprises.models (backend). These
 * are fixed field choices, not ABI scoring configuration -- the six
 * dimensions/weights/questions/gates/pathways still come only from
 * GET /frameworks/{version}/, never hardcoded here.
 */

export const ORGANISATION_TYPE_CHOICES = [
  { value: "SOLE_TRADER", label: "Sole trader" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "COOPERATIVE", label: "Cooperative" },
  { value: "PRIVATE_COMPANY", label: "Private company" },
  { value: "OTHER", label: "Other" },
];

export const VALUE_CHAIN_CHOICES = [
  { value: "POULTRY", label: "Poultry" },
  { value: "HORTICULTURE", label: "Horticulture" },
  { value: "GRAIN", label: "Grain" },
  { value: "LIVESTOCK", label: "Livestock" },
  { value: "DAIRY", label: "Dairy" },
];

export const PROVINCE_CHOICES = [
  { value: "HARARE", label: "Harare" },
  { value: "BULAWAYO", label: "Bulawayo" },
  { value: "MANICALAND", label: "Manicaland" },
  { value: "MASHONALAND_CENTRAL", label: "Mashonaland Central" },
  { value: "MASHONALAND_EAST", label: "Mashonaland East" },
  { value: "MASHONALAND_WEST", label: "Mashonaland West" },
  { value: "MASVINGO", label: "Masvingo" },
  { value: "MATABELELAND_NORTH", label: "Matabeleland North" },
  { value: "MATABELELAND_SOUTH", label: "Matabeleland South" },
  { value: "MIDLANDS", label: "Midlands" },
];

export const TURNOVER_BAND_CHOICES = [
  { value: "UNDER_10K", label: "Under USD 10,000" },
  { value: "USD_10K_50K", label: "USD 10,000 - 50,000" },
  { value: "USD_50K_250K", label: "USD 50,000 - 250,000" },
  { value: "USD_250K_1M", label: "USD 250,000 - 1,000,000" },
  { value: "OVER_1M", label: "Over USD 1,000,000" },
];

export const FINANCE_TYPE_CHOICES = [
  { value: "WORKING_CAPITAL", label: "Working capital" },
  { value: "ASSET_FINANCE", label: "Asset finance" },
  { value: "TRADE_FINANCE", label: "Trade finance" },
  { value: "INFRASTRUCTURE", label: "Infrastructure finance" },
  { value: "EQUITY", label: "Equity" },
  { value: "OTHER", label: "Other" },
];

export const FINANCIER_TYPE_CHOICES = [
  { value: "BANK", label: "Bank" },
  { value: "MFI", label: "MFI" },
  { value: "INVESTOR", label: "Investor" },
  { value: "DEVELOPMENT_FINANCE", label: "Development finance" },
  { value: "OTHER", label: "Other" },
];
