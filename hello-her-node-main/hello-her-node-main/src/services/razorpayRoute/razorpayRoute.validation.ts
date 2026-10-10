import {
  VendorAppsInput,
  CreateVendorInput,
  VendorAddressInput,
  UpdateStakeholderInput,
  VendorContactInfoInput,
  CreateStakeholderInput,
  UpdateLinkedAccountInput,
  RazorpayRouteRequestOptions,
  ConfigureRouteSettlementsInput,
  StakeholderResidentialAddressInput,
} from "./razorpayRoute.types";

const MAX_NOTES = 15;
const MAX_TIMEOUT_MS = 120_000;
const CODE_PATTERN = /^[a-z0-9_]+$/;
const PHONE_PATTERN = /^\+?\d{8,15}$/;
const PAN_PATTERN = /^[A-Z]{5}\d{4}[A-Z]$/;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NUMBER_PATTERN = /^[A-Za-z0-9]{5,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GST_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const BUSINESS_TYPES = new Set([
  "llp",
  "ngo",
  "individual",
  "partnership",
  "proprietorship",
  "public_limited",
  "private_limited",
  "trust",
  "society",
  "not_yet_registered",
  "educational_institutes",
]);

export class RazorpayRouteValidationError extends Error {
  readonly field: string;

  constructor(field: string, message: string) {
    super(`${field}: ${message}`);
    this.name = "RazorpayRouteValidationError";
    this.field = field;
  }
}

const fail: (field: string, message: string) => never = (field, message) => {
  throw new RazorpayRouteValidationError(field, message);
};

const assertString: (
  value: unknown,
  field: string,
  min: number,
  max: number,
) => asserts value is string = (value, field, min, max) => {
  if (typeof value !== "string") fail(field, "must be a string");
  const length = value.trim().length;
  if (length < min || length > max) {
    fail(field, `must contain between ${min} and ${max} characters`);
  }
};

const assertEmail = (value: string, field: string): void => {
  assertString(value, field, 3, 132);
  const email = value.trim();
  if (!EMAIL_PATTERN.test(email)) fail(field, "must be a valid email");
  const [localPart, domainPart] = email.split("@");
  if (localPart.length > 64 || domainPart.length > 68) {
    fail(field, "must have at most 64 local and 68 domain characters");
  }
};

const assertPhone = (value: string, field: string): void => {
  if (typeof value !== "string" || !PHONE_PATTERN.test(value.trim())) {
    fail(field, "must contain 8 to 15 digits with an optional leading +");
  }
};

const assertPan = (value: string, field: string): void => {
  if (
    typeof value !== "string" ||
    !PAN_PATTERN.test(value.trim().toUpperCase())
  ) {
    fail(field, "must be a valid Indian PAN");
  }
};

const assertGst = (value: string, field: string): void => {
  if (
    typeof value !== "string" ||
    !GST_PATTERN.test(value.trim().toUpperCase())
  ) {
    fail(field, "must be a valid Indian GSTIN");
  }
};

const assertCode = (value: string, field: string): void => {
  assertString(value, field, 1, 255);
  if (!CODE_PATTERN.test(value.trim())) {
    fail(field, "must use Razorpay's lowercase code format");
  }
};

const assertUrl = (value: string, field: string): void => {
  assertString(value, field, 1, 2048);
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      fail(field, "must use http or https");
    }
  } catch (error) {
    if (error instanceof RazorpayRouteValidationError) throw error;
    fail(field, "must be a valid URL");
  }
};

const assertNotes = (
  notes: Record<string, string>,
  field: string,
  maxValueLength = 512,
): void => {
  if (typeof notes !== "object" || notes === null || Array.isArray(notes)) {
    fail(field, "must be an object");
  }
  const entries = Object.entries(notes);
  if (entries.length > MAX_NOTES)
    fail(field, `supports at most ${MAX_NOTES} entries`);

  entries.forEach(([key, value], index) => {
    assertString(key, `${field}.key[${index}]`, 1, 255);
    assertString(value, `${field}.${key}`, 0, maxValueLength);
  });
};

