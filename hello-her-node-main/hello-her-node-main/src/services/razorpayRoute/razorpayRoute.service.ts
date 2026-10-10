import axios, { Method } from "axios";
import {
  CreateVendorInput,
  AcceptRouteTermsInput,
  RazorpayLinkedAccount,
  CreateStakeholderInput,
  RazorpayLinkedAccountPayload,
  RazorpayAccountAddressPayload,
  RazorpayContactChannelPayload,
  ConfigureRouteSettlementsInput,
  RazorpayLinkedAccountUpdatePayload,
  RazorpayRouteProduct,
  RazorpayRouteRequestOptions,
  RazorpayRouteSettlementPayload,
  RazorpayRouteProductRequestPayload,
  RazorpayStakeholder,
  RazorpayStakeholderPayload,
  UpdateLinkedAccountInput,
  UpdateStakeholderInput,
  VendorAddressInput,
  VendorAppsInput,
  VendorContactChannelInput,
  VendorContactInfoInput,
} from "./razorpayRoute.types";
import {
  RazorpayRouteValidationError,
  validateAccountId,
  validateCreateStakeholderInput,
  validateCreateVendorInput,
  validateProductId,
  validateRequestOptions,
  validateSettlementInput,
  validateStakeholderId,
  validateUpdateLinkedAccountInput,
  validateUpdateStakeholderInput,
} from "./razorpayRoute.validation";

const RAZORPAY_API_BASE_URL = "https://api.razorpay.com";
const DEFAULT_TIMEOUT_MS = 15_000;

interface RazorpayRouteApiErrorOptions {
  statusCode?: number;
  code?: string;
  source?: string;
  step?: string;
  reason?: string;
  field?: string;
}

/** Sanitized API error that never retains Axios request config or credentials. */
export class RazorpayRouteApiError extends Error {
  readonly statusCode?: number;
  readonly code?: string;
  readonly source?: string;
  readonly step?: string;
  readonly reason?: string;
  readonly field?: string;

  constructor(message: string, options: RazorpayRouteApiErrorOptions = {}) {
    super(message);
    this.name = "RazorpayRouteApiError";
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.source = options.source;
    this.step = options.step;
    this.reason = options.reason;
    this.field = options.field;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (
  record: Record<string, unknown>,
  key: string,
): string | undefined =>
  typeof record[key] === "string" ? (record[key] as string) : undefined;

const getRazorpayError = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) return {};
  return isRecord(value.error) ? value.error : value;
};

const resolveCredentials = (): { keyId: string; keySecret: string } => {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay Route is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
  }

  return { keyId, keySecret };
};

const requestRazorpayRoute = async <T>(
  method: Method,
  path: string,
  data: unknown,
  options: RazorpayRouteRequestOptions,
): Promise<T> => {
  validateRequestOptions(options);
  const { keyId, keySecret } = resolveCredentials();

  try {
    const response = await axios.request<T>({
      method,
      url: `${RAZORPAY_API_BASE_URL}${path}`,
      ...(data === undefined ? {} : { data }),
      auth: {
        username: keyId,
        password: keySecret,
      },
      headers: {
        Accept: "application/json",
        ...(data === undefined ? {} : { "Content-Type": "application/json" }),
      },
      timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    });

    return response.data;
  } catch (error: unknown) {
    if (!axios.isAxiosError(error)) throw error;

    const apiError = getRazorpayError(error.response?.data);

    throw new RazorpayRouteApiError(
      getString(apiError, "description") ??
        error.message ??
        "Razorpay Route request failed",
      {
        statusCode: error.response?.status,
        code: getString(apiError, "code") ?? error.code,
        source: getString(apiError, "source"),
        step: getString(apiError, "step"),
        reason: getString(apiError, "reason"),
        field: getString(apiError, "field"),
      },
    );
  }
};

const mapAccountAddress = (
  address: VendorAddressInput,
): RazorpayAccountAddressPayload => ({
  street1: address.street1.trim(),
  ...(address.street2 ? { street2: address.street2.trim() } : {}),
  city: address.city.trim(),
  state: address.state.trim(),
  postal_code: address.postalCode.trim(),
  country: (address.country ?? "IN").trim().toUpperCase(),
});

const mapContactChannel = (
  channel: VendorContactChannelInput,
): RazorpayContactChannelPayload => ({
  ...(channel.email !== undefined ? { email: channel.email.trim() } : {}),
  ...(channel.phone !== undefined ? { phone: channel.phone.trim() } : {}),
  ...(channel.policyUrl !== undefined
    ? { policy_url: channel.policyUrl.trim() }
    : {}),
});

