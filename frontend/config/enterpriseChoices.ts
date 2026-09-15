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

export const DISTRICT_CHOICES = [
  { value: "BEITBRIDGE", label: "Beitbridge" },
  { value: "BIKITA", label: "Bikita" },
  { value: "BINDURA", label: "Bindura" },
  { value: "BINGA", label: "Binga" },
  { value: "BUBI", label: "Bubi" },
  { value: "BUHERA", label: "Buhera" },
  { value: "BULAWAYO", label: "Bulawayo" },
  { value: "BULILIMAMANGWE", label: "Bulilimamangwe" },
  { value: "CENTENARY", label: "Centenary" },
  { value: "CHEGUTU", label: "Chegutu" },
  { value: "CHIKOMBA", label: "Chikomba" },
  { value: "CHIMANIMANI", label: "Chimanimani" },
  { value: "CHIPINGE", label: "Chipinge" },
  { value: "CHIREDZI", label: "Chiredzi" },
  { value: "CHITUNGWIZA", label: "Chitungwiza" },
  { value: "CHIVI", label: "Chivi" },
  { value: "GOKWE_NORTH", label: "Gokwe North" },
  { value: "GOKWE_SOUTH", label: "Gokwe South" },
  { value: "GOROMONZI", label: "Goromonzi" },
  { value: "GURUVE", label: "Guruve" },
  { value: "GUTU", label: "Gutu" },
  { value: "GWANDA", label: "Gwanda" },
  { value: "GWERU", label: "Gweru" },
  { value: "HARARE", label: "Harare" },
  { value: "HURUNGWE", label: "Hurungwe" },
  { value: "INSIZA", label: "Insiza" },
  { value: "KADOMA", label: "Kadoma" },
  { value: "KARIBA", label: "Kariba" },
  { value: "KWEKWE", label: "Kwekwe" },
  { value: "LOMAGUNDI", label: "Lomagundi" },
  { value: "LUPANE", label: "Lupane" },
  { value: "MAKONI", label: "Makoni" },
  { value: "MARONDERA", label: "Marondera" },
  { value: "MASVINGO", label: "Masvingo" },
  { value: "MATOPO", label: "Matopo" },
  { value: "MAZOWE", label: "Mazowe" },
  { value: "MBERENGWA", label: "Mberengwa" },
  { value: "MT_DARWIN", label: "Mt Darwin" },
  { value: "MUDZI", label: "Mudzi" },
  { value: "MUREHWA", label: "Murehwa" },
  { value: "MUTARE", label: "Mutare" },
  { value: "MUTASA", label: "Mutasa" },
  { value: "MUTOKO", label: "Mutoko" },
  { value: "MWENEZI", label: "Mwenezi" },
  { value: "NKAYI", label: "Nkayi" },
  { value: "NYAMANDLOVU", label: "Nyamandlovu" },
  { value: "NYANGA", label: "Nyanga" },
  { value: "RUSHINGA", label: "Rushinga" },
  { value: "SHAMVA", label: "Shamva" },
  { value: "SHURUGWI", label: "Shurugwi" },
  { value: "TSHOLOTSHO", label: "Tsholotsho" },
  { value: "UMGUZA", label: "Umguza" },
  { value: "UMZINGWANE", label: "Umzingwane" },
  { value: "WEDZA", label: "Wedza" },
  { value: "ZVIMAGE", label: "Zvimage" },
  { value: "ZVISHAVANE", label: "Zvishavane" },
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

const ALL_ENTERPRISE_CHOICES = [
  ...ORGANISATION_TYPE_CHOICES,
  ...VALUE_CHAIN_CHOICES,
  ...PROVINCE_CHOICES,
  ...DISTRICT_CHOICES,
  ...TURNOVER_BAND_CHOICES,
  ...FINANCE_TYPE_CHOICES,
  ...FINANCIER_TYPE_CHOICES,
];

/** Humanises a raw enum code (e.g. "MASHONALAND_CENTRAL") using the choice
 * lists above; falls back to the raw code for any value not in this fixed
 * set of field choices, never for the ABI dimensions/scoring content. */
export function enterpriseChoiceLabel(value: string | null | undefined): string {
  if (!value) return "-";
  return ALL_ENTERPRISE_CHOICES.find((choice) => choice.value === value)?.label ?? value;
}
