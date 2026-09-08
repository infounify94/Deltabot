import { ProtectedSession } from '@/components/ui/protected-session';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedSession>{children}</ProtectedSession>;
}
