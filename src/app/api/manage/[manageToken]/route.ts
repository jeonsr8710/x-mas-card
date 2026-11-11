import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPublicViewerOnly } from "@/lib/mode";
import { CARD_TEMPLATES, BGM_OPTIONS } from "@/lib/templates";

const VALID_BGM = new Set(BGM_OPTIONS.map((b) => b.key));

export async function GET(
  _req: Request,
  context: { params: Promise<{ manageToken: string }> }
) {
  if (isPublicViewerOnly()) {
    return NextResponse.json(
      { error: "공개 뷰어 모드에서는 접근할 수 없습니다." },
      { status: 403 }
    );
  }
  const { manageToken } = await context.params;

  const card = await prisma.card.findUnique({
    where: { manageToken },
    include: {
      deliveries: { orderBy: { createdAt: "desc" } },
      replies: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!card) {
    return NextResponse.json(
      { error: "관리 페이지를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  return NextResponse.json({ card });
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
    const existing = await prisma.card.findUnique({
      where: { manageToken },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "관리 페이지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;
    const data: Record<string, string | null> = {};

    if (typeof body.senderName === "string") {
      const val = body.senderName.trim();
      if (!val || val.length > 40) {
        return NextResponse.json(
          { error: "보내는 분 이름은 1~40자여야 합니다." },
          { status: 400 }
        );
      }
      data.senderName = val;
    }

    if (typeof body.title === "string") {
      const val = body.title.trim();
      if (!val || val.length > 80) {
        return NextResponse.json(
          { error: "카드 제목은 1~80자여야 합니다." },
          { status: 400 }
        );
      }
      data.title = val;
    }

    if (typeof body.message === "string") {
      const val = body.message.trim();
      if (!val || val.length > 2000) {
        return NextResponse.json(
          { error: "메시지는 1~2000자여야 합니다." },
          { status: 400 }
        );
      }
      data.message = val;
    }

    if (typeof body.templateId === "string") {
      if (!(body.templateId in CARD_TEMPLATES)) {
        return NextResponse.json(
          { error: "유효하지 않은 템플릿입니다." },
          { status: 400 }
        );
      }
      data.templateId = body.templateId;
    }

    if (typeof body.bgmKey === "string") {
      if (!VALID_BGM.has(body.bgmKey as (typeof BGM_OPTIONS)[number]["key"])) {
        return NextResponse.json(
          { error: "유효하지 않은 배경음악입니다." },
          { status: 400 }
        );
      }
      data.bgmKey = body.bgmKey;
    }

    if (body.customImageData === null) {
      data.customImageData = null;
    } else if (typeof body.customImageData === "string") {
      const isSamplePath = /^\/samples\/[a-zA-Z0-9._-]+\.(png|jpg|jpeg|webp)$/i.test(
        body.customImageData
      );
      if (
        (!body.customImageData.startsWith("data:image/") && !isSamplePath) ||
        body.customImageData.length > 1_600_000
      ) {
        return NextResponse.json(
          { error: "이미지 형식이 올바르지 않거나 너무 큽니다." },
          { status: 400 }
        );
      }
      data.customImageData = body.customImageData;
    }

    const updated = await prisma.card.update({
      where: { id: existing.id },
      data,
      include: {
        deliveries: { orderBy: { createdAt: "desc" } },
        replies: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json({ card: updated });
  } catch {
    return NextResponse.json(
      { error: "카드 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
