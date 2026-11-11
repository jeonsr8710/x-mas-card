import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const card = await prisma.card.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        templateId: true,
        senderName: true,
        title: true,
        message: true,
        bgmKey: true,
        customImageData: true,
        createdAt: true,
        replies: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            authorName: true,
            emoji: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "카드를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ card });
  } catch (err) {
    console.error("Failed to fetch card:", err);
    return NextResponse.json(
      { error: "카드 데이터를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
