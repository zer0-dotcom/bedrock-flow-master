export default function PublicCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Standalone layout without the main sidebar - full width
  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  );
}
