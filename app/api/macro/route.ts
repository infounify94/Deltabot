import { NextResponse } from 'next/server';

export const revalidate = 60; // Cache for 60 seconds

const FEED_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.xml";

const PRIORITY_KEYWORDS = [
  "non-farm",
  "nfp",
  "cpi",
  "fomc",
  "federal funds rate",
  "fed interest rate",
  "pce",
  "gdp",
  "unemployment rate",
  "powell",
  "waller",
  "fed chair",
  "ism manufacturing",
  "ism services",
];

export interface MacroEvent {
  id: string;
  title: string;
  country: string;
  impact: string;
  time_utc: string;
  time_ist: string;
  timestamp_utc: number;
}

function cleanCdata(val: string): string {
  val = val.trim();
  if (val.startsWith("<![CDATA[") && val.endsWith("]]>")) {
    return val.slice(9, -3).trim();
  }
  return val;
}

function parseTimeStr(timeStr: string): { hour: number; minute: number } | null {
  const t = cleanCdata(timeStr).toLowerCase();
  if (!t.endsWith("am") && !t.endsWith("pm")) return null;
  try {
    const isPm = t.endsWith("pm");
    const raw = t.slice(0, -2).trim();
    const parts = raw.split(":");
    let h = parseInt(parts[0], 10);
    const m = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    if (isPm && h < 12) h += 12;
    else if (!isPm && h === 12) h = 0;
    return { hour: h, minute: m };
  } catch {
    return null;
  }
}

function parseXmlEvents(xmlText: string): MacroEvent[] {
  const events: MacroEvent[] = [];
  const eventRegex = /<event>([\s\S]*?)<\/event>/g;
  let match;

  while ((match = eventRegex.exec(xmlText)) !== null) {
    const block = match[1];
    const getTag = (tag: string) => {
      const m = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`).exec(block);
      if (!m) return "";
      return cleanCdata(m[1]);
    };

    const country = getTag("country");
    const impact = getTag("impact");
    const title = getTag("title");
    const dateStr = getTag("date");
    const timeStr = getTag("time");

    if (country !== "USD") continue;

    const isHighImpact = impact.toLowerCase() === "high";
    const isPriority = PRIORITY_KEYWORDS.some((kw) =>
      title.toLowerCase().includes(kw)
    );

    if (!isHighImpact && !isPriority) continue;

    const parsedTime = parseTimeStr(timeStr);
    if (!parsedTime) continue;

    try {
      // Date format is MM-DD-YYYY
      const parts = dateStr.split("-");
      if (parts.length !== 3) continue;
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      // Create UTC Date
      const eventDateUtc = new Date(Date.UTC(year, month, day, parsedTime.hour, parsedTime.minute, 0));
      const tsUtc = Math.floor(eventDateUtc.getTime() / 1000);

      // IST is UTC + 5h30m
      const istDate = new Date(eventDateUtc.getTime() + 5.5 * 3600 * 1000);
      const istHours = String(istDate.getUTCHours()).padStart(2, "0");
      const istMins = String(istDate.getUTCMinutes()).padStart(2, "0");
      const istDay = String(istDate.getUTCDate()).padStart(2, "0");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const istFormatted = `${istDay} ${monthNames[istDate.getUTCMonth()]}, ${istHours}:${istMins} IST`;

      const evId = `USD_${title}_${year}${String(month + 1).padStart(2, "0")}${String(day).padStart(2, "0")}_${String(parsedTime.hour).padStart(2, "0")}${String(parsedTime.minute).padStart(2, "0")}`;

      events.push({
        id: evId,
        title,
        country,
        impact,
        time_utc: eventDateUtc.toISOString(),
        time_ist: istFormatted,
        timestamp_utc: tsUtc,
      });
    } catch {
      continue;
    }
  }

  // Deduplicate and sort
  const uniqueMap = new Map<string, MacroEvent>();
  for (const ev of events) {
    uniqueMap.set(ev.id, ev);
  }
  return Array.from(uniqueMap.values()).sort((a, b) => a.timestamp_utc - b.timestamp_utc);
}

export async function GET() {
  try {
    let events: MacroEvent[] = [];
    try {
      const resp = await fetch(FEED_URL, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/xml,application/xml,*/*"
        },
        next: { revalidate: 180 }, // 3 mins cache
      });
      if (resp.ok) {
        const xml = await resp.text();
        events = parseXmlEvents(xml);
      }
    } catch (err) {
      console.warn("Could not fetch remote XML feed:", err);
    }

    const nowTs = Math.floor(Date.now() / 1000);
    const blackoutBeforeSec = 120 * 60; // 2 hours before
    const blackoutAfterSec = 60 * 60;   // 1 hour after

    let isBlocked = false;
    let activeEvent: MacroEvent | null = null;
    let blackoutReason = "All macroeconomic safety shields green. Market clear for options execution.";
    let blackoutEndIst = "";

    for (const ev of events) {
      const windowStart = ev.timestamp_utc - blackoutBeforeSec;
      const windowEnd = ev.timestamp_utc + blackoutAfterSec;

      if (nowTs >= windowStart && nowTs <= windowEnd) {
        isBlocked = true;
        activeEvent = ev;

        const endDateIst = new Date((windowEnd + 5.5 * 3600) * 1000);
        const endHours = String(endDateIst.getUTCHours()).padStart(2, "0");
        const endMins = String(endDateIst.getUTCMinutes()).padStart(2, "0");
        blackoutEndIst = `${endHours}:${endMins} IST`;

        blackoutReason = `Macro Shield Active: ${ev.title} (${ev.time_ist}). New entries paused until ${blackoutEndIst} for capital protection against event volatility.`;
        break;
      }
    }

    // Filter upcoming events (future events)
    const upcomingEvents = events
      .filter((ev) => ev.timestamp_utc + blackoutAfterSec > nowTs)
      .slice(0, 6);

    return NextResponse.json({
      success: true,
      is_blocked: isBlocked,
      active_event: activeEvent,
      blackout_reason: blackoutReason,
      blackout_end_ist: blackoutEndIst,
      status: isBlocked ? "STANDBY" : "SCANNING",
      upcoming_events: upcomingEvents,
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      is_blocked: false,
      status: "SCANNING",
      blackout_reason: "Market clear. Monitoring conditions.",
      upcoming_events: [],
    });
  }
}
