import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = (await req.json()) as { deliveryToken?: string };
    const token = body.deliveryToken?.trim();

    if (!token) {
      return NextResponse.json({ recorded: false });
    }

    const card = await prisma.card.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!card) {
      return NextResponse.json({ recorded: false }, { status: 404 });
    }

    const delivery = await prisma.delivery.findFirst({
      where: { cardId: card.id, token },
      select: { id: true, openedAt: true },
    });

    if (!delivery) {
      return NextResponse.json({ recorded: false });
    }

    await prisma.delivery.update({
      where: { id: delivery.id },
      data: {
        openedAt: delivery.openedAt ?? new Date(),
        openCount: { increment: 1 },
      },
    });

    return NextResponse.json({ recorded: true });
  } catch {
    return NextResponse.json({ recorded: false }, { status: 500 });
  }
}