const assertAddress = (address: VendorAddressInput, field: string): void => {
  if (typeof address !== "object" || address === null || Array.isArray(address)) {
    fail(field, "must be an object");
  }
  assertString(address.street1, `${field}.street1`, 1, 255);
  if (address.street2 !== undefined) {
    assertString(address.street2, `${field}.street2`, 1, 255);
  }
  assertString(address.city, `${field}.city`, 1, 100);
  assertString(address.state, `${field}.state`, 1, 100);
  assertString(address.postalCode, `${field}.postalCode`, 3, 12);
  if (address.country !== undefined) {
    assertString(address.country, `${field}.country`, 2, 2);
  }
  const country = (address.country ?? "IN").toUpperCase();
  if (country === "IN" && !/^\d{6}$/.test(address.postalCode)) {
    fail(`${field}.postalCode`, "must be a 6-digit Indian postal code");
  }
  if (address.country !== undefined && !/^[A-Za-z]{2}$/.test(address.country)) {
    fail(`${field}.country`, "must be a 2-letter country code");
  }
};

const assertContactInfo = (
  contactInfo: VendorContactInfoInput,
  field: string,
): void => {
  if (
    typeof contactInfo !== "object" ||
    contactInfo === null ||
    Array.isArray(contactInfo)
  ) {
    fail(field, "must be an object");
  }

  if (!contactInfo.chargeback && !contactInfo.refund && !contactInfo.support) {
    fail(field, "must contain chargeback, refund, or support details");
  }

  (["chargeback", "refund", "support"] as const).forEach((key) => {
    const channel = contactInfo[key];
    if (!channel) return;
    if (typeof channel !== "object" || Array.isArray(channel)) {
      fail(`${field}.${key}`, "must be an object");
    }
    if (channel.email !== undefined)
      assertEmail(channel.email, `${field}.${key}.email`);
    if (channel.phone !== undefined)
      assertPhone(channel.phone, `${field}.${key}.phone`);
    if (channel.policyUrl !== undefined) {
      assertUrl(channel.policyUrl, `${field}.${key}.policyUrl`);
    }
    if (
      channel.email === undefined &&
      channel.phone === undefined &&
      channel.policyUrl === undefined
    ) {
      fail(`${field}.${key}`, "must contain at least one contact field");
    }
  });
};

const assertApps = (apps: VendorAppsInput, field: string): void => {
  if (typeof apps !== "object" || apps === null || Array.isArray(apps)) {
    fail(field, "must be an object");
  }
  if (!apps.websites && !apps.android && !apps.ios) {
    fail(field, "must contain websites, android, or ios details");
  }
  if (apps.websites !== undefined && !Array.isArray(apps.websites)) {
    fail(`${field}.websites`, "must be an array");
  }
  if (apps.android !== undefined && !Array.isArray(apps.android)) {
    fail(`${field}.android`, "must be an array");
  }
  if (apps.ios !== undefined && !Array.isArray(apps.ios)) {
    fail(`${field}.ios`, "must be an array");
  }
  if (
    (apps.websites?.length ?? 0) +
      (apps.android?.length ?? 0) +
      (apps.ios?.length ?? 0) ===
    0
  ) {
    fail(field, "must contain at least one app or website");
  }

  apps.websites?.forEach((url, index) =>
    assertUrl(url, `${field}.websites[${index}]`),
  );
  (["android", "ios"] as const).forEach((platform) => {
    apps[platform]?.forEach((app, index) => {
      if (typeof app !== "object" || app === null || Array.isArray(app)) {
        fail(`${field}.${platform}[${index}]`, "must be an object");
      }
      assertString(app.name, `${field}.${platform}[${index}].name`, 1, 255);
      // Razorpay's own app examples include store addresses without a scheme.
      assertString(app.url, `${field}.${platform}[${index}].url`, 1, 2048);
    });
  });
};

