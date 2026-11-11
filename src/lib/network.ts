import os from "node:os";

export function isLocalhostUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

/**
 * Returns the primary LAN IPv4 address of this machine (e.g. 192.168.0.33),
 * filtering out loopback and virtual container bridges (docker/br-/veth) when possible.
 */
export function getPrimaryLanIp(): string | null {
  const nets = os.networkInterfaces();
  const candidates: Array<{ ip: string; score: number }> = [];

  for (const [iface, addrs] of Object.entries(nets)) {
    if (!addrs) continue;
    const lowerIface = iface.toLowerCase();
    const isVirtual =
      lowerIface.startsWith("docker") ||
      lowerIface.startsWith("br-") ||
      lowerIface.startsWith("veth") ||
      lowerIface.startsWith("virbr") ||
      lowerIface.startsWith("tun");

    for (const addr of addrs) {
      if (addr.family !== "IPv4" || addr.internal) continue;

      let score = isVirtual ? 0 : 10;
      if (addr.address.startsWith("192.168.")) score += 30;
      else if (addr.address.startsWith("10.")) score += 20;
      else if (/^172\.(1[6-9]|2\d|3[01])\./.test(addr.address)) score += 10;

      candidates.push({ ip: addr.address, score });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.ip ?? null;
}

/**
 * Resolves the best URL base for share links and QR codes.
 * Prefers an explicit non-localhost baseUrl, otherwise uses the request's host
 * or automatically upgrades localhost -> PC's LAN IP so mobile phones on the same Wi-Fi can connect.
 */
export function resolveShareBaseUrl(
  req: Request,
  configuredBaseUrl?: string
): { baseUrl: string; mode: "public" | "lan" | "localhost" } {
  const configured = configuredBaseUrl?.trim().replace(/\/+$/, "");
  if (configured && !isLocalhostUrl(configured)) {
    return { baseUrl: configured, mode: "public" };
  }

  const reqUrl = new URL(req.url);
  if (!isLocalhostUrl(reqUrl.origin)) {
    return { baseUrl: reqUrl.origin, mode: "public" };
  }

  const lanIp = getPrimaryLanIp();
  if (lanIp) {
    const portPart = reqUrl.port ? `:${reqUrl.port}` : "";
    return {
      baseUrl: `${reqUrl.protocol}//${lanIp}${portPart}`,
      mode: "lan",
    };
  }

  return {
    baseUrl: configured || reqUrl.origin,
    mode: "localhost",
  };
}
