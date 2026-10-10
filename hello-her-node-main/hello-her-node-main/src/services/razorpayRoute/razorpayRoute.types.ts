export interface RazorpayRouteRequestOptions {
  /** Per-request timeout. Defaults to 15 seconds. */
  timeoutMs?: number;
}

export type RazorpayRouteBusinessType =
  | "llp"
  | "ngo"
  | "individual"
  | "partnership"
  | "proprietorship"
  | "public_limited"
  | "private_limited"
  | "trust"
  | "society"
  | "not_yet_registered"
  | "educational_institutes";

export interface VendorAddressInput {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

/** Backwards-compatible name retained for future callers of the first draft. */
export type VendorRegisteredAddressInput = VendorAddressInput;

export interface VendorContactChannelInput {
  email?: string;
  phone?: string;
  policyUrl?: string;
}

export interface VendorContactInfoInput {
  chargeback?: VendorContactChannelInput;
  refund?: VendorContactChannelInput;
  support?: VendorContactChannelInput;
}

export interface VendorAppInput {
  name: string;
  url: string;
}

export interface VendorAppsInput {
  websites?: string[];
  android?: VendorAppInput[];
  ios?: VendorAppInput[];
}

/**
 * Data accepted by Razorpay when a Route Linked Account is created.
 *
 * `referenceId` is deliberately optional. Razorpay accepts it only when the
 * parent merchant has the `route_code_support` feature enabled.
 */
export interface CreateVendorInput {
  email: string;
  phone: string;
  legalBusinessName: string;
  businessType: RazorpayRouteBusinessType;
  category: string;
  subcategory: string;
  referenceId?: string;
  customerFacingBusinessName?: string;
  contactName?: string;
  businessModel?: string;
  pan?: string;
  gst?: string;
  registeredAddress?: VendorAddressInput;
  operationAddress?: VendorAddressInput;
  contactInfo?: VendorContactInfoInput;
  apps?: VendorAppsInput;
  notes?: Record<string, string>;
}

export type CreateLinkedAccountInput = CreateVendorInput;

/** `email` and `businessType` cannot be changed through Razorpay's API. */
export interface UpdateLinkedAccountInput {
  phone?: string;
  referenceId?: string;
  legalBusinessName?: string;
  customerFacingBusinessName?: string;
  contactName?: string;
  category?: string;
  subcategory?: string;
  businessModel?: string;
  pan?: string;
  gst?: string;
  registeredAddress?: VendorAddressInput;
  operationAddress?: VendorAddressInput;
  contactInfo?: VendorContactInfoInput;
  apps?: VendorAppsInput;
  notes?: Record<string, string>;
}

export interface RazorpayAccountAddressPayload {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface RazorpayContactChannelPayload {
  email?: string;
  phone?: string;
  policy_url?: string;
}

export interface RazorpayLinkedAccountProfilePayload {
  category?: string;
  subcategory?: string;
  business_model?: string;
  addresses?: {
    registered?: RazorpayAccountAddressPayload;
    operation?: RazorpayAccountAddressPayload;
  };
}

export interface RazorpayLinkedAccountPayload {
  email: string;
  phone: string;
  type: "route";
  reference_id?: string;
  legal_business_name: string;
  customer_facing_business_name?: string;
  business_type: RazorpayRouteBusinessType;
  contact_name?: string;
  profile: RazorpayLinkedAccountProfilePayload & {
    category: string;
    subcategory: string;
  };
  legal_info?: {
    pan?: string;
    gst?: string;
  };
  contact_info?: {
    chargeback?: RazorpayContactChannelPayload;
    refund?: RazorpayContactChannelPayload;
    support?: RazorpayContactChannelPayload;
  };
  apps?: {
    websites?: string[];
    android?: VendorAppInput[];
    ios?: VendorAppInput[];
  };
  notes?: Record<string, string>;
}

export interface RazorpayLinkedAccountUpdatePayload {
  phone?: string;
  reference_id?: string;
  legal_business_name?: string;
  customer_facing_business_name?: string;
  contact_name?: string;
  profile?: RazorpayLinkedAccountProfilePayload;
  legal_info?: {
    pan?: string;
    gst?: string;
  };
  contact_info?: RazorpayLinkedAccountPayload["contact_info"];
  apps?: RazorpayLinkedAccountPayload["apps"];
  notes?: Record<string, string>;
}

export interface RazorpayLinkedAccount {
  id: string;
  type: "route";
  status: string;
  reference_id?: string;
  email?: string;
  phone?: string | number;
  legal_business_name?: string;
  customer_facing_business_name?: string;
  business_type?: RazorpayRouteBusinessType | string;
  contact_name?: string;
  profile?: {
    category?: string;
    subcategory?: string;
    business_model?: string;
    addresses?: Record<string, unknown>;
    [key: string]: unknown;
  };
  legal_info?: {
    pan?: string;
    gst?: string;
  };
  contact_info?: Record<string, unknown>;
  apps?: Record<string, unknown>;
  notes?: Record<string, string> | unknown[];
  created_at?: number;
  [key: string]: unknown;
}

export interface StakeholderResidentialAddressInput {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface StakeholderRelationshipInput {
  director?: boolean;
  executive?: boolean;
}

export interface CreateStakeholderInput {
  email: string;
  name?: string;
  percentageOwnership?: number;
  relationship?: StakeholderRelationshipInput;
  primaryPhone?: string;
  secondaryPhone?: string;
  residentialAddress?: StakeholderResidentialAddressInput;
  pan?: string;
  notes?: Record<string, string>;
}

/** Razorpay's stakeholder update API documents both name and email as required. */
export interface UpdateStakeholderInput
  extends Omit<CreateStakeholderInput, "name"> {
  name: string;
}

export interface RazorpayStakeholderPayload {
  name?: string;
  email: string;
  percentage_ownership?: number;
  relationship?: StakeholderRelationshipInput;
  phone?: {
    primary?: string;
    secondary?: string;
  };
  addresses?: {
    residential: {
      street: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
  kyc?: {
    pan: string;
  };
  notes?: Record<string, string>;
}

export interface RazorpayStakeholder {
  id: string;
  entity: "stakeholder";
  name?: string;
  email?: string;
  percentage_ownership?: number;
  relationship?: StakeholderRelationshipInput;
  phone?: {
    primary?: string | number;
    secondary?: string | number;
  };
  addresses?: Record<string, unknown>;
  kyc?: {
    pan?: string;
    [key: string]: unknown;
  };
  notes?: Record<string, string> | unknown[];
  [key: string]: unknown;
}

export interface AcceptRouteTermsInput {
  /** Must be explicitly set to true by the caller accepting Razorpay's terms. */
  tncAccepted: true;
}

export interface ConfigureRouteSettlementsInput extends AcceptRouteTermsInput {
  accountNumber: string;
  ifscCode: string;
  beneficiaryName: string;
}

export interface RazorpayRouteProductRequestPayload {
  product_name: "route";
  tnc_accepted: true;
}

export interface RazorpayRouteSettlementPayload {
  settlements: {
    account_number: string;
    ifsc_code: string;
    beneficiary_name: string;
  };
  tnc_accepted: true;
}

export type RazorpayRouteProductActivationStatus =
  | "requested"
  | "needs_clarification"
  | "under_review"
  | "activated"
  | "suspended";

export interface RazorpayRouteProductRequirement {
  field_reference: string;
  resolution_url: string;
  reason_code: string;
  status: string;
  description?: string;
  [key: string]: unknown;
}

export interface RazorpayRouteProduct {
  id: string;
  account_id: string;
  product_name: "route";
  activation_status: RazorpayRouteProductActivationStatus;
  requested_configuration: Record<string, unknown> | unknown[];
  active_configuration: {
    settlements?: {
      account_number?: string | number | null;
      ifsc_code?: string | null;
      beneficiary_name?: string | null;
    };
    [key: string]: unknown;
  };
  requirements: RazorpayRouteProductRequirement[];
  tnc?: {
    id: string;
    accepted: boolean;
    accepted_at: number;
  };
  requested_at?: number;
  [key: string]: unknown;
}
