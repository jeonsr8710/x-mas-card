import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InteractiveCardViewer } from "@/components/InteractiveCardViewer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const card = await prisma.card.findUnique({
    where: { slug },
    select: { title: true, senderName: true, message: true },
  });

  if (!card) {
    return { title: "카드를 찾을 수 없습니다" };
  }

  const snippet = card.message.replace(/\s+/g, " ").trim().slice(0, 80);

  return {
    title: `🎄 ${card.title} | From. ${card.senderName}`,
    description: `${card.senderName}님이 보낸 크리스마스 카드: ${snippet}`,
    openGraph: {
      title: `🎄 ${card.title}`,
      description: `From. ${card.senderName} — ${snippet}`,
      type: "website",
    },
  };
}

async function CardContent({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  const { slug } = await params;
  const { d: deliveryToken } = await searchParams;

  const card = await prisma.card.findUnique({
    where: { slug },
    include: {
      replies: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!card) {
    notFound();
  }

  let recipientName: string | undefined;
  if (deliveryToken) {
    const delivery = await prisma.delivery.findFirst({
      where: { cardId: card.id, token: deliveryToken },
      select: { recipientName: true },
    });
    if (delivery) {
      recipientName = delivery.recipientName;
    }
  }

  return (
    <InteractiveCardViewer
      slug={card.slug}
      deliveryToken={deliveryToken}
      templateId={card.templateId}
      senderName={card.senderName}
      recipientName={recipientName}
      title={card.title}
      message={card.message}
      bgmKey={card.bgmKey}
      customImageData={card.customImageData}
      initialReplies={card.replies.map((r) => ({
        id: r.id,
        authorName: r.authorName,
        emoji: r.emoji,
        content: r.content,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}

export default function CardViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-950 text-amber-100 text-sm">
          크리스마스 카드를 불러오는 중...
        </div>
      }
    >
      <CardContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
