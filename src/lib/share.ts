export function buildCardUrl(
  baseUrl: string,
  slug: string,
  deliveryToken?: string
): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const path = `/c/${encodeURIComponent(slug)}`;
  if (deliveryToken) {
    return `${cleanBase}${path}?d=${encodeURIComponent(deliveryToken)}`;
  }
  return `${cleanBase}${path}`;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, "");
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Builds an RFC-compatible `sms:` URI that opens the device's default SMS app
 * with the recipient number and pre-filled Christmas card message + URL.
 */
export function buildSmsUri(params: {
  phone?: string;
  recipientName?: string;
  senderName: string;
  title: string;
  cardUrl: string;
}): string {
  const cleanPhone = params.phone ? normalizePhone(params.phone) : "";
  const greeting = params.recipientName?.trim()
    ? `${params.recipientName.trim()}님, `
    : "";
  const body = `${greeting}${params.senderName}님이 크리스마스 카드를 보냈어요!\n"${params.title}"\n카드 열기: ${params.cardUrl}`;
  const encodedBody = encodeURIComponent(body);
  return cleanPhone ? `sms:${cleanPhone}?body=${encodedBody}` : `sms:?body=${encodedBody}`;
}

export interface KakaoSharePayload {
  objectType: "feed";
  content: {
    title: string;
    description: string;
    imageUrl: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  };
  buttons: Array<{
    title: string;
    link: {
      mobileWebUrl: string;
      webUrl: string;
    };
  }>;
}

export function buildKakaoSharePayload(params: {
  title: string;
  senderName: string;
  recipientName?: string;
  message: string;
  cardUrl: string;
  imageUrl: string;
}): KakaoSharePayload {
  const toPrefix = params.recipientName?.trim()
    ? `To. ${params.recipientName.trim()} | `
    : "";
  const snippet = params.message.replace(/\s+/g, " ").trim().slice(0, 72);
  const description = `${toPrefix}From. ${params.senderName} — ${snippet}${
    params.message.length > 72 ? "..." : ""
  }`;

  return {
    objectType: "feed",
    content: {
      title: `🎄 ${params.title}`,
      description,
      imageUrl: params.imageUrl,
      link: {
        mobileWebUrl: params.cardUrl,
        webUrl: params.cardUrl,
      },
    },
    buttons: [
      {
        title: "크리스마스 카드 열어보기",
        link: {
          mobileWebUrl: params.cardUrl,
          webUrl: params.cardUrl,
        },
      },
    ],
  };
}
