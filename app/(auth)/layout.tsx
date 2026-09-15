// app/(auth)/layout.tsx — full-height, padded container for the auth screens (no tab bar).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--sp-5)',
        gap: 'var(--sp-5)',
      }}
    >
      {children}
    </div>
  );
}
