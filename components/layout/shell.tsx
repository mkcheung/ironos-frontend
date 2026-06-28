import { Nav } from "./nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-graphite">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>
    </div>
  );
}
