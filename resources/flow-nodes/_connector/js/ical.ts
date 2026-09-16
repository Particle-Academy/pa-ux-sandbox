// GENERATED from @particle-academy/fancy-connector-core — src/ical.ts
// Do not edit here. Fix it in the package and re-run `node scripts/vendor.mjs --target <this directory>` there;
// a test fails the build when this copy and the package disagree.

/**
 * RFC 5545 in, a structured invite and its join targets out — the read MOIC's
 * meeting bot needs from nothing but the text a calendar API hands back.
 *
 * Written from scratch (the owner: no third-party code), as ONE
 * implementation in two runtimes — `php/src/Ical.php` is the twin — and held
 * to the authored corpus under `fixtures/ical/`, which both must reproduce
 * exactly. `fixtures/ical/README.md` lists every decision a case pins; the
 * ones easy to get differently in two languages are restated here:
 *
 * - Folded lines (a line break followed by a single space or tab) join
 *   before anything else runs; TEXT values are then RFC 5545-unescaped
 *   (`\n`, `\,`, `\;`, `\\`).
 * - `DTSTART`/`DTEND` always come back as UTC instants. A `Z` suffix passes
 *   through; a `TZID` parameter resolves through the calendar's own
 *   `VTIMEZONE` (an unknown TZID is refused BY NAME, never guessed); a value
 *   with neither — RFC 5545's FLOATING time — is treated as UTC, a decision
 *   named here rather than left to look like an oversight: resolving a
 *   floating time correctly needs the READER's timezone, which nothing in
 *   the invite carries.
 * - `RRULE` support is intentionally narrow: `FREQ` daily/weekly/monthly/
 *   yearly with `INTERVAL`, `COUNT` and `UNTIL`, and `BYDAY` for WEEKLY only.
 *   No `BYMONTHDAY`, `BYSETPOS`, `BYWEEKNO`, `BYYEARDAY`, `WKST`, `EXDATE` or
 *   `RDATE` — a recurring invite using one of those still parses (its RRULE
 *   fields are read, never dropped), but `nextOccurrence` does not attempt
 *   to walk it.
 * - Join targets are ALLOW-LISTED: Google Meet, Zoom (with its meeting id
 *   and passcode read out of the URL), Microsoft Teams, and a dial-in phone
 *   number with a passcode read from its own line. Anything else is ignored,
 *   never guessed at — a bot that tried an unknown link shape would attempt
 *   to join something it cannot handle.
 */

export type InviteMethod = "REQUEST" | "CANCEL";

export type Attendee = {
  name: string | null;
  email: string;
  role: string | null;
  partstat: string | null;
};

export type RecurrenceRule = {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  count: number | null;
  until: string | null;
  byDay: string[] | null;
};

export type Invite = {
  method: InviteMethod;
  uid: string;
  sequence: number;
  summary: string | null;
  description: string | null;
  location: string | null;
  status: string | null;
  dtstart: string;
  dtend: string | null;
  organizer: { name: string | null; email: string } | null;
  attendees: Attendee[];
  rrule: RecurrenceRule | null;
};

export type JoinTargetKind = "google-meet" | "zoom" | "teams" | "dial-in";

export type JoinTarget = {
  kind: JoinTargetKind;
  url: string | null;
  meetingId: string | null;
  passcode: string | null;
  phone: string | null;
};

/* ── Unfolding, unescaping, the property/parameter grammar ────────────────── */

/** A line break followed by a single space or tab joins with nothing between. */
function unfold(text: string): string {
  return text.replace(/\r\n|\r|\n/g, "\n").replace(/\n[ \t]/g, "");
}

/** `\n` -> newline, `\,` -> `,`, `\;` -> `;`, `\\` -> `\`. Order matters: `\\` last. */
function unescapeText(value: string): string {
  return value
    .replace(/\\[nN]/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

type Property = { name: string; params: Record<string, string>; value: string };

/**
 * One content line: `NAME;PARAM=VALUE;PARAM2=VALUE2:the value`. Parameter
 * values are not quote-aware beyond stripping a wrapping `"…"`, which is all
 * this corpus's providers ever send.
 */
function parseLine(line: string): Property {
  const colon = findUnquoted(line, ":");
  const head = colon === -1 ? line : line.slice(0, colon);
  const value = colon === -1 ? "" : line.slice(colon + 1);
  // split() on a string always returns at least one element.
  const [name = "", ...paramParts] = head.split(";");
  const params: Record<string, string> = {};

  for (const part of paramParts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).toUpperCase();
    let raw = part.slice(eq + 1);
    if (raw.startsWith('"') && raw.endsWith('"')) raw = raw.slice(1, -1);
    params[key] = raw;
  }

  return { name: name.toUpperCase(), params, value };
}

/** The first occurrence of `char` outside a `"…"` run. */
function findUnquoted(line: string, char: string): number {
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') quoted = !quoted;
    else if (line[i] === char && !quoted) return i;
  }
  return -1;
}

