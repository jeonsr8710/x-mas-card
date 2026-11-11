import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { sendCardEmail } from "@/lib/email";
import { getEffectiveSettings, summarizeSettings } from "@/lib/settings";
import { resolveShareBaseUrl } from "@/lib/network";
import { sendSolapiSms } from "@/lib/solapi";
import { isPublicViewerOnly } from "@/lib/mode";
import { maskTargetAddress } from "@/lib/privacy";
import {
  buildCardUrl,
  buildKakaoSharePayload,
  buildSmsUri,
  isValidEmail,
  normalizePhone,
} from "@/lib/share";

async function toQrDataUrl(text: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(text, {
      width: 220,
      margin: 2,
      color: { dark: "#1c1917", light: "#ffffff" },
    });
  } catch {
    return null;
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ manageToken: string }> }
) {
  if (isPublicViewerOnly()) {
    return NextResponse.json(
      { error: "공개 뷰어 모드에서는 발송을 실행할 수 없습니다." },
      { status: 403 }
    );
  }
  try {
    const { manageToken } = await context.params;
    const card = await prisma.card.findUnique({ where: { manageToken } });
    if (!card) {
      return NextResponse.json(
        { error: "관리 권한이 없거나 카드를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const channel = String(body.channel ?? "").toUpperCase();
    const settings = await getEffectiveSettings();
    const summary = summarizeSettings(settings);
    const { baseUrl, mode: baseMode } = resolveShareBaseUrl(
      req,
      settings.baseUrl
    );

    if (channel === "EMAIL") {
      const rawRecipients = Array.isArray(body.recipients)
        ? body.recipients
        : [
            {
              recipientName: body.recipientName,
              email: body.email,
            },
          ];

      if (rawRecipients.length === 0 || rawRecipients.length > 30) {
        return NextResponse.json(
          { error: "한 번에 1~30명의 수신자만 발송할 수 있습니다." },
          { status: 400 }
        );
      }

      const results = [];
      for (const item of rawRecipients as Array<{
        recipientName?: unknown;
        email?: unknown;
      }>) {
        const recipientName =
          String(item.recipientName ?? "").trim() || "소중한 분";
        const email = String(item.email ?? "").trim();

        if (!isValidEmail(email)) {
          results.push({
            recipientName,
            email,
            sent: false,
            error: "올바른 이메일 형식이 아닙니다.",
          });
          continue;
        }

        const token = nanoid(10);
        const cardUrl = buildCardUrl(baseUrl, card.slug, token);

        const delivery = await prisma.delivery.create({
          data: {
            token,
            cardId: card.id,
            recipientName,
            channel: "EMAIL",
            targetAddress: maskTargetAddress("EMAIL", email),
            status: "READY",
          },
        });

        const sendRes = await sendCardEmail({
          to: email,
          recipientName,
          senderName: card.senderName,
          title: card.title,
          message: card.message,
          cardUrl,
          templateId: card.templateId,
          customImageData: card.customImageData,
        });

        const status = sendRes.sent
          ? "SENT"
          : sendRes.provider === "preview"
            ? "PREVIEW"
            : "FAILED";

        const updatedDelivery = await prisma.delivery.update({
          where: { id: delivery.id },
          data: {
            status,
            sentAt: sendRes.sent ? new Date() : null,
            errorMessage: sendRes.error ?? null,
          },
        });

        results.push({
          delivery: updatedDelivery,
          cardUrl,
          sent: sendRes.sent,
          provider: sendRes.provider,
          error: sendRes.error,
          previewHtml: sendRes.previewHtml,
        });
      }

      return NextResponse.json({ results }, { status: 201 });
    }

    if (channel === "SMS") {
      const recipientName =
        String(body.recipientName ?? "").trim() || "소중한 분";
      const phone = normalizePhone(String(body.phone ?? ""));
      const sendDirect = Boolean(body.sendDirect);
      const token = nanoid(10);
      const cardUrl = buildCardUrl(baseUrl, card.slug, token);

      const smsText = `${recipientName}님, ${card.senderName}님이 크리스마스 카드를 보냈어요!\n"${card.title}"\n카드 열기: ${cardUrl}`;
      const smsUri = buildSmsUri({
        phone,
        recipientName,
        senderName: card.senderName,
        title: card.title,
        cardUrl,
      });

      if (sendDirect) {
        if (!summary.smsApiConfigured) {
          return NextResponse.json(
            {
              error:
                "직접 SMS API(Solapi) 설정이 아직 등록되지 않았습니다. 상단 [설정] 버튼에서 Solapi API 키와 발신번호를 등록하세요.",
            },
            { status: 400 }
          );
        }
        if (!phone) {
          return NextResponse.json(
            { error: "문자를 받을 휴대폰 번호를 입력해 주세요." },
            { status: 400 }
          );
        }

        const delivery = await prisma.delivery.create({
          data: {
            token,
            cardId: card.id,
            recipientName,
            channel: "SMS",
            targetAddress: maskTargetAddress("SMS", phone),
            status: "READY",
          },
        });

        const apiRes = await sendSolapiSms({
          apiKey: settings.solapiApiKey,
          apiSecret: settings.solapiApiSecret,
          from: settings.solapiSenderPhone,
          to: phone,
          text: smsText,
          subject: `[크리스마스 카드] ${card.title}`,
        });

        const updatedDelivery = await prisma.delivery.update({
          where: { id: delivery.id },
          data: {
            status: apiRes.sent ? "SENT" : "FAILED",
            sentAt: apiRes.sent ? new Date() : null,
            errorMessage: apiRes.error ?? null,
          },
        });

        return NextResponse.json(
          {
            delivery: updatedDelivery,
            cardUrl,
            smsUri,
            smsText,
            sentViaApi: true,
            sent: apiRes.sent,
            error: apiRes.error,
          },
          { status: 201 }
        );
      }

      const delivery = await prisma.delivery.create({
        data: {
          token,
          cardId: card.id,
          recipientName,
          channel: "SMS",
          targetAddress: maskTargetAddress("SMS", phone),
          status: "READY",
        },
      });

      const smsLaunchUrl = `${baseUrl}/sms-launch?d=${encodeURIComponent(token)}`;
      const qrDataUrl = await toQrDataUrl(smsLaunchUrl);

      return NextResponse.json(
        {
          delivery,
          cardUrl,
          smsUri,
          smsText,
          smsLaunchUrl,
          baseMode,
          qrDataUrl,
          sentViaApi: false,
        },
        { status: 201 }
      );
    }

    if (channel === "KAKAO") {
      const recipientName =
        String(body.recipientName ?? "").trim() || "소중한 분";
      const token = nanoid(10);
      const cardUrl = buildCardUrl(baseUrl, card.slug, token);
      const imageUrl = `${baseUrl}/c/${encodeURIComponent(card.slug)}/opengraph-image`;

      const delivery = await prisma.delivery.create({
        data: {
          token,
          cardId: card.id,
          recipientName,
          channel: "KAKAO",
          status: "READY",
        },
      });

      const kakaoPayload = buildKakaoSharePayload({
        title: card.title,
        senderName: card.senderName,
        recipientName,
        message: card.message,
        cardUrl,
        imageUrl,
      });

      const qrDataUrl = await toQrDataUrl(cardUrl);

      return NextResponse.json(
        { delivery, cardUrl, kakaoPayload, qrDataUrl, baseMode },
        { status: 201 }
      );
    }

    if (channel === "LINK") {
      const recipientName =
        String(body.recipientName ?? "").trim() || "소중한 분";
      const token = nanoid(10);
      const cardUrl = buildCardUrl(baseUrl, card.slug, token);

      const delivery = await prisma.delivery.create({
        data: {
          token,
          cardId: card.id,
          recipientName,
          channel: "LINK",
          status: "SENT",
          sentAt: new Date(),
        },
      });

      const qrDataUrl = await toQrDataUrl(cardUrl);

      return NextResponse.json(
        { delivery, cardUrl, qrDataUrl, baseMode },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: "지원하지 않는 발송 채널입니다." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Failed to dispatch delivery:", err);
    return NextResponse.json(
      { error: "발송 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ manageToken: string }> }
) {
  if (isPublicViewerOnly()) {
    return NextResponse.json(
      { error: "공개 뷰어 모드에서는 접근할 수 없습니다." },
      { status: 403 }
    );
  }
  try {
    const { manageToken } = await context.params;
    const card = await prisma.card.findUnique({
      where: { manageToken },
      select: { id: true },
    });
    if (!card) {
      return NextResponse.json(
        { error: "관리 권한이 없습니다." },
        { status: 404 }
      );
    }

    const body = (await req.json()) as {
      deliveryId?: string;
      status?: string;
    };

    if (!body.deliveryId) {
      return NextResponse.json(
        { error: "deliveryId가 필요합니다." },
        { status: 400 }
      );
    }

    const status = body.status === "SENT" ? "SENT" : "READY";
    const delivery = await prisma.delivery.updateMany({
      where: { id: body.deliveryId, cardId: card.id },
      data: {
        status,
        sentAt: status === "SENT" ? new Date() : null,
      },
    });

    if (delivery.count === 0) {
      return NextResponse.json(
        { error: "발송 내역을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, status });
  } catch {
    return NextResponse.json(
      { error: "상태 업데이트에 실패했습니다." },
      { status: 500 }
    );
  }
}