const assertReferenceId = (referenceId: string): void => {
  // Razorpay's current docs disagree on the upper bound. Keep the request-side
  // 512-character limit while enforcing the separately documented minimum of 3.
  assertString(referenceId, "referenceId", 3, 512);
  if (/\p{C}/u.test(referenceId))
    fail("referenceId", "must not contain control characters");
};

export const validateRequestOptions = (
  options: RazorpayRouteRequestOptions,
): void => {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    fail("options", "must be an object");
  }
  if (options.timeoutMs === undefined) return;
  if (
    !Number.isInteger(options.timeoutMs) ||
    options.timeoutMs <= 0 ||
    options.timeoutMs > MAX_TIMEOUT_MS
  ) {
    fail("timeoutMs", `must be an integer between 1 and ${MAX_TIMEOUT_MS}`);
  }
};

export const validateAccountId = (accountId: string): void => {
  if (
    typeof accountId !== "string" ||
    accountId.length > 18 ||
    !/^acc_[A-Za-z0-9]+$/.test(accountId)
  ) {
    fail(
      "accountId",
      "must be a Razorpay Linked Account id starting with acc_",
    );
  }
};

export const validateStakeholderId = (stakeholderId: string): void => {
  if (
    typeof stakeholderId !== "string" ||
    stakeholderId.length > 18 ||
    !/^sth_[A-Za-z0-9]+$/.test(stakeholderId)
  ) {
    fail(
      "stakeholderId",
      "must be a Razorpay stakeholder id starting with sth_",
    );
  }
};

export const validateProductId = (productId: string): void => {
  if (
    typeof productId !== "string" ||
    !/^acc_prd_[A-Za-z0-9]+$/.test(productId)
  ) {
    fail("productId", "must be a Razorpay product id starting with acc_prd_");
  }
};

const validateCommonAccountFields = (
  input: CreateVendorInput | UpdateLinkedAccountInput,
): void => {
  if (input.phone !== undefined) assertPhone(input.phone, "phone");
  if (input.referenceId !== undefined) assertReferenceId(input.referenceId);
  if (input.legalBusinessName !== undefined) {
    assertString(input.legalBusinessName, "legalBusinessName", 4, 200);
  }
  if (input.customerFacingBusinessName !== undefined) {
    assertString(
      input.customerFacingBusinessName,
      "customerFacingBusinessName",
      1,
      255,
    );
  }
  if (input.contactName !== undefined) {
    assertString(input.contactName, "contactName", 4, 255);
  }
  if (input.category !== undefined) assertCode(input.category, "category");
  if (input.subcategory !== undefined)
    assertCode(input.subcategory, "subcategory");
  if (input.businessModel !== undefined) {
    assertString(input.businessModel, "businessModel", 1, 255);
  }
  if (input.pan !== undefined) assertPan(input.pan, "pan");
  if (input.gst !== undefined) assertGst(input.gst, "gst");
  if (input.registeredAddress !== undefined)
    assertAddress(input.registeredAddress, "registeredAddress");
  if (input.operationAddress !== undefined)
    assertAddress(input.operationAddress, "operationAddress");
  if (input.contactInfo !== undefined)
    assertContactInfo(input.contactInfo, "contactInfo");
  if (input.apps !== undefined) assertApps(input.apps, "apps");
  if (input.notes !== undefined) assertNotes(input.notes, "notes");
};

export const validateCreateVendorInput = (input: CreateVendorInput): void => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    fail("input", "must be an object");
  }
  assertEmail(input.email, "email");
  assertPhone(input.phone, "phone");
  assertString(input.legalBusinessName, "legalBusinessName", 4, 200);
  if (!BUSINESS_TYPES.has(input.businessType)) {
    fail("businessType", "must be a supported Razorpay business type");
  }
  assertCode(input.category, "category");
  assertCode(input.subcategory, "subcategory");
  validateCommonAccountFields(input);
};

