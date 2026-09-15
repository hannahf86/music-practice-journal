// components/Avatar.tsx — circular initial avatar.
export function Avatar({ name, size = 44 }: { name?: string | null; size?: number }) {
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}