/** A block's direct-child lines between BEGIN:name and its matching END:name. */
function blockLines(lines: string[], name: string): string[][] {
  const blocks: string[][] = [];
  let depth = 0;
  let current: string[] | null = null;

  for (const raw of lines) {
    const upper = raw.toUpperCase();
    if (upper === `BEGIN:${name}`) {
      if (depth === 0) current = [];
      depth++;
      continue;
    }
    if (upper === `END:${name}`) {
      depth--;
      if (depth === 0 && current !== null) {
        blocks.push(current);
        current = null;
      }
      continue;
    }
    if (current !== null) current.push(raw);
  }

  return blocks;
}

/* ── VTIMEZONE ──────────────────────────────────────────────────────────── */

type TzTransition = { offsetFrom: string; offsetTo: string; month: number; ordinal: number; weekday: number };

const WEEKDAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

/** `2SU` -> ordinal 2, weekday 0 (Sunday). `-1SU` -> ordinal -1, weekday 0. */
function parseByDayOrdinal(token: string): { ordinal: number; weekday: number } {
  const match = /^(-?\d+)([A-Z]{2})$/.exec(token);
  if (!match) throw new Error(`ical: VTIMEZONE rule has an unreadable BYDAY "${token}"`);
  const [, ordinalText, weekdayText] = match;
  const weekday = WEEKDAY_CODES.indexOf(weekdayText ?? "");
  if (weekday === -1) throw new Error(`ical: VTIMEZONE rule names an unknown weekday "${weekdayText}"`);
  return { ordinal: Number(ordinalText), weekday };
}

function parseTzTransition(lines: string[]): TzTransition {
  const props = lines.map(parseLine);
  const get = (name: string) => props.find((p) => p.name === name)?.value;
  const offsetFrom = get("TZOFFSETFROM");
  const offsetTo = get("TZOFFSETTO");
  const rrule = get("RRULE");
  if (!offsetFrom || !offsetTo || !rrule) {
    throw new Error("ical: a VTIMEZONE sub-component needs TZOFFSETFROM, TZOFFSETTO and an RRULE");
  }

  const parts = Object.fromEntries(rrule.split(";").map((p) => p.split("=") as [string, string]));
  const month = Number(parts.BYMONTH);
  const { ordinal, weekday } = parseByDayOrdinal(parts.BYDAY ?? "");
  if (!month || Number.isNaN(ordinal)) {
    throw new Error(`ical: this package only reads a yearly BYMONTH+BYDAY transition rule, got "${rrule}"`);
  }

  return { offsetFrom, offsetTo, month, ordinal, weekday };
}

