# Razorpay Route: Standalone Vendor Management

## Scope and wiring status

This folder contains reusable Razorpay Route vendor-onboarding helpers. It is intentionally **not imported or mounted** by any controller, route, model, worker, webhook, withdrawal flow, or payment flow.

No API call happens automatically. A future caller must explicitly call each function and persist every returned Razorpay id/status before moving to the next step.

Implemented files:

- `src/services/razorpayRoute/razorpayRoute.service.ts` — API calls and payload builders.
- `src/services/razorpayRoute/razorpayRoute.types.ts` — public request/response types.
- `src/services/razorpayRoute/razorpayRoute.validation.ts` — local validation with credential-safe errors.
- `src/services/razorpayRoute/index.ts` — public exports.

## Implemented vendor APIs

| Helper | Razorpay endpoint | Purpose |
| --- | --- | --- |
| `createLinkedAccount` / `createVendor` | `POST /v2/accounts` | Create the vendor's Route Linked Account. |
| `fetchLinkedAccount` / `fetchVendor` | `GET /v2/accounts/:account_id` | Reconcile the current account data/status. |
| `updateLinkedAccount` / `updateVendor` | `PATCH /v2/accounts/:account_id` | Update supported fields. Email and business type cannot be updated here. |
| `createStakeholder` | `POST /v2/accounts/:account_id/stakeholders` | Create the single stakeholder supported by Route. |
| `updateStakeholder` | `PATCH /v2/accounts/:account_id/stakeholders/:stakeholder_id` | Correct or complete stakeholder KYC data. |
| `fetchStakeholder` | `GET /v2/accounts/:account_id/stakeholders/:stakeholder_id` | Fetch one stakeholder. See the entitlement note below. |
| `requestRouteProduct` / `requestProductConfiguration` | `POST /v2/accounts/:account_id/products` | Request Route activation after account and stakeholder creation. |
| `configureRouteSettlements` / `configureSettlementBankAccount` | `PATCH /v2/accounts/:account_id/products/:product_id` | Submit settlement bank details and accept terms. |
| `fetchRouteProduct` / `fetchProductConfiguration` | `GET /v2/accounts/:account_id/products/:product_id` | Poll/reconcile activation and clarification requirements. |

Razorpay documents `fetchStakeholder` under its Partner Stakeholder APIs rather than Route's private-auth endpoint index, but its official example uses API key/secret Basic Auth. Verify the platform's entitlement in Test mode before relying on it in a recovery workflow. The Partner “fetch all stakeholders” example uses access-token auth, so this Basic Auth module deliberately does not expose that uncertain endpoint.

## Configuration

The helpers resolve credentials only when called:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

Use test keys during development. Never pass credentials through request inputs or log complete KYC/bank objects.

The default HTTP timeout is 15 seconds. A caller can use `{ timeoutMs: 20_000 }`; accepted values are 1–120,000 ms.

Razorpay states that a Linked Account created in Test mode can also be used in Live mode. Do not create a duplicate vendor only for mode switching. Test/Live API keys and webhook configurations are still separate.

## Safe onboarding sequence

### 1. Confirm Route eligibility first

Current Razorpay Route requirements include both:

- Domestic turnover exceeding ₹40 lakh or export turnover exceeding ₹5 lakh in FY25/FY26.
- Payer-payee transparency: the Linked Account must directly provide the goods/services to the customer. Razorpay reviews a written Route use-case declaration.

The compliance deadline was December 31, 2025; Razorpay states that non-compliant access was disabled from January 1, 2026. Confirm Route is enabled for the platform before collecting production vendor KYC.

### 2. Create and persist the Linked Account

```ts
import { createVendor } from "./services/razorpayRoute";

const account = await createVendor({
  email: "provider@example.com",
  phone: "9876543210",
  legalBusinessName: "Example Service Provider",
  businessType: "individual",
  contactName: "Example Provider",

  // Illustration only. Use the category/subcategory approved by Razorpay for
  // the platform's actual business and vendor use case.
  category: "healthcare",
  subcategory: "clinic",
  businessModel: "Remote consultation services provided to platform users",

  pan: "ABCDE1234F",
  registeredAddress: {
    street1: "12 MG Road",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    country: "IN",
  },
});

// Persist immediately against the local vendor.
console.log(account.id); // acc_...
```

