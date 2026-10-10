# Call Billing Flow – Reliable, Atomic, Idempotent

## Overview
This describes the corrected and robust billing workflow for call sessions (voice/video) between user and provider.

The billing system uses:
- **CallSession model** – Tracks time, status, billed duration, rates, and state per call.
- **Wallet/WalletTransaction** – Handles debit/credit to user, provider, admin wallets.
- **CommissionModel** – Manages global and slab-based commission split.
- **callBillingWorker** – Runs every N seconds to deduct for live calls.
- **/endCall API** – Finalizes total time, corrects any missed seconds, closes out the session.

## Key Guarantees
- **No Double Billing:** All wallet/earning/transaction actions use strict `billedDuration` field. Both the worker and `/endCall` only ever bill for **unbilled** time since call started. You can call `/endCall` as many times as you want, *it is idempotent*.
- **Atomic Updates:** Multi-model changes (session, wallet, earnings, transactions) on call end use a MongoDB transaction, so either all or nothing is committed.
- **Fair Final Billing:** Any seconds missed by the worker are always caught up in one atomic action when `/endCall` is called.
- **Debuggable:** Extensive logging occurs for every wallet update, earning increment, warning, or abnormal state transition.
- **Commission Invariant:** At every billing, `providerSharePaise + adminSharePaise == perMinutePricePaise` is checked. If not, a log warning is emitted.

## Workflow
1. **Call Start**: `/initiateCall` verifies user balance. Creates new CallSession.
2. **Mark Connected**: `/connected` sets real start time.
3. **During Call (Worker):** Every `window` seconds (default 5), worker bills for new (`unbilled`) duration via `partialBill`. Updates billedDuration and writes wallet transactions for all participants.
4. **Call End:**
    - `/endCall` invokes `finalizeBilling`. This:
        - Calculates total seconds from real `startedAt`.
        - Determines any **unbilled** time since last worker tick.
        - If there is unbilled time, performs wallet, earnings, transaction writes – all inside a transaction. Writes logs for every change.
        - Marks session as officially `ended`, sets `endedAt`, and records exact totals.
    - If the call is already ended, `/endCall` does no further action but returns session info. No double debit ever happens.


## Developer Notes
- **Idempotency is enforced:** You can safely retry `/endCall` even during race/worker intervals, or if a user force-ends a call.
- **Edge Cases:** If the worker is delayed or app restarts, nothing will be double-billed.
- **Extensibility:** The code is heavily commented and logs all critical events. Read logs to debug any workflow or rare concurrency edge.
- **Testing:** Simulate call session events and hit `/endCall` multiple times to verify reliabilty and no double-spending.

## Maintenance
Whenever updating commission slabs, make sure to validate `providerSharePaise + adminSharePaise` for each slab matches `perMinutePricePaise` for business integrity.

---
**Contact the backend team for questions on edge-case handling, or see `CallService.finalizeBilling()` for current logic.**