export const validateUpdateLinkedAccountInput = (
  input: UpdateLinkedAccountInput,
): void => {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).length === 0
  ) {
    fail("input", "must contain at least one field to update");
  }
  if ((input.category === undefined) !== (input.subcategory === undefined)) {
    fail("profile", "category and subcategory must be updated together");
  }
  validateCommonAccountFields(input);
};

const assertStakeholderAddress = (
  address: StakeholderResidentialAddressInput,
): void => {
  if (typeof address !== "object" || address === null || Array.isArray(address)) {
    fail("residentialAddress", "must be an object");
  }
  assertString(address.street, "residentialAddress.street", 1, 255);
  assertString(address.city, "residentialAddress.city", 1, 100);
  assertString(address.state, "residentialAddress.state", 1, 100);
  assertString(address.postalCode, "residentialAddress.postalCode", 3, 12);
  if (address.country !== undefined) {
    assertString(address.country, "residentialAddress.country", 2, 2);
  }
  const country = (address.country ?? "IN").toUpperCase();
  if (country === "IN" && !/^\d{6}$/.test(address.postalCode)) {
    fail(
      "residentialAddress.postalCode",
      "must be a 6-digit Indian postal code",
    );
  }
  if (address.country !== undefined && !/^[A-Za-z]{2}$/.test(address.country)) {
    fail("residentialAddress.country", "must be a 2-letter country code");
  }
};

const validateStakeholderCommon = (input: CreateStakeholderInput): void => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    fail("input", "must be an object");
  }
  assertEmail(input.email, "email");
  if (input.name !== undefined) assertString(input.name, "name", 1, 255);
  if (input.percentageOwnership !== undefined) {
    const value = input.percentageOwnership;
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      fail("percentageOwnership", "must be between 0 and 100");
    }
    if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-8) {
      fail("percentageOwnership", "supports at most two decimal places");
    }
  }
  if (input.relationship !== undefined) {
    if (
      typeof input.relationship !== "object" ||
      input.relationship === null ||
      Array.isArray(input.relationship)
    ) {
      fail("relationship", "must be an object");
    }
    const { director, executive } = input.relationship;
    if (director === undefined && executive === undefined) {
      fail("relationship", "must contain director or executive");
    }
    if (director !== undefined && typeof director !== "boolean") {
      fail("relationship.director", "must be a boolean");
    }
    if (executive !== undefined && typeof executive !== "boolean") {
      fail("relationship.executive", "must be a boolean");
    }
  }
  if (input.primaryPhone !== undefined)
    assertPhone(input.primaryPhone, "primaryPhone");
  if (input.secondaryPhone !== undefined) {
    assertPhone(input.secondaryPhone, "secondaryPhone");
  }
  if (input.residentialAddress !== undefined)
    assertStakeholderAddress(input.residentialAddress);
  if (input.pan !== undefined) assertPan(input.pan, "pan");
  if (input.notes !== undefined) assertNotes(input.notes, "notes", 512);
};

export const validateCreateStakeholderInput = (
  input: CreateStakeholderInput,
): void => validateStakeholderCommon(input);

export const validateUpdateStakeholderInput = (
  input: UpdateStakeholderInput,
): void => {
  validateStakeholderCommon(input);
  assertString(input.name, "name", 1, 255);
};

export const validateSettlementInput = (
  input: ConfigureRouteSettlementsInput,
): void => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    fail("input", "must be an object");
  }
  if (input.tncAccepted !== true)
    fail("tncAccepted", "must be explicitly true");
  assertString(input.accountNumber, "accountNumber", 5, 20);
  const accountNumber = input.accountNumber.trim();
  if (!ACCOUNT_NUMBER_PATTERN.test(accountNumber)) {
    fail("accountNumber", "must contain 5 to 20 alphanumeric characters");
  }
  assertString(input.ifscCode, "ifscCode", 11, 11);
  if (!IFSC_PATTERN.test(input.ifscCode.trim().toUpperCase())) {
    fail("ifscCode", "must be a valid 11-character IFSC code");
  }
  assertString(input.beneficiaryName, "beneficiaryName", 1, 255);
};
