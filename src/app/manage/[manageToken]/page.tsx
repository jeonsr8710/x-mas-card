import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isPublicViewerOnly } from "@/lib/mode";
import { SendManager } from "@/components/SendManager";

async function ManageContent({
  params,
}: {
  params: Promise<{ manageToken: string }>;
}) {
  if (isPublicViewerOnly()) {
    notFound();
  }

  const { manageToken } = await params;

  const card = await prisma.card.findUnique({
    where: { manageToken },
    include: {
      deliveries: { orderBy: { createdAt: "desc" } },
      replies: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!card) {
    notFound();
  }

  return (
    <SendManager
      initialCard={{
        id: card.id,
        slug: card.slug,
        manageToken: card.manageToken,
        templateId: card.templateId,
        senderName: card.senderName,
        title: card.title,
        message: card.message,
        bgmKey: card.bgmKey,
        deliveries: card.deliveries.map((d) => ({
          id: d.id,
          token: d.token,
          recipientName: d.recipientName,
          channel: d.channel,
          targetAddress: d.targetAddress,
          status: d.status,
          sentAt: d.sentAt ? d.sentAt.toISOString() : null,
          openedAt: d.openedAt ? d.openedAt.toISOString() : null,
          openCount: d.openCount,
          errorMessage: d.errorMessage,
          createdAt: d.createdAt.toISOString(),
        })),
        replies: card.replies.map((r) => ({
          id: r.id,
          authorName: r.authorName,
          emoji: r.emoji,
          content: r.content,
          createdAt: r.createdAt.toISOString(),
        })),
      }}
    />
  );
}

export default function ManageCardPage({
  params,
}: {
  params: Promise<{ manageToken: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-stone-600 text-sm">
          발송 관리 페이지를 불러오는 중...
        </div>
      }
    >
      <ManageContent params={params} />
    </Suspense>
  );
}
