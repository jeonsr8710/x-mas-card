"use client";

import { useEffect, useRef, useState } from "react";
import {
  MailOpen,
  Music,
  VolumeX,
  Sparkles,
  Send,
  Heart,
} from "lucide-react";
import { getTemplate, type BgmKey } from "@/lib/templates";
import { startChristmasMusic, type MusicPlayerHandle } from "@/lib/music";
import { SnowCanvas } from "./SnowCanvas";
import { CardMotif } from "./CardMotif";

export interface ReplyItem {
  id: string;
  authorName: string;
  emoji: string;
  content: string;
  createdAt: string;
}

export interface InteractiveCardProps {
  slug?: string;
  deliveryToken?: string;
  templateId: string;
  senderName: string;
  recipientName?: string;
  title: string;
  message: string;
  bgmKey: string;
  customImageData?: string | null;
  initialReplies?: ReplyItem[];
  isPreview?: boolean;
  startOpen?: boolean;
}

const REPLY_EMOJIS = ["🎄", "🎅", "❄️", "🎁", "❤️", "✨"];

export function InteractiveCardViewer({
  slug,
  deliveryToken,
  templateId,
  senderName,
  recipientName,
  title,
  message,
  bgmKey,
  customImageData,
  initialReplies = [],
  isPreview = false,
  startOpen = false,
}: InteractiveCardProps) {
  const tpl = getTemplate(templateId);
  const [isOpened, setIsOpened] = useState(startOpen);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const musicRef = useRef<MusicPlayerHandle | null>(null);
  const openRecordedRef = useRef(false);

  const [replies, setReplies] = useState<ReplyItem[]>(initialReplies);
  const [replyEmoji, setReplyEmoji] = useState("🎄");
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      musicRef.current?.stop();
    };
  }, []);

  const startMusicIfEnabled = () => {
    if (bgmKey === "none" || musicRef.current) return;
    const handle = startChristmasMusic(bgmKey as BgmKey);
    if (handle) {
      musicRef.current = handle;
      setIsPlayingMusic(true);
    }
  };

  const toggleMusic = () => {
    if (isPlayingMusic) {
      musicRef.current?.stop();
      musicRef.current = null;
      setIsPlayingMusic(false);
    } else {
      startMusicIfEnabled();
    }
  };

  const handleOpenEnvelope = () => {
    setIsOpened(true);
    if (!isPreview) {
      startMusicIfEnabled();
      if (slug && deliveryToken && !openRecordedRef.current) {
        openRecordedRef.current = true;
        void fetch(`/api/cards/${encodeURIComponent(slug)}/open`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deliveryToken }),
        }).catch(() => {});
      }
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPreview || !slug) return;
    if (!replyContent.trim()) {
      setReplyFeedback("답장 내용을 입력해 주세요.");
      return;
    }

    setIsSubmittingReply(true);
    setReplyFeedback(null);

    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(slug)}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: recipientName?.trim() || "소중한 분",
          emoji: replyEmoji,
          content: replyContent.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReplyFeedback(data.error || "답장 등록에 실패했습니다.");
        return;
      }
      setReplies((prev) => [data.reply, ...prev]);
      setReplyContent("");
      setReplyFeedback("따뜻한 답장이 전달되었습니다!");
    } catch {
      setReplyFeedback("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div
      className={`relative overflow-hidden ${
        isPreview
          ? "min-h-[540px] rounded-3xl p-4 sm:p-6"
          : "min-h-screen px-3.5 sm:px-4 py-8 sm:py-16"
      } flex flex-col items-center justify-center bg-gradient-to-b ${tpl.envelopeBg}`}
    >
      <SnowCanvas color={tpl.snowColor} density={isPreview ? 35 : 70} />

      {/* Top Audio Control when opened */}
      {isOpened && bgmKey !== "none" && !isPreview && (
        <button
          type="button"
          onClick={toggleMusic}
          className="fixed top-4 right-4 z-30 flex items-center gap-2 rounded-full bg-black/45 px-4 py-2 text-xs font-medium text-white backdrop-blur-md border border-white/20 hover:bg-black/65 transition cursor-pointer"
        >
          {isPlayingMusic ? (
            <>
              <Music className="h-4 w-4 animate-pulse text-amber-300" />
              <span>캐롤 재생 중</span>
            </>
          ) : (
            <>
              <VolumeX className="h-4 w-4 text-white/70" />
              <span>음악 켜기</span>
            </>
          )}
        </button>
      )}

      {!isOpened ? (
        /* Closed Envelope View */
        <div className="relative z-10 w-full max-w-md text-center">
          <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-medium text-amber-100 backdrop-blur-sm border border-white/20">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            크리스마스 카드가 도착했어요
          </p>

          <button
            type="button"
            onClick={handleOpenEnvelope}
            className="group relative mx-auto block w-full max-w-sm rounded-2xl bg-white/10 p-1 shadow-2xl backdrop-blur-md border border-white/25 transition-transform duration-300 hover:-translate-y-1.5 hover:scale-[1.02] cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/15 to-black/30 px-6 py-12 text-white">
              {/* Decorative top flap lines */}
              <div
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: tpl.envelopeAccent }}
              >
                <MailOpen className="h-8 w-8 text-stone-900" />
              </div>

              {recipientName?.trim() && (
                <p className="text-sm font-medium text-amber-200 mb-1">
                  To. {recipientName}님
                </p>
              )}
              <h2 className="text-xl font-bold tracking-tight text-white mb-2">
                {title || "메리 크리스마스!"}
              </h2>
              <p className="text-sm text-white/80 mb-6">
                From. {senderName || "보내는 사람"}
              </p>

              <span className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-md group-hover:bg-amber-200 transition">
                봉투 열어보기
              </span>
            </div>
          </button>
        </div>
      ) : (
        /* Opened Interactive Card View */
        <div className="relative z-10 w-full max-w-lg space-y-6 animate-[fadeIn_0.5s_ease-out]">
          <article
            className={`relative overflow-hidden rounded-3xl border-2 ${tpl.cardBorder} bg-gradient-to-br ${tpl.cardBg} p-6 sm:p-10 shadow-2xl`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-3">
                <CardMotif motif={tpl.motif} />
              </div>

              <span
                className="mb-3 inline-block rounded-full px-3 py-1 text-[11px] font-bold tracking-widest uppercase"
                style={{
                  backgroundColor: tpl.accentColor,
                  color: "#1c1917",
                }}
              >
                Merry Christmas
              </span>

              {recipientName?.trim() && (
                <p className={`text-sm font-semibold mb-1 ${tpl.mutedColor}`}>
                  To. {recipientName}님
                </p>
              )}

              <h1
                className={`text-xl sm:text-3xl font-bold leading-snug mb-5 break-words ${tpl.textColor}`}
              >
                {title || "메리 크리스마스!"}
              </h1>

              {customImageData && (
                <div className="mb-6 w-full overflow-hidden rounded-2xl border border-white/20 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={customImageData}
                    alt="크리스마스 카드 첨부 이미지"
                    className="max-h-64 w-full object-cover"
                  />
                </div>
              )}

              <div
                className={`w-full rounded-2xl border ${tpl.cardBorder} bg-white/5 px-4 sm:px-5 py-5 sm:py-6 text-left whitespace-pre-wrap break-words leading-relaxed text-[15px] sm:text-base ${tpl.textColor}`}
              >
                {message || "따뜻하고 행복한 크리스마스 보내세요!"}
              </div>

              <div className={`mt-6 flex items-center gap-2 text-sm font-semibold ${tpl.textColor}`}>
                <Heart className="h-4 w-4 text-rose-400 fill-rose-400" />
                <span>From. {senderName || "보내는 사람"}</span>
              </div>
            </div>
          </article>

          {/* Replies Section (only on real card page) */}
          {!isPreview && slug && (
            <section className="rounded-2xl border border-white/20 bg-black/35 p-5 sm:p-6 text-white backdrop-blur-md shadow-xl">
              <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                <span>💬 답장 남기기</span>
              </h2>

              <form onSubmit={handleReplySubmit} className="space-y-3">
                <div className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-2 py-1">
                  {REPLY_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setReplyEmoji(em)}
                      className={`rounded-lg px-2 py-1 text-base transition cursor-pointer ${
                        replyEmoji === em
                          ? "bg-amber-300/30 ring-1 ring-amber-300"
                          : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="따뜻한 답장을 작성해 주세요..."
                    maxLength={300}
                    className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingReply}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-300 px-3.5 sm:px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-amber-200 disabled:opacity-50 transition cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    <span>전송</span>
                  </button>
                </div>

                {replyFeedback && (
                  <p className="text-xs text-amber-200">{replyFeedback}</p>
                )}
              </form>

              {replies.length > 0 && (
                <ul className="mt-5 space-y-2 border-t border-white/15 pt-4">
                  {replies.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-xl bg-white/10 px-3.5 py-2.5 text-sm text-white/95"
                    >
                      <span>{r.emoji}</span>{" "}
                      <span>{r.content}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