Do not copy a generic marketplace classification into production. Category/subcategory are Razorpay-controlled codes and must match the approved HelloHer use case.

`referenceId` is optional and is omitted by default. Only send it when Razorpay confirms that `route_code_support` is enabled for the parent account:

```ts
await createVendor({
  ...vendorInput,
  referenceId: "VENDOR_1001",
});
```

Razorpay's current documentation is inconsistent about the maximum `reference_id` length. The module validates the documented minimum of 3 and request-side maximum of 512, but Razorpay remains the final authority.

`status: "created"` means the Linked Account entity exists. It does **not** mean KYC, bank verification, Route product activation, cooling period, transfer readiness, or bank settlement is complete.

Persist at least:

- Local vendor id → Razorpay `account.id` (`acc_...`).
- Account status and last reconciliation time.
- The exact request fingerprint/state used for duplicate recovery.

### 3. Create and persist the stakeholder

Route supports a maximum of one stakeholder per Linked Account.

```ts
import { createStakeholder } from "./services/razorpayRoute";

const stakeholder = await createStakeholder(account.id, {
  name: "Example Provider",
  email: "provider@example.com",
  percentageOwnership: 100,
  relationship: {
    executive: true,
  },
  primaryPhone: "9876543210",
  pan: "ABCDE1234F",
  residentialAddress: {
    street: "12 MG Road",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    country: "IN",
  },
});

// Persist immediately.
console.log(stakeholder.id); // sth_...
```

Required stakeholder/KYC fields vary by business type. Follow Razorpay's current KYC matrix and returned requirements rather than assuming PAN alone is sufficient.

Stakeholder creation is not documented as idempotent. After an ambiguous timeout, do not blindly call it again. Reconcile through the Dashboard/support or `fetchStakeholder` when its id is already known and entitlement has been tested, then continue with the stored `sth_...` id.

### 4. Request and persist the Route product

Terms acceptance is an explicit input; the helper never silently accepts it:

```ts
import { requestRouteProduct } from "./services/razorpayRoute";

const product = await requestRouteProduct(account.id, {
  tncAccepted: true,
});

// Persist immediately.
console.log(product.id); // acc_prd_...
```

The product lifecycle is asynchronous:

- `requested`
- `needs_clarification`
- `under_review`
- `activated`
- `suspended`

Product creation is not documented as idempotent. Persist `acc_prd_...` before any subsequent update.

### 5. Submit bank details and monitor activation

```ts
import {
  configureSettlementBankAccount,
  fetchProductConfiguration,
  isRouteProductActivated,
} from "./services/razorpayRoute";

const configured = await configureSettlementBankAccount(
  account.id,
  product.id,
  {
    accountNumber: "001234567890",
    ifscCode: "HDFC0000317",
    beneficiaryName: "Example Provider",
    tncAccepted: true,
  }
);

const latest = await fetchProductConfiguration(account.id, product.id);

if (isRouteProductActivated(latest)) {
  // Mark the vendor Route product as activated in the application later.
}
```

For `needs_clarification`, inspect every item in `product.requirements`, including `field_reference`, `reason_code`, `description`, `status`, and `resolution_url`. The required correction may belong to the Linked Account, stakeholder, product, or a separately entitled Document API.

The product configuration `PATCH` submits settlement data; it is not a generic KYC upload endpoint. Razorpay's sub-merchant Document APIs are under Partner APIs and may require a different access-token/entitlement flow. Confirm this with Razorpay before implementing document upload.

When Penny Testing is enabled:

- Transfers are allowed only after successful bank validation.
- Verification failure can still leave the Linked Account created.
- Do not create a duplicate Linked Account after failure; Razorpay says to raise a support request to correct bank details and re-verify.
- Razorpay's FAQ says activation/failure notification may not be sent, so reconcile status explicitly.

## Update and concurrency rules

- `updateLinkedAccount` intentionally excludes `email` and `businessType`; Razorpay does not allow those fields in this update API. Its FAQ describes email correction as a Dashboard workflow.
- `referenceId` on update has the same `route_code_support` caveat as creation.
- `updateStakeholder` requires `name` and `email`, matching Razorpay's current update contract.
- Do not run Account, Stakeholder, and Product updates concurrently for the same `account_id`. Serialize them and wait for each Razorpay response.
- The module does not automatically retry POST/PATCH calls. A timeout can be ambiguous even when Razorpay created the resource.
- API errors are converted to `RazorpayRouteApiError`, which copies only sanitized Razorpay status/code/reason fields and does not retain Axios Basic Auth config.
- Local input errors throw `RazorpayRouteValidationError` before any HTTP request.

