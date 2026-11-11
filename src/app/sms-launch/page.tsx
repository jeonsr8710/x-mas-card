import { Suspense } from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { buildCardUrl, buildSmsUri } from "@/lib/share";
import { getEffectiveSettings } from "@/lib/settings";
import { getPrimaryLanIp, isLocalhostUrl } from "@/lib/network";
import { isPublicViewerOnly } from "@/lib/mode";
import { SmsLaunchClient } from "@/components/SmsLaunchClient";

async function SmsLaunchContent({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d: token } = await searchParams;
  if (!token) {
    notFound();
  }

  const delivery = await prisma.delivery.findUnique({
    where: { token },
    include: { card: true },
  });

  if (!delivery) {
    notFound();
  }

  const publicOnly = isPublicViewerOnly();
  const settings = await getEffectiveSettings();
  const hdrs = await headers();
  const host = hdrs.get("host") || "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const reqOrigin = `${proto}://${host}`;

  let baseUrl = settings.baseUrl?.trim().replace(/\/+$/, "");
  if (!baseUrl || isLocalhostUrl(baseUrl)) {
    if (!isLocalhostUrl(reqOrigin)) {
      baseUrl = reqOrigin;
    } else {
      const lanIp = getPrimaryLanIp();
      const port = host.includes(":") ? `:${host.split(":")[1]}` : "";
      baseUrl = lanIp ? `http://${lanIp}${port}` : reqOrigin;
    }
  }

  const cardUrl = buildCardUrl(baseUrl, delivery.card.slug, delivery.token);
  const rawPhone =
    delivery.targetAddress && !delivery.targetAddress.includes("*")
      ? delivery.targetAddress
      : "";

  const smsUri = buildSmsUri({
    phone: rawPhone,
    recipientName: delivery.recipientName,
    senderName: delivery.card.senderName,
    title: delivery.card.title,
    cardUrl,
  });

  const smsText = `${delivery.recipientName}님, ${delivery.card.senderName}님이 크리스마스 카드를 보냈어요!\n"${delivery.card.title}"\n카드 열기: ${cardUrl}`;

  return (
    <SmsLaunchClient
      deliveryId={delivery.id}
      manageToken={publicOnly ? null : delivery.card.manageToken}
      recipientName={delivery.recipientName}
      phone={rawPhone || null}
      smsUri={smsUri}
      smsText={smsText}
      cardUrl={cardUrl}
    />
  );
}

export default function SmsLaunchPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#faf7f2] text-sm text-stone-600">
          문자 발송 정보를 불러오는 중...
        </div>
      }
    >
      <SmsLaunchContent searchParams={searchParams} />
    </Suspense>
  );
}
