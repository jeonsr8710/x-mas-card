"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ImagePlus,
  Trash2,
  Music,
  Send,
  History,
  Eye,
  MailOpen,
  RefreshCw,
} from "lucide-react";
import {
  TEMPLATE_LIST,
  BGM_OPTIONS,
  MESSAGE_PRESETS,
  type TemplateId,
  type BgmKey,
} from "@/lib/templates";
import { SAMPLE_IMAGES } from "@/lib/samples";
import { InteractiveCardViewer } from "./InteractiveCardViewer";

interface SavedCardSummary {
  id: string;
  slug: string;
  manageToken: string;
  templateId: string;
  title: string;
  senderName: string;
  createdAt: string;
  deliveryCount: number;
  replyCount: number;
  totalOpens: number;
}

function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("유효한 이미지 파일이 아닙니다."));
      img.onload = () => {
        const maxSide = 960;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("이미지 처리에 실패했습니다."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function CardEditor() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<TemplateId>("classic-tree");
  const [senderName, setSenderName] = useState("");
  const [previewRecipient, setPreviewRecipient] = useState("소중한 분");
  const [title, setTitle] = useState(MESSAGE_PRESETS[0].title);
  const [message, setMessage] = useState(MESSAGE_PRESETS[0].message);
  const [bgmKey, setBgmKey] = useState<BgmKey>("jingle-bells");
  const [customImageData, setCustomImageData] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<SavedCardSummary[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const loadSavedCards = useCallback(async () => {
    try {
      const res = await fetch("/api/cards");
      if (!res.ok) return;
      const data = (await res.json()) as { cards?: SavedCardSummary[] };
      if (Array.isArray(data.cards)) {
        setSavedCards(data.cards);
      }
    } catch {
      // ignore fetch error
    } finally {
      setLoadingCards(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/cards")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { cards?: SavedCardSummary[] } | null) => {
        if (active && data && Array.isArray(data.cards)) {
          setSavedCards(data.cards);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingCards(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const toggleSelectToken = (manageToken: string) => {
    setSelectedTokens((prev) =>
      prev.includes(manageToken)
        ? prev.filter((t) => t !== manageToken)
        : [...prev, manageToken]
    );
  };

  const handleDeleteCards = async (tokens: string[]) => {
    if (tokens.length === 0) return;
    const msg =
      tokens.length === 1
        ? "이 카드를 DB에서 삭제할까요? (발송·답장 내역도 함께 삭제됩니다)"
        : `선택한 ${tokens.length}개의 카드를 DB에서 삭제할까요?`;
    if (!window.confirm(msg)) return;

    setDeleting(true);
    try {
      await Promise.all(
        tokens.map((tok) =>
          fetch(`/api/manage/${encodeURIComponent(tok)}`, {
            method: "DELETE",
          })
        )
      );
      setSelectedTokens((prev) => prev.filter((t) => !tokens.includes(t)));
      await loadSavedCards();
    } finally {
      setDeleting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setCustomImageData(dataUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "이미지 업로드에 실패했습니다."
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!senderName.trim()) {
      setError("보내는 분 이름을 입력해 주세요.");
      return;
    }
    if (!title.trim() || !message.trim()) {
      setError("카드 제목과 메시지를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          senderName: senderName.trim(),
          title: title.trim(),
          message: message.trim(),
          bgmKey,
          customImageData,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "카드 생성에 실패했습니다.");
        return;
      }

      router.push(`/manage/${data.card.manageToken}`);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left: Card Editor Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-6 space-y-6 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-bold text-stone-900 mb-1">
              1. 카드 테마 선택
            </h2>
            <p className="text-xs text-stone-500 mb-3">
              분위기에 맞는 크리스마스 봉투와 카드 디자인을 골라보세요.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATE_LIST.map((tpl) => {
                const selected = templateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setTemplateId(tpl.id)}
                    className={`text-left rounded-2xl border p-3.5 transition cursor-pointer ${
                      selected
                        ? "border-red-700 bg-red-50/60 ring-2 ring-red-700/20"
                        : "border-stone-200 hover:border-stone-300 bg-stone-50/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-stone-900">
                        {tpl.name}
                      </span>
                      <span className="rounded-full bg-stone-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {tpl.badge}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      {tpl.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-stone-900">
              2. 카드 내용 작성
            </h2>

            {/* Quick Presets */}
            <div>
              <span className="block text-xs font-medium text-stone-600 mb-2">
                추천 인사말 채우기
              </span>
              <div className="flex flex-wrap gap-2">
                {MESSAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.category}
                    type="button"
                    onClick={() => {
                      setTitle(preset.title);
                      setMessage(preset.message);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                  >
                    <Sparkles className="h-3 w-3 text-amber-600" />
                    {preset.category}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  보내는 분 이름 *
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="예: 홍길동"
                  maxLength={40}
                  required
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  미리보기 호칭 (선택)
                </label>
                <input
                  type="text"
                  value={previewRecipient}
                  onChange={(e) => setPreviewRecipient(e.target.value)}
                  placeholder="발송 시 수신자마다 개별 입력"
                  maxLength={30}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                카드 제목 *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Merry Christmas!"
                maxLength={80}
                required
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                마음을 담은 메시지 *
              </label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="따뜻한 연말 인사를 적어보세요..."
                maxLength={2000}
                required
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 leading-relaxed focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/20"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-stone-900">
              3. 배경음악 & 사진 첨부
            </h2>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 mb-1.5">
                <Music className="h-3.5 w-3.5" />
                카드 개봉 시 재생할 오르골 캐롤
              </label>
              <select
                value={bgmKey}
                onChange={(e) => setBgmKey(e.target.value as BgmKey)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-700/20"
              >
                {BGM_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label} — {opt.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-semibold text-stone-700 mb-2">
                사진 첨부 또는 샘플 이미지 선택 (선택)
              </span>

              {/* Sample Images Gallery */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {SAMPLE_IMAGES.map((sample) => {
                  const active = customImageData === sample.src;
                  return (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() =>
                        setCustomImageData(active ? null : sample.src)
                      }
                      className={`group overflow-hidden rounded-xl border text-center transition cursor-pointer ${
                        active
                          ? "border-red-700 ring-2 ring-red-700/30 bg-red-50"
                          : "border-stone-200 hover:border-stone-400 bg-stone-50"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sample.src}
                        alt={sample.title}
                        className="h-14 w-full object-cover"
                      />
                      <span className="block truncate px-1 py-1 text-[10px] font-medium text-stone-700">
                        {sample.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer transition">
                  <ImagePlus className="h-4 w-4" />
                  <span>내 PC 사진 업로드</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="sr-only"
                  />
                </label>
                {customImageData && (
                  <button
                    type="button"
                    onClick={() => setCustomImageData(null)}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    이미지 제거
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-800 px-6 py-4 text-base font-bold text-white shadow-md hover:bg-red-900 disabled:opacity-60 transition cursor-pointer"
          >
            <Send className="h-5 w-5" />
            <span>
              {isSubmitting
                ? "카드 생성 중..."
                : "카드 생성하고 메일/카톡/SMS로 보내기"}
            </span>
          </button>
        </form>

        {/* Right: Live Preview */}
        <div className="lg:col-span-6 lg:sticky lg:top-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-red-700" />
              실시간 미리보기
            </span>
            <div className="inline-flex rounded-xl border border-stone-200 bg-white p-1 text-xs">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium cursor-pointer ${
                  !previewOpen
                    ? "bg-stone-900 text-white"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <MailOpen className="h-3.5 w-3.5" />
                봉투
              </button>
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className={`rounded-lg px-2.5 py-1 font-medium cursor-pointer ${
                  previewOpen
                    ? "bg-stone-900 text-white"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                카드 속지
              </button>
            </div>
          </div>

          <InteractiveCardViewer
            key={`${templateId}-${previewOpen ? "open" : "closed"}`}
            templateId={templateId}
            senderName={senderName || "보내는 사람"}
            recipientName={previewRecipient}
            title={title}
            message={message}
            bgmKey={bgmKey}
            customImageData={customImageData}
            isPreview
            startOpen={previewOpen}
          />
        </div>
      </div>

      {/* DB-backed Saved Cards List (bottom) */}
      {(loadingCards || savedCards.length > 0) && (
        <div className="mt-10 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
              <History className="h-4 w-4" />
              <span>
                만든 카드 목록 (DB 저장 · {savedCards.length}개)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {selectedTokens.length > 0 && (
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => handleDeleteCards(selectedTokens)}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-800 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                  선택 삭제 ({selectedTokens.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => void loadSavedCards()}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-100 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                새로고침
              </button>
            </div>
          </div>

          {loadingCards && savedCards.length === 0 ? (
            <p className="text-xs text-amber-800/70 py-1">
              DB에서 카드 목록을 불러오는 중...
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {savedCards.map((c) => {
                const checked = selectedTokens.includes(c.manageToken);
                return (
                  <div
                    key={c.manageToken}
                    className={`flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-xs border transition shadow-xs ${
                      checked
                        ? "border-rose-400 ring-1 ring-rose-300"
                        : "border-amber-200 hover:border-amber-400"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelectToken(c.manageToken)}
                        aria-label={`${c.title} 선택`}
                        className="h-3.5 w-3.5 rounded accent-red-800 cursor-pointer shrink-0"
                      />
                      <Link
                        href={`/manage/${c.manageToken}`}
                        className="min-w-0 flex-1 group"
                      >
                        <div className="font-semibold text-stone-800 truncate group-hover:text-red-800">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span>{c.senderName}</span>
                          <span>·</span>
                          <span>발송 {c.deliveryCount}</span>
                          <span>·</span>
                          <span className="text-emerald-700 font-medium">
                            열람 {c.totalOpens}
                          </span>
                          <span>·</span>
                          <span className="text-amber-700 font-medium">
                            답장 {c.replyCount}
                          </span>
                        </div>
                      </Link>
                    </div>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => handleDeleteCards([c.manageToken])}
                      title="카드 삭제"
                      aria-label={`${c.title} 삭제`}
                      className="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-700 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
