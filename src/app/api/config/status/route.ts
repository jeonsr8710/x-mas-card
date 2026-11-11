import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmailConfigStatus } from "@/lib/email";
import { getEffectiveSettings, summarizeSettings } from "@/lib/settings";
import { getPrimaryLanIp, resolveShareBaseUrl } from "@/lib/network";
import { isPublicViewerOnly } from "@/lib/mode";

export async function GET(req: Request) {
  if (isPublicViewerOnly()) {
    let dbConnected = false;
    let dbError: string | undefined;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch (err) {
      dbError = err instanceof Error ? err.name : "DB_ERROR";
    }
    return NextResponse.json({
      publicViewerOnly: true,
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL?.trim()),
      dbConnected,
      ...(dbError ? { dbError } : {}),
    });
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
