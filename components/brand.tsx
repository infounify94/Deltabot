export function Brand({ small = false }: { small?: boolean }) {
  return <span className={`inline-flex items-center gap-2.5 font-semibold tracking-tight ${small ? 'text-base' : 'text-xl'}`}>
    <svg width={small ? 25 : 30} height={small ? 25 : 30} viewBox="0 0 32 32" fill="none" aria-hidden="true" className="text-[var(--indigo)] shrink-0">
      <path d="M5 27 12 5h15l-4 12H13l-3 10H5Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="m14 13 9-5m-9 5 1-5m-1 5 5 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span>ProfitPilot</span>
  </span>;
}
