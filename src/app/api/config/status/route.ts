import { NextResponse } from "next/server";
import { getEmailConfigStatus } from "@/lib/email";
import { getEffectiveSettings, summarizeSettings } from "@/lib/settings";
import { getPrimaryLanIp, resolveShareBaseUrl } from "@/lib/network";
import { isPublicViewerOnly } from "@/lib/mode";

export async function GET(req: Request) {
  if (isPublicViewerOnly()) {
    return NextResponse.json({ publicViewerOnly: true });
  }
  const settings = await getEffectiveSettings();
  const summary = summarizeSettings(settings);
  const email = await getEmailConfigStatus();
  const resolved = resolveShareBaseUrl(req, settings.baseUrl);
  const lanIp = getPrimaryLanIp();
  const reqUrl = new URL(req.url);
  const portPart = reqUrl.port ? `:${reqUrl.port}` : "";

  return NextResponse.json({
    email,
    kakaoConfigured: summary.kakaoConfigured,
    kakaoJsKey: settings.kakaoJsKey,
    smsApiConfigured: summary.smsApiConfigured,
    baseUrl: summary.baseUrl,
    effectiveBaseUrl: resolved.baseUrl,
    baseMode: resolved.mode,
    lanUrl: lanIp ? `${reqUrl.protocol}//${lanIp}${portPart}` : null,
  });
}
