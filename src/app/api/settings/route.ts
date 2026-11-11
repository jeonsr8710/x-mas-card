import { NextResponse } from "next/server";
import {
  getPublicSettingsSummary,
  saveAppSettings,
  type SettingsUpdateInput,
} from "@/lib/settings";
import { sendCardEmail } from "@/lib/email";
import { isValidEmail } from "@/lib/share";
import { isPublicViewerOnly } from "@/lib/mode";

export async function GET() {
  if (isPublicViewerOnly()) {
    return NextResponse.json(
      { error: "공개 뷰어 모드에서는 설정을 조회할 수 없습니다." },
      { status: 403 }
    );
  }
  const settings = await getPublicSettingsSummary();
  return NextResponse.json({ settings });
}

export async function PUT(req: Request) {
  if (isPublicViewerOnly()) {
    return NextResponse.json(
      { error: "공개 뷰어 모드에서는 설정을 변경할 수 없습니다." },
      { status: 403 }
    );
  }
  try {
    const body = (await req.json()) as SettingsUpdateInput;
    const settings = await saveAppSettings(body);
    return NextResponse.json({ settings });
  } catch (err) {
    console.error("Failed to save settings:", err);
    return NextResponse.json(
      { error: "설정을 저장하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (isPublicViewerOnly()) {
    return NextResponse.json(
      { error: "공개 뷰어 모드에서는 사용할 수 없습니다." },
      { status: 403 }
    );
  }
  try {
    const body = (await req.json()) as {
      action?: string;
      testEmail?: string;
    };

    if (body.action === "test-email") {
      const to = String(body.testEmail ?? "").trim();
      if (!isValidEmail(to)) {
        return NextResponse.json(
          { error: "테스트 수신 이메일 주소를 올바르게 입력해 주세요." },
          { status: 400 }
        );
      }

      const origin = new URL(req.url).origin;
      const result = await sendCardEmail({
        to,
        recipientName: "테스트 수신자",
        senderName: "X-mas Card Studio",
        title: "이메일 발송 설정 테스트 메일",
        message:
          "이 메일이 정상적으로 도착했다면 X-mas Card Studio의 이메일 발송 설정이 완료된 것입니다!",
        cardUrl: origin,
        templateId: "classic-tree",
      });

      return NextResponse.json({
        sent: result.sent,
        provider: result.provider,
        messageId: result.messageId,
        error: result.error,
      });
    }

    return NextResponse.json({ error: "지원하지 않는 요청입니다." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "테스트 요청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
