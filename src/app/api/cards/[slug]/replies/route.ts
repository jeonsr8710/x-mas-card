import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = (await req.json()) as Record<string, unknown>;

    const authorName = String(body.authorName ?? "").trim();
    const emoji = String(body.emoji ?? "🎄").trim().slice(0, 8) || "🎄";
    const content = String(body.content ?? "").trim();

    if (!authorName || authorName.length > 40) {
      return NextResponse.json(
        { error: "이름을 1~40자로 입력해 주세요." },
        { status: 400 }
      );
    }
    if (!content || content.length > 300) {
      return NextResponse.json(
        { error: "답장 내용을 1~300자로 입력해 주세요." },
        { status: 400 }
      );
    }

    const card = await prisma.card.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!card) {
      return NextResponse.json(
        { error: "카드를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const reply = await prisma.reply.create({
      data: {
        cardId: card.id,
        authorName,
        emoji,
        content,
      },
      select: {
        id: true,
        authorName: true,
        emoji: true,
        content: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "답장을 저장하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
