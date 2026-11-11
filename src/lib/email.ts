import fs from "node:fs";
import path from "node:path";
import nodemailer from "nodemailer";
import { getTemplate } from "./templates";
import {
  getEffectiveSettings,
  summarizeSettings,
  type EffectiveSettings,
} from "./settings";

export interface EmailConfigStatus {
  configured: boolean;
  provider: "resend" | "smtp" | "preview";
  fromLabel: string | null;
}

export function formatSmtpFrom(smtpFrom: string, smtpUser: string): string {
  const from = smtpFrom.trim();
  const user = smtpUser.trim();
  if (!from) return user;
  if (from.includes("@")) return from;
  if (user.includes("@")) {
    const safeName = from.replace(/"/g, "");
    return `"${safeName}" <${user}>`;
  }
  return from;
}

export async function getEmailConfigStatus(
  settingsOverride?: EffectiveSettings
): Promise<EmailConfigStatus> {
  const s = settingsOverride ?? (await getEffectiveSettings());
  const summary = summarizeSettings(s);

  if (summary.activeEmailMethod === "resend") {
    return { configured: true, provider: "resend", fromLabel: s.resendFrom };
  }
  if (summary.activeEmailMethod === "smtp") {
    return {
      configured: true,
      provider: "smtp",
      fromLabel: formatSmtpFrom(s.smtpFrom, s.smtpUser),
    };
  }
  return { configured: false, provider: "preview", fromLabel: null };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveInlineImageAttachment(customImageData?: string | null): {
  filename: string;
  content: Buffer;
  contentType: string;
  cid: string;
} | null {
  if (!customImageData) return null;

  if (customImageData.startsWith("/samples/")) {
    const safeName = path.basename(customImageData);
    const fullPath = path.join(process.cwd(), "public", "samples", safeName);
    if (fs.existsSync(fullPath)) {
      return {
        filename: safeName,
        content: fs.readFileSync(fullPath),
        contentType: safeName.endsWith(".png") ? "image/png" : "image/jpeg",
        cid: "card-image",
      };
    }
  }

  const match = customImageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (match) {
    const contentType = match[1];
    const ext = contentType.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "png";
    return {
      filename: `card-image.${ext}`,
      content: Buffer.from(match[2], "base64"),
      contentType,
      cid: "card-image",
    };
  }

  return null;
}

export function renderChristmasEmailHtml(params: {
  title: string;
  message: string;
  senderName: string;
  recipientName: string;
  cardUrl: string;
  templateId: string;
  imageSrc?: string | null;
}): string {
  const tpl = getTemplate(params.templateId);
  const safeTitle = escapeHtml(params.title);
  const safeSender = escapeHtml(params.senderName);
  const safeRecipient = escapeHtml(params.recipientName || "소중한 분");
  const safeMessage = escapeHtml(params.message).replace(/\n/g, "<br />");
  const safeUrl = escapeHtml(params.cardUrl);

  const isLight =
    tpl.id === "cozy-cabin" || tpl.id === "minimal-gold";
  const cardTextColor = isLight ? "#1c1917" : "#fefce8";
  const cardMutedColor = isLight ? "#57534e" : "#cbd5e1";

  const imageBlock = params.imageSrc
    ? `<tr>
            <td style="padding:8px 32px 12px 32px;text-align:center;">
              <img src="${escapeHtml(params.imageSrc)}" alt="크리스마스 카드 이미지" style="max-width:100%;max-height:260px;border-radius:14px;border:1px solid ${tpl.ogAccent};display:block;margin:0 auto;" />
            </td>
          </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f1ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f1ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:${tpl.ogBg};border-radius:20px;overflow:hidden;border:2px solid ${tpl.ogAccent};box-shadow:0 12px 32px rgba(0,0,0,0.12);">
          <tr>
            <td style="padding:36px 32px 20px 32px;text-align:center;">
              <div style="display:inline-block;padding:6px 14px;border-radius:999px;background-color:${tpl.ogAccent};color:#1c1917;font-size:12px;font-weight:700;letter-spacing:0.08em;">
                MERRY CHRISTMAS
              </div>
              <h1 style="margin:18px 0 8px 0;font-size:24px;line-height:1.35;color:${cardTextColor};">
                ${safeTitle}
              </h1>
              <p style="margin:0;font-size:14px;color:${cardMutedColor};">
                To. <strong style="color:${cardTextColor};">${safeRecipient}</strong>님에게 도착한 온라인 카드
              </p>
            </td>
          </tr>
          ${imageBlock}
          <tr>
            <td style="padding:12px 32px 24px 32px;">
              <div style="background-color:rgba(255,255,255,0.08);border:1px solid ${tpl.ogAccent};border-radius:14px;padding:24px;font-size:15px;line-height:1.75;color:${cardTextColor};">
                ${safeMessage}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:4px 32px 36px 32px;text-align:center;">
              <p style="margin:0 0 22px 0;font-size:14px;color:${cardMutedColor};">
                From. <strong style="color:${cardTextColor};">${safeSender}</strong>
              </p>
              <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;border-radius:999px;background-color:${tpl.ogAccent};color:#1c1917;font-size:15px;font-weight:700;text-decoration:none;">
                ✨ 온라인카드 열어보기
              </a>
              <p style="margin:16px 0 0 0;font-size:12px;color:${cardMutedColor};">
                버튼이 동작하지 않으면 아래 링크를 복사해 열어주세요:<br />
                <a href="${safeUrl}" style="color:${tpl.ogAccent};word-break:break-all;">${safeUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export interface SendEmailResult {
  sent: boolean;
  provider: "resend" | "smtp" | "preview";
  messageId?: string;
  error?: string;
  previewHtml: string;
}

export async function sendCardEmail(params: {
  to: string;
  recipientName: string;
  senderName: string;
  title: string;
  message: string;
  cardUrl: string;
  templateId: string;
  customImageData?: string | null;
}): Promise<SendEmailResult> {
  const origin = (() => {
    try {
      return new URL(params.cardUrl).origin;
    } catch {
      return "";
    }
  })();

  const previewImageSrc = params.customImageData
    ? params.customImageData.startsWith("/samples/") && origin
      ? `${origin}${params.customImageData}`
      : params.customImageData
    : null;

  const previewHtml = renderChristmasEmailHtml({
    ...params,
    imageSrc: previewImageSrc,
  });

  const subject = `[크리스마스 카드] ${params.senderName}님이 "${params.title}" 카드를 보냈습니다`;
  const text = `${params.recipientName}님, ${params.senderName}님이 크리스마스 카드를 보냈습니다.\n\n${params.message}\n\n카드 열기: ${params.cardUrl}`;

  const s = await getEffectiveSettings();
  const status = await getEmailConfigStatus();
  const inlineAttachment = resolveInlineImageAttachment(params.customImageData);

  if (status.provider === "resend") {
    const htmlForResend = renderChristmasEmailHtml({
      ...params,
      imageSrc: inlineAttachment ? `cid:${inlineAttachment.cid}` : null,
    });
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${s.resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: s.resendFrom,
          to: [params.to],
          subject,
          html: htmlForResend,
          text,
          ...(inlineAttachment
            ? {
                attachments: [
                  {
                    filename: inlineAttachment.filename,
                    content: inlineAttachment.content.toString("base64"),
                    content_id: inlineAttachment.cid,
                  },
                ],
              }
            : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        return {
          sent: false,
          provider: "resend",
          error: `Resend 발송 실패 (${res.status}): ${body}`,
          previewHtml,
        };
      }

      const data = (await res.json()) as { id?: string };
      return {
        sent: true,
        provider: "resend",
        messageId: data.id,
        previewHtml,
      };
    } catch (err) {
      return {
        sent: false,
        provider: "resend",
        error:
          err instanceof Error
            ? err.message
            : "Resend 발송 중 오류가 발생했습니다.",
        previewHtml,
      };
    }
  }

  if (status.provider === "smtp") {
    const htmlForSmtp = renderChristmasEmailHtml({
      ...params,
      imageSrc: inlineAttachment ? `cid:${inlineAttachment.cid}` : null,
    });
    const port = Number(s.smtpPort || "587");
    const secure = s.smtpSecure || port === 465;
    const fromHeader = formatSmtpFrom(s.smtpFrom, s.smtpUser);

    const attemptSend = async (authUser: string) => {
      const transporter = nodemailer.createTransport({
        host: s.smtpHost,
        port,
        secure,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
          user: authUser,
          pass: s.smtpPass,
        },
      });

      return transporter.sendMail({
        from: fromHeader,
        to: params.to,
        subject,
        text,
        html: htmlForSmtp,
        ...(inlineAttachment
          ? {
              attachments: [
                {
                  filename: inlineAttachment.filename,
                  content: inlineAttachment.content,
                  contentType: inlineAttachment.contentType,
                  cid: inlineAttachment.cid,
                },
              ],
            }
          : {}),
      });
    };

    try {
      const info = await attemptSend(s.smtpUser);
      return {
        sent: true,
        provider: "smtp",
        messageId: info.messageId,
        previewHtml,
      };
    } catch (err) {
      const rawMsg =
        err instanceof Error
          ? err.message
          : "SMTP 발송 중 오류가 발생했습니다.";

      // Naver SMTP sometimes accepts local-part ID without @naver.com
      if (
        rawMsg.includes("535") &&
        s.smtpHost.toLowerCase().includes("naver.com") &&
        s.smtpUser.includes("@")
      ) {
        try {
          const infoRetry = await attemptSend(s.smtpUser.split("@")[0]);
          return {
            sent: true,
            provider: "smtp",
            messageId: infoRetry.messageId,
            previewHtml,
          };
        } catch {
          // fall through to formatted error below
        }
      }

      let friendlyError = rawMsg;
      if (rawMsg.includes("535") && s.smtpHost.toLowerCase().includes("naver.com")) {
        friendlyError = `${rawMsg} — [네이버 확인] (1) 네이버 메일 환경설정 → POP3/IMAP 설정에서 POP3/SMTP '사용함' 저장 (2) 2단계 인증 사용 시 일반 비번 대신 네이버 보안설정의 '애플리케이션 비밀번호'를 입력해 주세요.`;
      } else if (rawMsg.includes("535") && s.smtpHost.toLowerCase().includes("gmail.com")) {
        friendlyError = `${rawMsg} — [Gmail 확인] Google 계정 → 보안 → 2단계 인증 후 '앱 비밀번호'(16자리)를 발급해 입력해 주세요.`;
      }

      return {
        sent: false,
        provider: "smtp",
        error: friendlyError,
        previewHtml,
      };
    }
  }

  return {
    sent: false,
    provider: "preview",
    error:
      "이메일 발송 설정이 아직 등록되지 않아 미리보기만 생성되었습니다. 상단 [발송 설정] 버튼에서 Gmail/네이버 SMTP 또는 Resend를 등록하세요.",
    previewHtml,
  };
}