const mapContactInfo = (
  contactInfo: VendorContactInfoInput,
): NonNullable<RazorpayLinkedAccountPayload["contact_info"]> => ({
  ...(contactInfo.chargeback
    ? { chargeback: mapContactChannel(contactInfo.chargeback) }
    : {}),
  ...(contactInfo.refund
    ? { refund: mapContactChannel(contactInfo.refund) }
    : {}),
  ...(contactInfo.support
    ? { support: mapContactChannel(contactInfo.support) }
    : {}),
});

const mapApps = (
  apps: VendorAppsInput,
): NonNullable<RazorpayLinkedAccountPayload["apps"]> => ({
  ...(apps.websites
    ? { websites: apps.websites.map((website) => website.trim()) }
    : {}),
  ...(apps.android
    ? {
        android: apps.android.map((app) => ({
          name: app.name.trim(),
          url: app.url.trim(),
        })),
      }
    : {}),
  ...(apps.ios
    ? {
        ios: apps.ios.map((app) => ({
          name: app.name.trim(),
          url: app.url.trim(),
        })),
      }
    : {}),
});

const mapAccountAddresses = (
  registeredAddress?: VendorAddressInput,
  operationAddress?: VendorAddressInput,
): NonNullable<RazorpayLinkedAccountPayload["profile"]["addresses"]> => ({
  ...(registeredAddress
    ? { registered: mapAccountAddress(registeredAddress) }
    : {}),
  ...(operationAddress
    ? { operation: mapAccountAddress(operationAddress) }
    : {}),
});

/** Converts camelCase application data to Razorpay's Linked Account payload. */
export const buildLinkedAccountPayload = (
  vendor: CreateVendorInput,
): RazorpayLinkedAccountPayload => {
  validateCreateVendorInput(vendor);

  const hasAddress = vendor.registeredAddress || vendor.operationAddress;
  const hasLegalInfo = vendor.pan || vendor.gst;

  return {
    email: vendor.email.trim(),
    phone: vendor.phone.trim(),
    type: "route",
    ...(vendor.referenceId ? { reference_id: vendor.referenceId.trim() } : {}),
    legal_business_name: vendor.legalBusinessName.trim(),
    ...(vendor.customerFacingBusinessName
      ? {
          customer_facing_business_name:
            vendor.customerFacingBusinessName.trim(),
        }
      : {}),
    business_type: vendor.businessType,
    ...(vendor.contactName ? { contact_name: vendor.contactName.trim() } : {}),
    profile: {
      category: vendor.category.trim(),
      subcategory: vendor.subcategory.trim(),
      ...(vendor.businessModel
        ? { business_model: vendor.businessModel.trim() }
        : {}),
      ...(hasAddress
        ? {
            addresses: mapAccountAddresses(
              vendor.registeredAddress,
              vendor.operationAddress,
            ),
          }
        : {}),
    },
    ...(hasLegalInfo
      ? {
          legal_info: {
            ...(vendor.pan ? { pan: vendor.pan.trim().toUpperCase() } : {}),
            ...(vendor.gst ? { gst: vendor.gst.trim().toUpperCase() } : {}),
          },
        }
      : {}),
    ...(vendor.contactInfo
      ? { contact_info: mapContactInfo(vendor.contactInfo) }
      : {}),
    ...(vendor.apps ? { apps: mapApps(vendor.apps) } : {}),
    ...(vendor.notes ? { notes: { ...vendor.notes } } : {}),
  };
};