## Fields to persist when this is wired later

Keep these separate from the application's existing provider KYC/withdrawal state:

- `razorpayRouteAccountId` (`acc_...`)
- Linked Account status
- `razorpayRouteStakeholderId` (`sth_...`)
- `razorpayRouteProductId` (`acc_prd_...`)
- Product activation status
- Product requirements/clarification state
- Bank verification state and last checked time
- Onboarding request fingerprint and audit timestamps

Do not treat these states as interchangeable: account creation, product activation, bank validation, transfer processing, and bank settlement are different milestones.

## Payment and transfer phase — intentionally not implemented here

Transfers are not part of the standalone vendor-management client because they depend on customer payment capture, commission calculation, local idempotency, refunds, and reconciliation.

When the payment phase is implemented later:

- Linked Accounts have a documented 24-hour cooling period before transfers.
- Route supports INR; amounts must be integers in paise.
- Payment transfers use `POST /v1/payments/:payment_id/transfers` only after capture. Total transfers plus applicable fees must fit the captured amount, and transfers cannot be initiated after a refund starts.
- Direct Transfers use the primary Razorpay balance, are support-enabled/on-demand, and are not necessarily tied to a customer payment.
- Razorpay's `X-Transfer-Idempotency` header is currently supported only for Direct Transfers. Its key must be 4–36 supported characters, and a retry must reuse the same key and identical request body. Order/Payment transfers need application-level uniqueness, locking, and API/webhook reconciliation.
- Track transfer processing separately from Linked Account bank settlement. Razorpay states Linked Account settlements take two working days regardless of the primary account schedule.

## Webhook phase — intentionally not wired

Future Route webhook handling should at minimum cover `product.route.under_review`, `product.route.needs_clarification`, `product.route.activated`, `transfer.processed`, `transfer.failed`, and `settlement.processed`. Validate `X-Razorpay-Signature` against the untouched raw body, deduplicate `x-razorpay-event-id`, and tolerate duplicate/out-of-order delivery.

In this repository, the webhook raw-body parser must be mounted before the global JSON parser. This module does not modify the current app/router setup.

## Official references

- [Route overview and current eligibility](https://razorpay.com/docs/payments/route/?preferred-country=IN)
- [Route integration guide](https://razorpay.com/docs/payments/route/integration-guide/?preferred-country=IN)
- [Create a Linked Account](https://razorpay.com/docs/api/payments/route/create-linked-account/?preferred-country=IN)
- [Update a Linked Account](https://razorpay.com/docs/api/payments/route/update-linked-accounts/?preferred-country=IN)
- [Fetch a Linked Account](https://razorpay.com/docs/api/payments/route/fetch-with-id/?preferred-country=IN)
- [Create a Stakeholder](https://razorpay.com/docs/api/payments/route/create-stakeholder/?preferred-country=IN)
- [Update a Stakeholder](https://razorpay.com/docs/api/payments/route/update-stakeholder/?preferred-country=IN)
- [Fetch a Stakeholder With ID](https://razorpay.com/docs/api/partners/stakeholder/fetch-with-id/?preferred-country=IN)
- [Request Product Configuration](https://razorpay.com/docs/api/payments/route/request-product-config/?preferred-country=IN)
- [Update Product Configuration](https://razorpay.com/docs/api/payments/route/update-product-config/?preferred-country=IN)
- [Fetch Product Configuration](https://razorpay.com/docs/api/payments/route/fetch-product-config/?preferred-country=IN)
- [Product Configuration Entity](https://razorpay.com/docs/api/payments/route/product-configuration-entity/?preferred-country=IN)
- [Transfer prerequisites](https://razorpay.com/docs/payments/route/transfer-funds-to-linked-accounts/?preferred-country=IN)
- [Route compliance and Penny Testing FAQ](https://razorpay.com/docs/payments/route/faqs/?preferred-country=IN)
- [Route webhook events](https://razorpay.com/docs/webhooks/route/?preferred-country=IN)
- [Webhook validation](https://razorpay.com/docs/webhooks/validate-test/)
