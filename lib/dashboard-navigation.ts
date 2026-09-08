export type DashboardSection = 'dashboard' | 'trading' | 'history' | 'analytics' | 'risk' | 'settings' | 'billing';
const sections: DashboardSection[] = ['dashboard', 'trading', 'history', 'analytics', 'risk', 'settings', 'billing'];

export function sectionFromSearch(search: string): DashboardSection {
  const value = new URLSearchParams(search).get('view');
  return sections.includes(value as DashboardSection) ? value as DashboardSection : 'dashboard';
}

export function sectionHref(section: DashboardSection): string {
  return section === 'dashboard' ? '/dashboard' : `/dashboard?view=${section}`;
}