/** Minutes east of UTC from `+HHMM` / `-HHMM` / `+HH:MM`. */
function offsetMinutes(offset: string): number {
  const match = /^([+-])(\d{2}):?(\d{2})/.exec(offset);
  if (!match) throw new Error(`ical: unreadable UTC offset "${offset}"`);
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

/** The Nth weekday of a UTC month, at 00:00 — day-of-month only, ordinal signed as RFC 5545 defines it. */
function nthWeekdayOfMonth(year: number, month1: number, weekday: number, ordinal: number): number {
  if (ordinal > 0) {
    const first = Date.UTC(year, month1 - 1, 1);
    const firstWeekday = new Date(first).getUTCDay();
    const offset = (weekday - firstWeekday + 7) % 7;
    return 1 + offset + (ordinal - 1) * 7;
  }

  const lastDay = new Date(Date.UTC(year, month1, 0)).getUTCDate();
  const last = Date.UTC(year, month1 - 1, lastDay);
  const lastWeekday = new Date(last).getUTCDay();
  const offset = (lastWeekday - weekday + 7) % 7;
  return lastDay - offset - (-ordinal - 1) * 7;
}

type Timezone = { standard: TzTransition; daylight: TzTransition | null };

function parseTimezones(lines: string[]): Map<string, Timezone> {
  const zones = new Map<string, Timezone>();

  for (const block of blockLines(lines, "VTIMEZONE")) {
    const tzid = block.map(parseLine).find((p) => p.name === "TZID")?.value;
    if (!tzid) continue;

    const standardBlocks = blockLines(block, "STANDARD");
    const daylightBlocks = blockLines(block, "DAYLIGHT");
    const standardBlock = standardBlocks[0];
    if (!standardBlock) {
      throw new Error(`ical: VTIMEZONE "${tzid}" has no STANDARD component`);
    }

    zones.set(tzid, {
      standard: parseTzTransition(standardBlock),
      daylight: daylightBlocks[0] ? parseTzTransition(daylightBlocks[0]) : null,
    });
  }

  return zones;
}

/**
 * A local wall-clock date/time under a named zone, resolved to a UTC instant
 * via that zone's DAYLIGHT/STANDARD transitions for the specific YEAR the
 * date falls in. No DAYLIGHT component means the zone never observes it —
 * every instant uses STANDARD's offset.
 */
function resolveTz(zone: Timezone, y: number, mo: number, d: number, h: number, mi: number, s: number): string {
  const naiveUtcMs = Date.UTC(y, mo - 1, d, h, mi, s);

  if (!zone.daylight) {
    return new Date(naiveUtcMs - offsetMinutes(zone.standard.offsetTo) * 60_000).toISOString();
  }

  const springDay = nthWeekdayOfMonth(y, zone.daylight.month, zone.daylight.weekday, zone.daylight.ordinal);
  const fallDay = nthWeekdayOfMonth(y, zone.standard.month, zone.standard.weekday, zone.standard.ordinal);
  // Both transitions are compared in the LOCAL wall-clock terms this date is
  // already expressed in, at day granularity — exact enough for a value that
  // is never authored inside the one- or two-hour transition window itself.
  const spring = Date.UTC(y, zone.daylight.month - 1, springDay);
  const fall = Date.UTC(y, zone.standard.month - 1, fallDay);
  const inDaylight = naiveUtcMs >= spring && naiveUtcMs < fall;
  const offset = inDaylight ? zone.daylight.offsetTo : zone.standard.offsetTo;

  return new Date(naiveUtcMs - offsetMinutes(offset) * 60_000).toISOString();
}

/** `20260922T140000Z` or `20260922T140000` — the parts, unconverted. */
function parseDateTimeParts(value: string): { y: number; mo: number; d: number; h: number; mi: number; s: number; utc: boolean } {
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(value);
  if (!match) throw new Error(`ical: unreadable date-time "${value}"`);

  return {
    y: Number(match[1]),
    mo: Number(match[2]),
    d: Number(match[3]),
    h: Number(match[4]),
    mi: Number(match[5]),
    s: Number(match[6]),
    utc: Boolean(match[7]),
  };
}

/** A DTSTART/DTEND property resolved to a UTC instant, per the module doc's three cases. */
function resolveInstant(prop: Property, zones: Map<string, Timezone>): string {
  const parts = parseDateTimeParts(prop.value);

  if (parts.utc) return new Date(Date.UTC(parts.y, parts.mo - 1, parts.d, parts.h, parts.mi, parts.s)).toISOString();

  const tzid = prop.params.TZID;
  if (!tzid) {
    // FLOATING: no TZID and no Z. Treated as UTC — see the module doc.
    return new Date(Date.UTC(parts.y, parts.mo - 1, parts.d, parts.h, parts.mi, parts.s)).toISOString();
  }

  const zone = zones.get(tzid);
  if (!zone) {
    throw new Error(`ical: DTSTART/DTEND names TZID "${tzid}", which this calendar's VTIMEZONE does not define`);
  }

  return resolveTz(zone, parts.y, parts.mo, parts.d, parts.h, parts.mi, parts.s);
}

/* ── ATTENDEE / ORGANIZER ──────────────────────────────────────────────────── */

function emailOf(value: string): string {
  return value.replace(/^mailto:/i, "");
}

function parseAttendee(prop: Property): Attendee {
  return {
    name: prop.params.CN ?? null,
    email: emailOf(prop.value),
    role: prop.params.ROLE ?? null,
    partstat: prop.params.PARTSTAT ?? null,
  };
}

/* ── RRULE ──────────────────────────────────────────────────────────────── */

const FREQS = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

function parseRRule(value: string): RecurrenceRule {
  const parts = Object.fromEntries(
    value.split(";").map((p) => {
      const eq = p.indexOf("=");
      return [p.slice(0, eq).toUpperCase(), p.slice(eq + 1)];
    }),
  );

  const freq = parts.FREQ as (typeof FREQS)[number];
  if (!FREQS.includes(freq)) {
    throw new Error(`ical: RRULE FREQ must be one of ${FREQS.join(", ")}, got "${parts.FREQ}"`);
  }

  return {
    freq,
    interval: parts.INTERVAL ? Number(parts.INTERVAL) : 1,
    count: parts.COUNT ? Number(parts.COUNT) : null,
    until: parts.UNTIL ? resolveInstant({ name: "UNTIL", params: {}, value: parts.UNTIL }, new Map()) : null,
    byDay: parts.BYDAY ? parts.BYDAY.split(",") : null,
  };
}

/* ── parseInvite ────────────────────────────────────────────────────────── */

export function parseInvite(raw: string): Invite {
  const lines = unfold(raw).split("\n").filter((l) => l.length > 0);
  const zones = parseTimezones(lines);

  const eventBlocks = blockLines(lines, "VEVENT");
  const firstEvent = eventBlocks[0];
  if (!firstEvent) throw new Error("ical: no VEVENT in this calendar");
  const props = firstEvent.map(parseLine);
  const methodValue = (lines.find((l) => l.toUpperCase().startsWith("METHOD:")) ?? "").split(":")[1];

  const get = (name: string) => props.find((p) => p.name === name);
  const getAll = (name: string) => props.filter((p) => p.name === name);
  const text = (name: string) => {
    const p = get(name);
    return p ? unescapeText(p.value) : null;
  };

  const method = (methodValue ?? "REQUEST").trim().toUpperCase() as InviteMethod;
  if (method !== "REQUEST" && method !== "CANCEL") {
    throw new Error(`ical: METHOD must be REQUEST or CANCEL, got "${methodValue}"`);
  }

  const uidProp = get("UID");
  if (!uidProp) throw new Error("ical: VEVENT has no UID");

  const dtstartProp = get("DTSTART");
  if (!dtstartProp) throw new Error("ical: VEVENT has no DTSTART");

  const dtendProp = get("DTEND");
  const organizerProp = get("ORGANIZER");
  const rruleProp = get("RRULE");

  return {
    method,
    uid: uidProp.value,
    sequence: get("SEQUENCE") ? Number(get("SEQUENCE")!.value) : 0,
    summary: text("SUMMARY"),
    description: text("DESCRIPTION"),
    location: text("LOCATION"),
    status: get("STATUS")?.value ?? null,
    dtstart: resolveInstant(dtstartProp, zones),
    dtend: dtendProp ? resolveInstant(dtendProp, zones) : null,
    organizer: organizerProp ? { name: organizerProp.params.CN ?? null, email: emailOf(organizerProp.value) } : null,
    attendees: getAll("ATTENDEE").map(parseAttendee),
    rrule: rruleProp ? parseRRule(rruleProp.value) : null,
  };
}

/* ── nextOccurrence ─────────────────────────────────────────────────────── */

const DAY_MS = 86_400_000;

function addCalendarUnit(ms: number, freq: RecurrenceRule["freq"], interval: number): number {
  const d = new Date(ms);
  if (freq === "DAILY") return ms + interval * DAY_MS;
  if (freq === "WEEKLY") return ms + interval * 7 * DAY_MS;

  const months = freq === "YEARLY" ? interval * 12 : interval;
  const day = d.getUTCDate();
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()));
  const daysInNext = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, daysInNext));

  return next.getTime();
}

