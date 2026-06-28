export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-graphite flex items-center justify-center px-4 py-12">
      {children}
    </div>
  );
}
