import { Calendar, ShieldCheck, ShieldAlert, Clock } from 'lucide-react';
import { GlassCard } from './glass-card';

export interface MacroInfo {
  is_blocked: boolean;
  active_event: { id: string; title: string } | null;
  blackout_reason: string;
  blackout_end_ist: string;
  status: string;
  upcoming_events: { id: string; title: string; country: string; impact: string; timestamp_utc: number }[];
  updated_at?: string;
}

const ist = (seconds: number) => new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
}).format(new Date(seconds * 1000));

export function MacroCalendarPanel({ info }: { info: MacroInfo | null }) {
  const unknown = !info || info.status === 'UNKNOWN';
  const blocked = !unknown && info.is_blocked;
  const label = unknown ? 'Calendar unavailable' : blocked ? 'News gate active' : 'No news blackout';
  return (
    <GlassCard className="p-4 sm:p-5" >
      <section aria-labelledby="macro-calendar-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="macro-calendar-title" className="flex items-center gap-2 text-lg font-semibold"><Calendar className="h-5 w-5 text-[var(--indigo)]" aria-hidden="true" />Economic calendar</h2>
            <p className="mt-1 text-xs text-[var(--grey)]">High-impact USD events and priority releases · All times IST</p>
          </div>
          <span role="status" className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${unknown || blocked ? 'bg-amber-500/10 text-[var(--orange)]' : 'bg-emerald-500/10 text-[var(--pine)]'}`}>
            {unknown || blocked ? <ShieldAlert className="h-4 w-4" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}{label}
          </span>
        </div>
        <p className="mt-3 text-sm text-[var(--grey)]">{unknown
          ? 'Calendar status cannot be confirmed. A clear news gate is not assumed.'
          : blocked ? info.blackout_reason
          : 'No calendar blackout is active. Other entry and risk checks still apply.'}</p>
        <p className="mt-2 text-xs text-[var(--grey)]">New entries pause 2 hours before and 1 hour after an event. Existing positions continue to be managed.</p>
        {!unknown && <ul className="mt-4 divide-y divide-[var(--hair)]">
          {info.upcoming_events.map(event => (
            <li key={event.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0"><p className="text-sm font-medium break-words">{event.title}{info.active_event?.id === event.id && <span className="ml-2 text-xs text-[var(--orange)]">Active window</span>}</p>
                <p className="mt-1 text-xs text-[var(--grey)]">{event.country} · {event.impact.toLowerCase() === 'high' ? 'High impact' : 'Priority event'}</p></div>
              <div className="text-xs sm:text-right"><p className="font-medium">{ist(event.timestamp_utc)} IST</p><p className="mt-1 text-[var(--grey)]">Entry pause: {ist(event.timestamp_utc - 7200)} – {ist(event.timestamp_utc + 3600)} IST</p></div>
            </li>
          ))}
          {info.upcoming_events.length === 0 && <li className="py-3 text-sm text-[var(--grey)]">No remaining qualifying events in this week’s feed.</li>}
        </ul>}
        <div className="mt-3 border-t border-[var(--hair)] pt-3 text-xs text-[var(--grey)]">
          <p className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" aria-hidden="true" />{info?.updated_at && !unknown ? `Calendar checked ${ist(Date.parse(info.updated_at) / 1000)} IST` : 'Waiting for a valid calendar refresh'}</p>
          <p className="mt-1">Calendar status does not confirm bot connectivity. The bot checks its own calendar before new entries.</p>
        </div>
      </section>
    </GlassCard>
  );
}
