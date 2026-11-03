import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { EventTicketingHub } from '@/components/dashboard/EventTicketingHub';

export const Route = createFileRoute('/events')({
  head: () => ({ meta: [{ title: 'Tiket Event & Event Pass — Oziktag' }] }),
  component: EventsPage,
});

function EventsPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-slate-50/70 py-6 px-4 sm:px-6 lg:px-8 rounded-3xl">
        <div className="mx-auto max-w-7xl">
          <EventTicketingHub />
        </div>
      </div>
    </AppShell>
  );
}
