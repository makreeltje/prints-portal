/** Two initials from a display name or e-mail address ("admin@local" → "AL", "Joey" → "JO"). */
export function initials(name: string): string {
  const parts = name.split(/[\s@._-]+/).filter((part) => part !== '');
  const [first = '', second] = parts;
  const letters =
    second === undefined ? first.slice(0, 2) : `${first.charAt(0)}${second.charAt(0)}`;
  return letters.toUpperCase();
}
