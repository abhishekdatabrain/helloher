const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildDueCallFilter,
  calculateBillableDuration,
  createNonOverlappingRunner,
  enforceUniqueDueSessions,
  selectDueDisconnect,
} = require("../src/services/callBillingWorker.core");

test("processed sessions are excluded from every due-call scan", () => {
  const now = new Date("2026-08-13T10:00:00.000Z");

  assert.deepEqual(buildDueCallFilter(now), {
    status: "connected",
    billingProcessed: { $ne: true },
    $or: [
      { heartbeatExpiresAt: { $lte: now } },
      { autoEndAt: { $lte: now } },
    ],
  });
});

test("one deterministic reason is selected when both deadlines are due", () => {
  const dueAt = new Date("2026-08-13T10:00:30.000Z");
  const heartbeatExpiresAt = new Date("2026-08-13T10:00:10.000Z");
  const autoEndAt = new Date("2026-08-13T10:00:20.000Z");

  assert.deepEqual(
    selectDueDisconnect({ heartbeatExpiresAt, autoEndAt }, dueAt),
    { deadline: heartbeatExpiresAt, reason: "TIMEOUT" },
  );
});

test("wallet deadline wins an exact tie", () => {
  const deadline = new Date("2026-08-13T10:00:10.000Z");

  assert.deepEqual(
    selectDueDisconnect(
      { heartbeatExpiresAt: deadline, autoEndAt: deadline },
      new Date("2026-08-13T10:00:30.000Z"),
    ),
    { deadline, reason: "INSUFFICIENT_BALANCE" },
  );
});

test("wallet reason wins when its deadline expired first", () => {
  const dueAt = new Date("2026-08-13T10:00:30.000Z");
  const autoEndAt = new Date("2026-08-13T10:00:10.000Z");

  assert.deepEqual(
    selectDueDisconnect(
      {
        heartbeatExpiresAt: new Date("2026-08-13T10:00:20.000Z"),
        autoEndAt,
      },
      dueAt,
    ),
    { deadline: autoEndAt, reason: "INSUFFICIENT_BALANCE" },
  );
});

test("a deadline equal to scan time is due", () => {
  const dueAt = new Date("2026-08-13T10:00:30.000Z");

  assert.deepEqual(
    selectDueDisconnect({ heartbeatExpiresAt: dueAt }, dueAt),
    { deadline: dueAt, reason: "TIMEOUT" },
  );
});

test("a renewed future heartbeat is not considered due", () => {
  const dueAt = new Date("2026-08-13T10:00:30.000Z");

  assert.equal(
    selectDueDisconnect(
      { heartbeatExpiresAt: new Date("2026-08-13T10:00:31.000Z") },
      dueAt,
    ),
    null,
  );
});

test("billing cycles cannot overlap in one process", async () => {
  let releaseFirst;
  const firstTask = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  let calls = 0;
  const run = createNonOverlappingRunner(async () => {
    calls += 1;
    await firstTask;
  });

  const firstRun = run();
  await Promise.resolve();
  assert.equal(await run(), false);
  assert.equal(calls, 1);

  releaseFirst();
  assert.equal(await firstRun, true);
  assert.equal(await run(), true);
  assert.equal(calls, 2);
});

test("cycle lock is released after failure", async () => {
  let calls = 0;
  const run = createNonOverlappingRunner(async () => {
    calls += 1;
    if (calls === 1) throw new Error("expected test failure");
  });

  await assert.rejects(run(), /expected test failure/);
  assert.equal(await run(), true);
  assert.equal(calls, 2);
});

test("duplicate scan rows finalize once and only the claim winner is logged", async () => {
  const finalized = [];
  const logged = [];

  await enforceUniqueDueSessions(
    [{ sessionId: "same" }, { sessionId: "same" }, { sessionId: "loser" }],
    async (sessionId) => {
      finalized.push(sessionId);
      return sessionId === "same"
        ? { processed: true, reason: "TIMEOUT", channel: "call_same" }
        : { processed: false };
    },
    (sessionId, finalization) => logged.push({ sessionId, finalization }),
  );

  assert.deepEqual(finalized, ["same", "loser"]);
  assert.deepEqual(logged, [
    {
      sessionId: "same",
      finalization: {
        processed: true,
        reason: "TIMEOUT",
        channel: "call_same",
      },
    },
  ]);
});

test("worker delay never adds billable seconds past the chosen deadline", () => {
  const startedAt = new Date("2026-08-13T10:00:00.000Z");
  const deadline = new Date("2026-08-13T10:01:30.000Z");
  const workerNow = new Date("2026-08-13T10:01:45.000Z");

  assert.deepEqual(
    calculateBillableDuration(startedAt, deadline, workerNow, 30),
    { endedAt: deadline, totalSeconds: 90, unbilledSeconds: 60 },
  );
});

test("invalid end times and billed durations clamp safely", () => {
  const startedAt = new Date("2026-08-13T10:00:10.000Z");

  assert.deepEqual(
    calculateBillableDuration(
      startedAt,
      new Date("2026-08-13T10:00:00.000Z"),
      new Date("2026-08-13T10:01:00.000Z"),
      999,
    ),
    { endedAt: startedAt, totalSeconds: 0, unbilledSeconds: 0 },
  );
});
