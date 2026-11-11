import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { getTemplate } from "@/lib/templates";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function loadKoreanFont(): Buffer | null {
  try {
    const fontPath = path.join(
      process.cwd(),
      "assets",
      "fonts",
      "UnDinaruBold.ttf"
    );
    if (fs.existsSync(fontPath)) {
      return fs.readFileSync(fontPath);
    }
  } catch {
    // fallback to default font
  }
  return null;
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let card: {
    title: string;
    senderName: string;
    templateId: string;
  } | null = null;

  try {
    card = await prisma.card.findUnique({
      where: { slug },
      select: { title: true, senderName: true, templateId: true },
    });
  } catch {
    card = null;
  }

  const tpl = getTemplate(card?.templateId ?? "classic-tree");
  const isLight = tpl.id === "cozy-cabin" || tpl.id === "minimal-gold";
  const textColor = isLight ? "#1c1917" : "#fefce8";
  const mutedColor = isLight ? "#57534e" : "#cbd5e1";

  const titleText = card?.title || "Merry Christmas!";
  const senderText = `From. ${card?.senderName || "Your Friend"}`;
  const fontData = loadKoreanFont();

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
          fontFamily: fontData ? "UnDinaru" : "sans-serif",
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
            display: "flex",
            justifyContent: "center",
            fontSize: 52,
            fontWeight: 700,
            color: textColor,
            lineHeight: 1.3,
            marginBottom: 24,
            maxWidth: 960,
          }}
        >
          {titleText}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            fontSize: 30,
            color: mutedColor,
          }}
        >
          {senderText}
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData
        ? {
            fonts: [
              {
                name: "UnDinaru",
                data: fontData,
                style: "normal",
                weight: 700,
              },
            ],
          }
        : {}),
    }
  );
}
