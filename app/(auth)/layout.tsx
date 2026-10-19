// app/(auth)/layout.tsx — centred auth column (no nav), comfortable at any width.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <div className="auth-col">{children}</div>
    </div>
  );
}