/** Converts a partial application update to Razorpay's Linked Account payload. */
export const buildLinkedAccountUpdatePayload = (
  input: UpdateLinkedAccountInput,
): RazorpayLinkedAccountUpdatePayload => {
  validateUpdateLinkedAccountInput(input);

  const hasProfile =
    input.category !== undefined ||
    input.businessModel !== undefined ||
    input.registeredAddress !== undefined ||
    input.operationAddress !== undefined;
  const hasAddress = input.registeredAddress || input.operationAddress;
  const hasLegalInfo = input.pan !== undefined || input.gst !== undefined;

  return {
    ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
    ...(input.referenceId !== undefined
      ? { reference_id: input.referenceId.trim() }
      : {}),
    ...(input.legalBusinessName !== undefined
      ? { legal_business_name: input.legalBusinessName.trim() }
      : {}),
    ...(input.customerFacingBusinessName !== undefined
      ? {
          customer_facing_business_name:
            input.customerFacingBusinessName.trim(),
        }
      : {}),
    ...(input.contactName !== undefined
      ? { contact_name: input.contactName.trim() }
      : {}),
    ...(hasProfile
      ? {
          profile: {
            ...(input.category !== undefined
              ? {
                  category: input.category.trim(),
                  subcategory: input.subcategory!.trim(),
                }
              : {}),
            ...(input.businessModel !== undefined
              ? { business_model: input.businessModel.trim() }
              : {}),
            ...(hasAddress
              ? {
                  addresses: mapAccountAddresses(
                    input.registeredAddress,
                    input.operationAddress,
                  ),
                }
              : {}),
          },
        }
      : {}),
    ...(hasLegalInfo
      ? {
          legal_info: {
            ...(input.pan !== undefined
              ? { pan: input.pan.trim().toUpperCase() }
              : {}),
            ...(input.gst !== undefined
              ? { gst: input.gst.trim().toUpperCase() }
              : {}),
          },
        }
      : {}),
    ...(input.contactInfo !== undefined
      ? { contact_info: mapContactInfo(input.contactInfo) }
      : {}),
    ...(input.apps !== undefined ? { apps: mapApps(input.apps) } : {}),
    ...(input.notes !== undefined ? { notes: { ...input.notes } } : {}),
  };
};

/**
 * Creates one Route Linked Account. Persist the returned `acc_...` id before
 * starting the stakeholder step. This call is not automatically retried.
 */
export const createLinkedAccount = async (
  vendor: CreateVendorInput,
  options: RazorpayRouteRequestOptions = {},
): Promise<RazorpayLinkedAccount> =>
  requestRazorpayRoute(
    "POST",
    "/v2/accounts",
    buildLinkedAccountPayload(vendor),
    options,
  );

export const fetchLinkedAccount = async (
  accountId: string,
  options: RazorpayRouteRequestOptions = {},
): Promise<RazorpayLinkedAccount> => {
  validateAccountId(accountId);
  return requestRazorpayRoute(
    "GET",
    `/v2/accounts/${encodeURIComponent(accountId)}`,
    undefined,
    options,
  );
};

/** Razorpay does not permit `email` or `business_type` in this PATCH. */
export const updateLinkedAccount = async (
  accountId: string,
  input: UpdateLinkedAccountInput,
  options: RazorpayRouteRequestOptions = {},
): Promise<RazorpayLinkedAccount> => {
  validateAccountId(accountId);
  return requestRazorpayRoute(
    "PATCH",
    `/v2/accounts/${encodeURIComponent(accountId)}`,
    buildLinkedAccountUpdatePayload(input),
    options,
  );
};

const mapStakeholderPayload = (
  input: CreateStakeholderInput,
): RazorpayStakeholderPayload => ({
  ...(input.name !== undefined ? { name: input.name.trim() } : {}),
  email: input.email.trim(),
  ...(input.percentageOwnership !== undefined
    ? { percentage_ownership: input.percentageOwnership }
    : {}),
  ...(input.relationship
    ? {
        relationship: {
          ...(input.relationship.director !== undefined
            ? { director: input.relationship.director }
            : {}),
          ...(input.relationship.executive !== undefined
            ? { executive: input.relationship.executive }
            : {}),
        },
      }
    : {}),
  ...(input.primaryPhone || input.secondaryPhone
    ? {
        phone: {
          ...(input.primaryPhone ? { primary: input.primaryPhone.trim() } : {}),
          ...(input.secondaryPhone
            ? { secondary: input.secondaryPhone.trim() }
            : {}),
        },
      }
    : {}),
  ...(input.residentialAddress
    ? {
        addresses: {
          residential: {
            street: input.residentialAddress.street.trim(),
            city: input.residentialAddress.city.trim(),
            state: input.residentialAddress.state.trim(),
            postal_code: input.residentialAddress.postalCode.trim(),
            country: (input.residentialAddress.country ?? "IN")
              .trim()
              .toUpperCase(),
          },
        },
      }
    : {}),
  ...(input.pan ? { kyc: { pan: input.pan.trim().toUpperCase() } } : {}),
  ...(input.notes ? { notes: { ...input.notes } } : {}),
});

export const buildStakeholderPayload = (
  input: CreateStakeholderInput,
): RazorpayStakeholderPayload => {
  validateCreateStakeholderInput(input);
  return mapStakeholderPayload(input);
};

export const buildStakeholderUpdatePayload = (
  input: UpdateStakeholderInput,
): RazorpayStakeholderPayload => {
  validateUpdateStakeholderInput(input);
  return mapStakeholderPayload(input);
};

