// components/Logo.tsx — music-note mark in a rounded purple square.
export function Logo({ size = 64 }: { size?: number }) {
  return (
    <span className="logo" style={{ width: size, height: size, fontSize: size * 0.5 }}>
      ♪
    </span>
  );
}
