import crypto from "node:crypto";
import { normalizePhone } from "./share";

export interface SendSolapiResult {
  sent: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSolapiSms(params: {
  apiKey: string;
  apiSecret: string;
  from: string;
  to: string;
  text: string;
  subject?: string;
}): Promise<SendSolapiResult> {
  const from = normalizePhone(params.from).replace(/^\+/, "");
  const to = normalizePhone(params.to).replace(/^\+/, "");

  if (!from || !to) {
    return {
      sent: false,
      error: "발신번호와 수신번호를 숫자로 정확히 입력해 주세요.",
    };
  }

  const date = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const signature = crypto
    .createHmac("sha256", params.apiSecret)
    .update(date + salt)
    .digest("hex");

  // Estimate EUC-KR byte length roughly (Korean/non-ASCII = 2 bytes, ASCII = 1 byte)
  let byteLen = 0;
  for (const ch of params.text) {
    byteLen += ch.charCodeAt(0) > 127 ? 2 : 1;
  }
  const type = byteLen > 90 ? "LMS" : "SMS";

  const payload = {
    message: {
      to,
      from,
      text: params.text,
      type,
      ...(type === "LMS" && params.subject ? { subject: params.subject.slice(0, 40) } : {}),
    },
  };

  try {
    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        Authorization: `HMAC-SHA256 apiKey=${params.apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = (await res.json()) as {
      messageId?: string;
      errorMessage?: string;
      errorCode?: string;
    };

    if (!res.ok) {
      return {
        sent: false,
        error:
          json.errorMessage ||
          `Solapi 문자 발송 실패 (${res.status}${json.errorCode ? `: ${json.errorCode}` : ""})`,
      };
    }

    return {
      sent: true,
      messageId: json.messageId,
    };
  } catch (err) {
    return {
      sent: false,
      error:
        err instanceof Error
          ? err.message
          : "문자 서버 연결 중 오류가 발생했습니다.",
    };
  }
}
