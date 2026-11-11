import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { getTemplate } from "@/lib/templates";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = await prisma.card.findUnique({
    where: { slug },
    select: { title: true, senderName: true, templateId: true },
  });

  const tpl = getTemplate(card?.templateId ?? "classic-tree");
  const isLight = tpl.id === "cozy-cabin" || tpl.id === "minimal-gold";
  const textColor = isLight ? "#1c1917" : "#fefce8";
  const mutedColor = isLight ? "#57534e" : "#cbd5e1";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: tpl.ogBg,
          border: `16px solid ${tpl.ogAccent}`,
          padding: "48px 64px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            padding: "10px 24px",
            borderRadius: "999px",
            backgroundColor: tpl.ogAccent,
            color: "#1c1917",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.1em",
            marginBottom: 28,
          }}
        >
          MERRY CHRISTMAS
        </div>
        <div
          style={{
            fontSize: 54,
            fontWeight: 800,
            color: textColor,
            lineHeight: 1.25,
            marginBottom: 24,
            maxWidth: 960,
          }}
        >
          {card?.title || "따뜻한 크리스마스 카드가 도착했어요"}
        </div>
        <div
          style={{
            fontSize: 30,
            color: mutedColor,
          }}
        >
          From. {card?.senderName || "소중한 친구"}
        </div>
      </div>
    ),
    { ...size }
  );
}
