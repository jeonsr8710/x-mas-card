import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { isPublicViewerOnly } from "@/lib/mode";
import { CARD_TEMPLATES, BGM_OPTIONS } from "@/lib/templates";

const VALID_BGM = new Set(BGM_OPTIONS.map((b) => b.key));
const MAX_IMAGE_CHARS = 1_600_000;

export async function GET() {
  if (isPublicViewerOnly()) {
    return NextResponse.json(
      { error: "공개 뷰어 모드에서는 카드 목록을 조회할 수 없습니다." },
      { status: 403 }
    );
  }
  try {
    const rows = await prisma.card.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        slug: true,
        manageToken: true,
        templateId: true,
        senderName: true,
        title: true,
        createdAt: true,
        deliveries: {
          select: { openCount: true },
        },
        _count: {
          select: { deliveries: true, replies: true },
        },
      },
    });

    const cards = rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      manageToken: c.manageToken,
      templateId: c.templateId,
      senderName: c.senderName,
      title: c.title,
      createdAt: c.createdAt.toISOString(),
      deliveryCount: c._count.deliveries,
      replyCount: c._count.replies,
      totalOpens: c.deliveries.reduce((sum, d) => sum + d.openCount, 0),
    }));

    return NextResponse.json({ cards });
  } catch (err) {
    console.error("Failed to list cards:", err);
    return NextResponse.json(
      { error: "카드 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (isPublicViewerOnly()) {
    return NextResponse.json(
      { error: "공개 뷰어 모드에서는 카드를 생성할 수 없습니다." },
      { status: 403 }
    );
  }
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const senderName = String(body.senderName ?? "").trim();
    const title = String(body.title ?? "").trim();
    const message = String(body.message ?? "").trim();
    const templateId = String(body.templateId ?? "classic-tree").trim();
    const bgmKey = String(body.bgmKey ?? "jingle-bells").trim();
    const customImageData =
      typeof body.customImageData === "string" && body.customImageData.length > 0
        ? body.customImageData
        : null;

    if (!senderName || senderName.length > 40) {
      return NextResponse.json(
        { error: "보내는 분 이름을 1~40자로 입력해 주세요." },
        { status: 400 }
      );
    }
    if (!title || title.length > 80) {
      return NextResponse.json(
        { error: "카드 제목을 1~80자로 입력해 주세요." },
        { status: 400 }
      );
    }
    if (!message || message.length > 2000) {
      return NextResponse.json(
        { error: "메시지를 1~2000자로 입력해 주세요." },
        { status: 400 }
      );
    }
    if (!(templateId in CARD_TEMPLATES)) {
      return NextResponse.json(
        { error: "올바르지 않은 카드 템플릿입니다." },
        { status: 400 }
      );
    }
    if (!VALID_BGM.has(bgmKey as (typeof BGM_OPTIONS)[number]["key"])) {
      return NextResponse.json(
        { error: "올바르지 않은 배경음악 설정입니다." },
        { status: 400 }
      );
    }
    if (customImageData) {
      const isSamplePath = /^\/samples\/[a-zA-Z0-9._-]+\.(png|jpg|jpeg|webp)$/i.test(
        customImageData
      );
      if (!customImageData.startsWith("data:image/") && !isSamplePath) {
        return NextResponse.json(
          { error: "지원하지 않는 이미지 형식입니다." },
          { status: 400 }
        );
      }
      if (customImageData.length > MAX_IMAGE_CHARS) {
        return NextResponse.json(
          { error: "이미지 크기가 너무 큽니다. 1MB 이하의 이미지를 사용해 주세요." },
          { status: 400 }
        );
      }
    }

    const card = await prisma.card.create({
      data: {
        slug: nanoid(12),
        manageToken: nanoid(22),
        templateId,
        senderName,
        title,
        message,
        bgmKey,
        customImageData,
      },
      select: {
        id: true,
        slug: true,
        manageToken: true,
        templateId: true,
        senderName: true,
        title: true,
        message: true,
        bgmKey: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (err) {
    console.error("Failed to create card:", err);
    return NextResponse.json(
      { error: "카드를 저장하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
