export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-bg-primary px-6">
      <div className="w-full max-w-[430px]">{children}</div>
    </div>
  );
}