/** Route permits only one stakeholder for a Linked Account. Persist `sth_...`. */
export const createStakeholder = async (
  accountId: string,
  input: CreateStakeholderInput,
  options: RazorpayRouteRequestOptions = {},
): Promise<RazorpayStakeholder> => {
  validateAccountId(accountId);
  return requestRazorpayRoute(
    "POST",
    `/v2/accounts/${encodeURIComponent(accountId)}/stakeholders`,
    buildStakeholderPayload(input),
    options,
  );
};

export const updateStakeholder = async (
  accountId: string,
  stakeholderId: string,
  input: UpdateStakeholderInput,
  options: RazorpayRouteRequestOptions = {},
): Promise<RazorpayStakeholder> => {
  validateAccountId(accountId);
  validateStakeholderId(stakeholderId);
  return requestRazorpayRoute(
    "PATCH",
    `/v2/accounts/${encodeURIComponent(
      accountId,
    )}/stakeholders/${encodeURIComponent(stakeholderId)}`,
    buildStakeholderUpdatePayload(input),
    options,
  );
};

/**
 * Razorpay documents this stakeholder GET under its Partner APIs. Confirm that
 * the platform's Route keys are entitled to the endpoint in test mode.
 */
export const fetchStakeholder = async (
  accountId: string,
  stakeholderId: string,
  options: RazorpayRouteRequestOptions = {},
): Promise<RazorpayStakeholder> => {
  validateAccountId(accountId);
  validateStakeholderId(stakeholderId);
  return requestRazorpayRoute(
    "GET",
    `/v2/accounts/${encodeURIComponent(
      accountId,
    )}/stakeholders/${encodeURIComponent(stakeholderId)}`,
    undefined,
    options,
  );
};

export const buildRouteProductRequestPayload = (
  input: AcceptRouteTermsInput,
): RazorpayRouteProductRequestPayload => {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    input.tncAccepted !== true
  ) {
    throw new RazorpayRouteValidationError(
      "tncAccepted",
      "must be explicitly true",
    );
  }
  return { product_name: "route", tnc_accepted: true };
};

export const requestRouteProduct = async (
  accountId: string,
  input: AcceptRouteTermsInput,
  options: RazorpayRouteRequestOptions = {},
): Promise<RazorpayRouteProduct> => {
  validateAccountId(accountId);
  return requestRazorpayRoute(
    "POST",
    `/v2/accounts/${encodeURIComponent(accountId)}/products`,
    buildRouteProductRequestPayload(input),
    options,
  );
};

export const buildRouteSettlementPayload = (
  input: ConfigureRouteSettlementsInput,
): RazorpayRouteSettlementPayload => {
  validateSettlementInput(input);
  return {
    settlements: {
      account_number: input.accountNumber.trim(),
      ifsc_code: input.ifscCode.trim().toUpperCase(),
      beneficiary_name: input.beneficiaryName.trim(),
    },
    tnc_accepted: true,
  };
};

export const configureRouteSettlements = async (
  accountId: string,
  productId: string,
  input: ConfigureRouteSettlementsInput,
  options: RazorpayRouteRequestOptions = {},
): Promise<RazorpayRouteProduct> => {
  validateAccountId(accountId);
  validateProductId(productId);
  return requestRazorpayRoute(
    "PATCH",
    `/v2/accounts/${encodeURIComponent(
      accountId,
    )}/products/${encodeURIComponent(productId)}`,
    buildRouteSettlementPayload(input),
    options,
  );
};

export const fetchRouteProduct = async (
  accountId: string,
  productId: string,
  options: RazorpayRouteRequestOptions = {},
): Promise<RazorpayRouteProduct> => {
  validateAccountId(accountId);
  validateProductId(productId);
  return requestRazorpayRoute(
    "GET",
    `/v2/accounts/${encodeURIComponent(
      accountId,
    )}/products/${encodeURIComponent(productId)}`,
    undefined,
    options,
  );
};

export const isRouteProductActivated = (
  product: Pick<RazorpayRouteProduct, "activation_status">,
): boolean => product.activation_status === "activated";

// Vendor-oriented aliases for future application callers.
export const createVendor = createLinkedAccount;
export const fetchVendor = fetchLinkedAccount;
export const updateVendor = updateLinkedAccount;

// Names matching Razorpay's onboarding terminology.
export const requestProductConfiguration = requestRouteProduct;
export const configureSettlementBankAccount = configureRouteSettlements;
export const fetchProductConfiguration = fetchRouteProduct;

export { RazorpayRouteValidationError };
