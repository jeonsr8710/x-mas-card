export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const atIdx = trimmed.indexOf("@");
  if (atIdx <= 0) return "***";
  const local = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(2, local.length - visible.length))}${domain}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 7) return "***";
  const head = digits.slice(0, 3);
  const tail = digits.slice(-4);
  return `${head}-****-${tail}`;
}

export function maskTargetAddress(
  channel: string,
  address: string | null | undefined
): string | null {
  if (!address || !address.trim()) return null;
  const upper = channel.toUpperCase();
  if (upper === "EMAIL") return maskEmail(address);
  if (upper === "SMS") return maskPhone(address);
  return "***";
}