/** Every occurrence's timestamp, in order, stopping at COUNT or UNTIL. */
function* occurrences(rrule: RecurrenceRule, dtstartMs: number): Generator<number> {
  const untilMs = rrule.until ? Date.parse(rrule.until) : null;
  let n = 0;

  const emit = (ms: number): boolean => {
    if (untilMs !== null && ms > untilMs) return false;
    n++;
    return true;
  };

  if (rrule.freq === "WEEKLY" && rrule.byDay?.length) {
    const wanted = [...new Set(rrule.byDay.map((d) => WEEKDAY_CODES.indexOf(d)))].sort((a, b) => a - b);
    const dtstart = new Date(dtstartMs);
    const timeOfDay = dtstartMs - Date.UTC(dtstart.getUTCFullYear(), dtstart.getUTCMonth(), dtstart.getUTCDate());
    const startOfWeek = dtstartMs - timeOfDay - dtstart.getUTCDay() * DAY_MS;
    let weekIndex = 0;

    while (true) {
      if (weekIndex % rrule.interval === 0) {
        for (const weekday of wanted) {
          const candidate = startOfWeek + weekIndex * 7 * DAY_MS + weekday * DAY_MS + timeOfDay;
          if (candidate < dtstartMs) continue;
          if (!emit(candidate)) return;
          yield candidate;
          if (rrule.count && n >= rrule.count) return;
        }
      }
      weekIndex++;
    }
  }

  let current = dtstartMs;
  while (true) {
    if (!emit(current)) return;
    yield current;
    if (rrule.count && n >= rrule.count) return;
    current = addCalendarUnit(current, rrule.freq, rrule.interval);
  }
}

