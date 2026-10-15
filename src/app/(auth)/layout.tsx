export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
      <p className="text-2xl font-semibold tracking-tight text-primary">
        MoneyWise
      </p>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
