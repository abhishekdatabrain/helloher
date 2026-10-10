import * as colors from "colors/safe";

export type BillingLogComponent = "BillingWorker" | "Billing";
export type BillingLogStatus =
  | "info"
  | "warning"
  | "success"
  | "idempotent"
  | "error";

export interface BillingLogEntry {
  component: BillingLogComponent;
  status: BillingLogStatus;
  event: string;
  sessionId?: string;
  channel?: string;
  reason?: string;
  result?: string;
}

interface BillingLogFormatOptions {
  color?: boolean;
  columns?: number;
  interactive?: boolean;
  timestamp?: Date;
}

const MIN_TABLE_WIDTH = 72;
const MAX_TABLE_WIDTH = 110;
const LABEL_WIDTH = 9;

const statusLabels: Record<BillingLogStatus, string> = {
  info: "INFO",
  warning: "WARNING",
  success: "SUCCESS",
  idempotent: "IDEMPOTENT",
  error: "ERROR",
};

const componentLabels: Record<BillingLogComponent, string> = {
  BillingWorker: "BILLING WORKER",
  Billing: "BILLING",
};

const sanitize = (value: unknown): string =>
  colors
    .stripColors(String(value ?? ""))
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const pad = (value: number, length = 2): string =>
  String(value).padStart(length, "0");

const formatTimestamp = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.` +
  pad(date.getMilliseconds(), 3);

const wrap = (value: string, width: number): string[] => {
  if (!value) return ["-"];

  const lines: string[] = [];
  let remaining = value;

  while (remaining.length > width) {
    const candidate = remaining.slice(0, width + 1);
    const lastSpace = candidate.lastIndexOf(" ");
    const splitAt = lastSpace > Math.floor(width * 0.5) ? lastSpace : width;

    lines.push(remaining.slice(0, splitAt).trimEnd());
    remaining = remaining.slice(splitAt).trimStart();
  }

  lines.push(remaining);
  return lines;
};

const quote = (value: string): string =>
  `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

const isColorEnabled = (interactive: boolean): boolean => {
  const forceColor = process.env.FORCE_COLOR;
  if (forceColor === "0" || forceColor === "false") return false;
  if (forceColor !== undefined) return true;

  return interactive && !process.env.NO_COLOR && process.env.TERM !== "dumb";
};

const colorForStatus = (status: BillingLogStatus, value: string): string => {
  switch (status) {
    case "warning":
      return colors.bold(colors.yellow(value));
    case "success":
      return colors.bold(colors.green(value));
    case "idempotent":
      return colors.dim(colors.cyan(value));
    case "error":
      return colors.bold(colors.red(value));
    default:
      return colors.bold(colors.blue(value));
  }
};

const formatPlainLog = (
  entry: BillingLogEntry,
  timestamp: string
): string => {
  const values = [
    timestamp,
    statusLabels[entry.status],
    `component=${entry.component}`,
    `event=${quote(sanitize(entry.event))}`,
  ];

  if (entry.sessionId) values.push(`session=${sanitize(entry.sessionId)}`);
  if (entry.channel) values.push(`channel=${sanitize(entry.channel)}`);
  if (entry.reason) values.push(`reason=${sanitize(entry.reason)}`);
  if (entry.result) values.push(`result=${quote(sanitize(entry.result))}`);

  return values.join(" ");
};

/**
 * Formats billing events as a readable terminal table while keeping a
 * single-line structured fallback for log files and aggregation platforms.
 */
export const formatBillingLog = (
  entry: BillingLogEntry,
  options: BillingLogFormatOptions = {}
): string => {
  const timestamp = formatTimestamp(options.timestamp ?? new Date());
  const interactive = options.interactive ?? Boolean(process.stdout.isTTY);
  const requestedColumns = options.columns ?? process.stdout.columns ?? 100;
  const width = Math.min(MAX_TABLE_WIDTH, Math.max(1, requestedColumns - 1));

  if (!interactive || width < MIN_TABLE_WIDTH) {
    return formatPlainLog(entry, timestamp);
  }

  const useColor = options.color ?? isColorEnabled(interactive);
  const tableWidth = Math.max(MIN_TABLE_WIDTH, width);
  const valueWidth = tableWidth - LABEL_WIDTH - 7;
  const title = `${timestamp} · ${componentLabels[entry.component]} · ${statusLabels[entry.status]}`;
  const topPrefix = `╭─ ${title} `;
  const top = `${topPrefix}${"─".repeat(Math.max(1, tableWidth - topPrefix.length - 1))}╮`;
  const bottom = `╰${"─".repeat(tableWidth - 2)}╯`;

  const fields: Array<[string, string | undefined]> = [
    ["Event", entry.event],
    ["Session", entry.sessionId],
    ["Channel", entry.channel],
    ["Reason", entry.reason],
    ["Result", entry.result],
  ];

  const rows = fields.flatMap(([rawLabel, rawValue]) => {
    if (!rawValue) return [];

    return wrap(sanitize(rawValue), valueWidth).map((line, index) => {
      const label = (index === 0 ? rawLabel : "").padEnd(LABEL_WIDTH);
      const value = line.padEnd(valueWidth);

      if (!useColor) return `│ ${label} │ ${value} │`;

      return (
        `${colors.grey("│")} ${colors.bold(colors.cyan(label))} ` +
        `${colors.grey("│")} ${value} ${colors.grey("│")}`
      );
    });
  });

  if (!useColor) return [top, ...rows, bottom].join("\n");

  return [
    colorForStatus(entry.status, top),
    ...rows,
    colors.grey(bottom),
  ].join("\n");
};

/** Writes each event in one operation so concurrent worker logs do not interleave. */
export const logBillingEvent = (entry: BillingLogEntry): void => {
  const stream = entry.status === "error" ? process.stderr : process.stdout;
  const output = formatBillingLog(entry, {
    interactive: Boolean(stream.isTTY),
    columns: stream.columns,
  });

  stream.write(`${output}\n`);
};