/**
 * The next occurrence at or after `afterIso`, or `null` when the series (or
 * the single occurrence, for a non-recurring invite) has nothing left to
 * offer at or after that instant.
 */
export function nextOccurrence(invite: Invite, afterIso: string): string | null {
  const afterMs = Date.parse(afterIso);
  const dtstartMs = Date.parse(invite.dtstart);

  if (!invite.rrule) {
    return dtstartMs >= afterMs ? invite.dtstart : null;
  }

  for (const ms of occurrences(invite.rrule, dtstartMs)) {
    if (ms >= afterMs) return new Date(ms).toISOString();
  }

  return null;
}

/* ── joinTargets ────────────────────────────────────────────────────────── */

const ZOOM_LINK = /https:\/\/[\w.-]*zoom\.us\/j\/(\d+)(\?[^\s)]*)?/g;
const MEET_LINK = /https:\/\/meet\.google\.com\/[a-z0-9-]+/gi;
const TEAMS_LINK = /https:\/\/teams\.(?:microsoft|live)\.com\/l\/meetup-join\/[^\s)]+/gi;
const DIAL_LINE = /^Dial(?:-in)?[:\s]+([+0-9][0-9\s().-]{6,}\d)/im;
const PASSCODE_LINE = /Passcode[:\s]+([A-Za-z0-9]+)/i;

/**
 * The allow-listed places a bot can actually join, in the order they appear
 * in the text. Anything else — Webex, a generic link, an unrecognised
 * dial-in shape — is not returned: a shape this package does not know is a
 * shape a bot should not guess at.
 */
export function joinTargets(invite: Invite): JoinTarget[] {
  const text = invite.description ?? "";
  const targets: { index: number; target: JoinTarget }[] = [];

  for (const match of text.matchAll(ZOOM_LINK)) {
    const query = match[2] ?? "";
    const passcode = /[?&]pwd=([^&\s]+)/.exec(query)?.[1] ?? null;
    targets.push({
      index: match.index ?? 0,
      target: { kind: "zoom", url: match[0], meetingId: match[1] ?? null, passcode, phone: null },
    });
  }

  for (const match of text.matchAll(MEET_LINK)) {
    targets.push({ index: match.index ?? 0, target: { kind: "google-meet", url: match[0], meetingId: null, passcode: null, phone: null } });
  }

  for (const match of text.matchAll(TEAMS_LINK)) {
    targets.push({ index: match.index ?? 0, target: { kind: "teams", url: match[0], meetingId: null, passcode: null, phone: null } });
  }

  const dial = DIAL_LINE.exec(text);
  const dialedPhone = dial?.[1];
  if (dial && dialedPhone !== undefined) {
    const passcode = PASSCODE_LINE.exec(text)?.[1] ?? null;
    targets.push({
      index: dial.index,
      target: { kind: "dial-in", url: null, meetingId: null, passcode, phone: dialedPhone.trim() },
    });
  }

  return targets.sort((a, b) => a.index - b.index).map((t) => t.target);
}
