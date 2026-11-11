"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  Mail,
  MessageCircle,
  Smartphone,
  Link2,
  Copy,
  Check,
  ExternalLink,
  Send,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Settings,
  BookOpen,
  QrCode,
} from "lucide-react";
import { getTemplate } from "@/lib/templates";
import type { EmailConfigStatus } from "@/lib/email";
import type { PublicSettingsSummary } from "@/lib/settings";
import { SettingsModal } from "./SettingsModal";
import { ManualModal } from "./ManualModal";

interface DeliveryRecord {
  id: string;
  token: string;
  recipientName: string;
  channel: string;
  targetAddress: string | null;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  openCount: number;
  errorMessage: string | null;
  createdAt: string;
}

interface ReplyRecord {
  id: string;
  authorName: string;
  emoji: string;
  content: string;
  createdAt: string;
}

interface CardRecord {
  id: string;
  slug: string;
  manageToken: string;
  templateId: string;
  senderName: string;
  title: string;
  message: string;
  bgmKey: string;
  deliveries: DeliveryRecord[];
  replies: ReplyRecord[];
}

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      cleanup?: () => void;
      Share: {
        sendDefault: (payload: unknown) => void;
      };
    };
  }
}

type ChannelTab = "EMAIL" | "KAKAO" | "SMS" | "LINK";

const noopSubscribe = () => () => {};

export function SendManager({ initialCard }: { initialCard: CardRecord }) {
  const [card, setCard] = useState<CardRecord>(initialCard);
  const [activeTab, setActiveTab] = useState<ChannelTab>("EMAIL");
  const [emailConfig, setEmailConfig] = useState<EmailConfigStatus | null>(null);
  const [kakaoJsKey, setKakaoJsKey] = useState("");
  const [smsApiConfigured, setSmsApiConfigured] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<
    "EMAIL" | "KAKAO" | "SMS" | "BASE"
  >("EMAIL");
  const [manualOpen, setManualOpen] = useState(false);

  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => ""
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Email form state
  const [emailRows, setEmailRows] = useState([
    { recipientName: "", email: "" },
  ]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailResults, setEmailResults] = useState<
    Array<{
      recipientName: string;
      email?: string;
      sent: boolean;
      provider?: string;
      error?: string;
      cardUrl?: string;
      previewHtml?: string;
    }>
  >([]);
  const [previewHtmlModal, setPreviewHtmlModal] = useState<string | null>(null);

  // Kakao form state
  const [kakaoRecipient, setKakaoRecipient] = useState("");
  const [kakaoReady, setKakaoReady] = useState(false);
  const [kakaoLastShare, setKakaoLastShare] = useState<{
    cardUrl: string;
    recipientName: string;
    deliveryId: string;
    qrDataUrl?: string | null;
  } | null>(null);

  // SMS form state
  const [smsRecipient, setSmsRecipient] = useState("");
  const [smsPhone, setSmsPhone] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsResult, setSmsResult] = useState<{
    deliveryId: string;
    smsUri: string;
    smsText: string;
    smsLaunchUrl?: string;
    cardUrl: string;
    recipientName: string;
    qrDataUrl?: string | null;
    sentViaApi?: boolean;
    sent?: boolean;
    error?: string;
  } | null>(null);

  // Link form state
  const [linkRecipient, setLinkRecipient] = useState("");
  const [generatedLink, setGeneratedLink] = useState<{
    url: string;
    qrDataUrl?: string | null;
    recipientName: string;
  } | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);

  const loadConfigStatus = useCallback(() => {
    void fetch("/api/config/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.email) setEmailConfig(d.email);
        if (typeof d.kakaoJsKey === "string") setKakaoJsKey(d.kakaoJsKey);
        setSmsApiConfigured(Boolean(d.smsApiConfigured));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadConfigStatus();
  }, [loadConfigStatus]);

  const initKakaoSdk = useCallback(() => {
    if (!kakaoJsKey || !window.Kakao) return;
    try {
      if (window.Kakao.isInitialized()) {
        window.Kakao.cleanup?.();
      }
      window.Kakao.init(kakaoJsKey);
      setKakaoReady(true);
    } catch {
      setKakaoReady(false);
    }
  }, [kakaoJsKey]);

  useEffect(() => {
    if (!kakaoJsKey || !window.Kakao) return;
    try {
      if (window.Kakao.isInitialized()) {
        window.Kakao.cleanup?.();
      }
      window.Kakao.init(kakaoJsKey);
    } catch {
      // ignore sdk init error
    }
  }, [kakaoJsKey]);

  const openSettings = (tab: "EMAIL" | "KAKAO" | "SMS" | "BASE") => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  const handleSettingsSaved = (s: PublicSettingsSummary) => {
    setKakaoJsKey(s.kakaoJsKey);
    setSmsApiConfigured(s.smsApiConfigured);
    setEmailConfig({
      configured: s.emailConfigured,
      provider: s.activeEmailMethod,
      fromLabel: s.smtpFrom || s.smtpUser || s.resendFrom || null,
    });
    loadConfigStatus();
  };

  const refreshCard = async () => {
    const res = await fetch(`/api/manage/${card.manageToken}`);
    if (res.ok) {
      const data = await res.json();
      setCard(data.card);
    }
  };

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleSendEmails = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setEmailResults([]);

    const validRows = emailRows.filter((r) => r.email.trim());
    if (validRows.length === 0) {
      setActionError("수신자 이메일을 최소 1개 입력해 주세요.");
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await fetch(`/api/manage/${card.manageToken}/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "EMAIL",
          recipients: validRows,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "이메일 발송 요청에 실패했습니다.");
        return;
      }

      setEmailResults(
        (data.results || []).map(
          (r: {
            delivery?: DeliveryRecord;
            recipientName?: string;
            email?: string;
            sent: boolean;
            provider?: string;
            error?: string;
            cardUrl?: string;
            previewHtml?: string;
          }) => ({
            recipientName:
              r.delivery?.recipientName || r.recipientName || "수신자",
            email: r.delivery?.targetAddress || r.email,
            sent: r.sent,
            provider: r.provider,
            error: r.error,
            cardUrl: r.cardUrl,
            previewHtml: r.previewHtml,
          })
        )
      );
      await refreshCard();
    } catch {
      setActionError("이메일 발송 중 네트워크 오류가 발생했습니다.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleKakaoShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    try {
      const res = await fetch(`/api/manage/${card.manageToken}/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "KAKAO",
          recipientName: kakaoRecipient.trim() || "소중한 분",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "카카오톡 공유 준비에 실패했습니다.");
        return;
      }

      setKakaoLastShare({
        cardUrl: data.cardUrl,
        recipientName: data.delivery.recipientName,
        deliveryId: data.delivery.id,
        qrDataUrl: data.qrDataUrl,
      });

      if (kakaoJsKey && window.Kakao?.isInitialized()) {
        window.Kakao.Share.sendDefault(data.kakaoPayload);
        await fetch(`/api/manage/${card.manageToken}/deliveries`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deliveryId: data.delivery.id,
            status: "SENT",
          }),
        });
      }

      await refreshCard();
    } catch {
      setActionError("카카오톡 공유 중 오류가 발생했습니다.");
    }
  };

  const handleSmsAction = async (sendDirect: boolean) => {
    setActionError(null);
    if (sendDirect && !smsPhone.trim()) {
      setActionError("PC에서 직접 문자를 발송하려면 받는 분 휴대폰 번호를 입력하세요.");
      return;
    }

    setIsSendingSms(true);
    try {
      const res = await fetch(`/api/manage/${card.manageToken}/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "SMS",
          recipientName: smsRecipient.trim() || "소중한 분",
          phone: smsPhone.trim(),
          sendDirect,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "SMS 처리에 실패했습니다.");
        return;
      }

      setSmsResult({
        deliveryId: data.delivery.id,
        smsUri: data.smsUri,
        smsText: data.smsText,
        smsLaunchUrl: data.smsLaunchUrl,
        cardUrl: data.cardUrl,
        recipientName: data.delivery.recipientName,
        qrDataUrl: data.qrDataUrl,
        sentViaApi: data.sentViaApi,
        sent: data.sent,
        error: data.error,
      });

      await refreshCard();
    } catch {
      setActionError("SMS 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      const res = await fetch(`/api/manage/${card.manageToken}/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "LINK",
          recipientName: linkRecipient.trim() || "소중한 분",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "링크 생성에 실패했습니다.");
        return;
      }
      setGeneratedLink({
        url: data.cardUrl,
        qrDataUrl: data.qrDataUrl,
        recipientName: data.delivery.recipientName,
      });
      await refreshCard();
    } catch {
      setActionError("링크 생성 중 오류가 발생했습니다.");
    }
  };

  const markDeliverySent = async (deliveryId: string) => {
    await fetch(`/api/manage/${card.manageToken}/deliveries`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryId, status: "SENT" }),
    });
    await refreshCard();
  };

  const publicCardUrl = `${origin}/c/${card.slug}`;
  const tpl = getTemplate(card.templateId);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12 space-y-8">
      {kakaoJsKey && (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          strategy="afterInteractive"
          onLoad={initKakaoSdk}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-800 mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            새 카드 만들기
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
              {tpl.name}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
              {card.title}
            </h1>
          </div>
          <p className="text-xs text-stone-500">
            From. {card.senderName} · 이 관리 페이지 URL을 북마크하면 언제든 열람 현황과 답장을 확인할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openSettings("EMAIL")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50 cursor-pointer"
          >
            <Settings className="h-3.5 w-3.5 text-red-800" />
            발송 설정
          </button>
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100 cursor-pointer"
          >
            <BookOpen className="h-3.5 w-3.5" />
            매뉴얼
          </button>
          <button
            type="button"
            onClick={() => copyText(publicCardUrl, "base-url")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100 cursor-pointer"
          >
            {copiedId === "base-url" ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            기본 링크
          </button>
          <Link
            href={`/c/${card.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            수신자 화면
          </Link>
        </div>
      </div>

      {/* Multi-channel Sender Card */}
      <section className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-stone-900 mb-4">
          카드 보내기 (이메일 · 카카오톡 · SMS · 개인화 링크)
        </h2>

        {/* Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
          {(
            [
              { id: "EMAIL", label: "이메일 발송", icon: Mail },
              { id: "KAKAO", label: "카카오톡 공유", icon: MessageCircle },
              { id: "SMS", label: "SMS 문자", icon: Smartphone },
              { id: "LINK", label: "개인화 링크", icon: Link2 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setActionError(null);
                }}
                className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition cursor-pointer ${
                  active
                    ? "border-red-700 bg-red-800 text-white shadow-sm"
                    : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {actionError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
            {actionError}
          </div>
        )}

        {/* EMAIL TAB */}
        {activeTab === "EMAIL" && (
          <div className="space-y-5">
            {emailConfig && !emailConfig.configured ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950">
                <div className="space-y-1">
                  <p className="font-bold">
                    이메일 계정이 아직 등록되지 않아 현재 미리보기 모드입니다
                  </p>
                  <p className="text-amber-900">
                    Gmail 앱 비밀번호, 네이버 메일 또는 Resend 키를 버튼으로 바로 등록해 실제 메일을 발송할 수 있습니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openSettings("EMAIL")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-900 px-3.5 py-2 font-bold text-white hover:bg-amber-950 shrink-0 cursor-pointer"
                >
                  <Settings className="h-3.5 w-3.5" />
                  이메일 설정하기
                </button>
              </div>
            ) : emailConfig?.configured ? (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
                <span>
                  <strong>실제 발송 준비됨</strong> ({emailConfig.provider.toUpperCase()} · {emailConfig.fromLabel})
                </span>
                <button
                  type="button"
                  onClick={() => openSettings("EMAIL")}
                  className="underline font-semibold cursor-pointer"
                >
                  설정 변경
                </button>
              </div>
            ) : null}

            <form onSubmit={handleSendEmails} className="space-y-3">
              {emailRows.map((row, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={row.recipientName}
                    onChange={(e) => {
                      const next = [...emailRows];
                      next[idx].recipientName = e.target.value;
                      setEmailRows(next);
                    }}
                    placeholder="받는 분 이름 (예: 김민수)"
                    className="sm:w-48 rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm"
                  />
                  <input
                    type="email"
                    value={row.email}
                    onChange={(e) => {
                      const next = [...emailRows];
                      next[idx].email = e.target.value;
                      setEmailRows(next);
                    }}
                    placeholder="이메일 주소 (예: friend@example.com)"
                    required
                    className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm"
                  />
                  {emailRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setEmailRows(emailRows.filter((_, i) => i !== idx))
                      }
                      className="inline-flex items-center justify-center rounded-xl border border-stone-200 px-3 py-2 text-stone-500 hover:bg-stone-100 cursor-pointer"
                      aria-label="행 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setEmailRows([
                      ...emailRows,
                      { recipientName: "", email: "" },
                    ])
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  수신자 추가
                </button>

                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-900 disabled:opacity-60 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {isSendingEmail ? "처리 중..." : "이메일 발송하기"}
                  </span>
                </button>
              </div>
            </form>

            {emailResults.length > 0 && (
              <div className="space-y-2 border-t border-stone-200 pt-4">
                <h3 className="text-xs font-bold text-stone-700">발송 결과</h3>
                {emailResults.map((res, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-stone-900">
                        {res.recipientName}
                      </span>{" "}
                      <span className="text-stone-500">({res.email})</span>
                      {res.sent ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> 발송 완료
                        </span>
                      ) : (
                        <p className="mt-1 text-amber-800 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{res.error}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {res.previewHtml && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewHtmlModal(res.previewHtml || null)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 font-medium text-stone-700 hover:bg-stone-100 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          메일 미리보기
                        </button>
                      )}
                      {res.cardUrl && (
                        <button
                          type="button"
                          onClick={() => copyText(res.cardUrl!, `res-${i}`)}
                          className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 font-medium text-stone-700 hover:bg-stone-100 cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          링크 복사
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* KAKAO TAB */}
        {activeTab === "KAKAO" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-yellow-200 bg-yellow-50/80 p-4 text-xs text-yellow-950">
              <div className="space-y-1">
                <p className="font-bold">
                  {kakaoJsKey
                    ? `카카오 JavaScript 키가 등록되어 있습니다 (${kakaoReady ? "SDK 준비됨" : "로딩 중"})`
                    : "카카오 키 없이도 문구+링크 복사로 보낼 수 있으며, 키를 등록하면 카드 썸네일 공유창이 열립니다"}
                </p>
                <p className="text-yellow-900">
                  {kakaoJsKey
                    ? "공유하기 버튼을 누르면 카카오톡 친구/채팅방 선택 창이 열립니다."
                    : "카카오 디벨로퍼스에서 발급한 JavaScript 키를 [카카오 키 등록] 버튼에 넣으면 원클릭 카톡 카드 공유가 활성화됩니다."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openSettings("KAKAO")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 font-bold text-white hover:bg-stone-800 shrink-0 cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" />
                {kakaoJsKey ? "카카오 키 변경" : "카카오 키 등록"}
              </button>
            </div>

            <form
              onSubmit={handleKakaoShare}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                value={kakaoRecipient}
                onChange={(e) => setKakaoRecipient(e.target.value)}
                placeholder="받는 분 이름 (카드에 'To. OOO님'으로 표시)"
                className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-5 py-2.5 text-sm font-bold text-[#191919] hover:bg-[#f5dc00] transition cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                <span>
                  {kakaoJsKey
                    ? "카카오톡으로 공유하기"
                    : "카톡 공유 문구 & QR 생성"}
                </span>
              </button>
            </form>

            {kakaoLastShare && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 flex flex-col sm:flex-row gap-4 text-xs">
                <div className="flex-1 space-y-3">
                  <p className="font-semibold text-stone-800">
                    {kakaoLastShare.recipientName}님 전용 카톡 공유 문구:
                  </p>
                  <div className="rounded-xl bg-white border border-stone-200 p-3 text-stone-700 whitespace-pre-wrap">
                    {`🎄 ${kakaoLastShare.recipientName}님, ${card.senderName}님이 크리스마스 카드를 보냈어요!\n"${card.title}"\n\n카드 열기: ${kakaoLastShare.cardUrl}`}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          `🎄 ${kakaoLastShare.recipientName}님, ${card.senderName}님이 크리스마스 카드를 보냈어요!\n"${card.title}"\n\n카드 열기: ${kakaoLastShare.cardUrl}`,
                          "kakao-copy"
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-3.5 py-2 font-semibold text-white hover:bg-stone-800 cursor-pointer"
                    >
                      {copiedId === "kakao-copy" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      카톡 전송용 문구 복사
                    </button>
                    <button
                      type="button"
                      onClick={() => markDeliverySent(kakaoLastShare.deliveryId)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      전송 완료 표시
                    </button>
                  </div>
                </div>
                {kakaoLastShare.qrDataUrl && (
                  <div className="flex flex-col items-center justify-center rounded-xl bg-white border border-stone-200 p-3 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={kakaoLastShare.qrDataUrl}
                      alt="카드 QR 코드"
                      className="h-28 w-28"
                    />
                    <span className="mt-1 text-[10px] text-stone-500">
                      폰으로 스캔해 카톡 공유
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SMS TAB */}
        {activeTab === "SMS" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-xs text-sky-950">
              <div className="space-y-1">
                <p className="font-bold">
                  {smsApiConfigured
                    ? "Solapi SMS API 연동 활성화됨 — PC에서 바로 문자 발송 가능"
                    : "PC에서는 QR 스캔(내 휴대폰으로 문자 앱 열기) 또는 Solapi API 설정으로 문자를 보낼 수 있습니다"}
                </p>
                <p className="text-sky-900">
                  {smsApiConfigured
                    ? "휴대폰 번호를 입력하고 [PC에서 바로 문자 발송]을 누르면 실제 SMS/LMS가 전송됩니다."
                    : "무료 QR 스캔 방식은 스마트폰 카메라로 QR을 찍어 내 폰의 문자 앱으로 바로 발송합니다. PC에서 직접 자동 발송하려면 Solapi API 키를 등록하세요."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openSettings("SMS")}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-900 px-3.5 py-2 font-bold text-white hover:bg-sky-950 shrink-0 cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" />
                {smsApiConfigured ? "SMS API 변경" : "Solapi SMS 설정"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={smsRecipient}
                onChange={(e) => setSmsRecipient(e.target.value)}
                placeholder="받는 분 이름 (예: 김철수)"
                className="rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm"
              />
              <input
                type="tel"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                placeholder="받는 분 휴대폰 번호 (예: 01012345678)"
                className="rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {smsApiConfigured && (
                <button
                  type="button"
                  disabled={isSendingSms}
                  onClick={() => handleSmsAction(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-900 disabled:opacity-60 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>
                    {isSendingSms ? "발송 중..." : "PC에서 바로 문자 발송 (API)"}
                  </span>
                </button>
              )}
              <button
                type="button"
                disabled={isSendingSms}
                onClick={() => handleSmsAction(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-60 cursor-pointer"
              >
                <QrCode className="h-4 w-4" />
                <span>스마트폰 QR · 문자 앱 링크 생성 (무료)</span>
              </button>
            </div>

            {smsResult && (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 flex flex-col sm:flex-row gap-4 text-xs">
                <div className="flex-1 space-y-3">
                  {smsResult.sentViaApi ? (
                    smsResult.sent ? (
                      <p className="font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        {smsResult.recipientName}님에게 SMS/LMS 문자를 발송했습니다!
                      </p>
                    ) : (
                      <p className="font-bold text-rose-700 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4" />
                        문자 발송 실패: {smsResult.error}
                      </p>
                    )
                  ) : (
                    <p className="font-semibold text-stone-800">
                      {smsResult.recipientName}님용 문자 메시지와 QR 코드가 준비되었습니다:
                    </p>
                  )}

                  <div className="rounded-xl bg-white border border-stone-200 p-3 text-stone-700 whitespace-pre-wrap">
                    {smsResult.smsText}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!smsResult.sentViaApi && (
                      <a
                        href={smsResult.smsUri}
                        onClick={() => markDeliverySent(smsResult.deliveryId)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800"
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                        문자 앱 열기 (모바일)
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => copyText(smsResult.smsText, "sms-copy")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                    >
                      {copiedId === "sms-copy" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      문자 내용 복사
                    </button>
                    {!smsResult.sentViaApi && (
                      <button
                        type="button"
                        onClick={() => markDeliverySent(smsResult.deliveryId)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        전송 완료 표시
                      </button>
                    )}
                  </div>
                </div>

                {smsResult.qrDataUrl && (
                  <div className="flex flex-col items-center justify-center rounded-xl bg-white border border-stone-200 p-3 shrink-0 max-w-[180px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={smsResult.qrDataUrl}
                      alt="SMS 발송 QR 코드"
                      className="h-32 w-32"
                    />
                    <span className="mt-1.5 text-[10px] font-medium text-stone-600 text-center">
                      폰 카메라로 스캔하면
                      <br />
                      문자 전송 화면이 열립니다
                    </span>
                    {smsResult.smsLaunchUrl && (
                      <span className="mt-1 text-[9px] font-mono text-stone-400 break-all text-center">
                        {smsResult.smsLaunchUrl}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* LINK TAB */}
        {activeTab === "LINK" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-700 space-y-1 leading-relaxed">
              <p className="font-bold text-stone-900">개인화 링크란?</p>
              <p>
                받는 분마다 고유 토큰(<code>?d=토큰</code>)이 포함된 전용 링크를 발급합니다. 수신자가 이 링크를 열면 카드에{" "}
                <strong>&quot;To. OOO님&quot;</strong> 호칭이 표시되고, 아래 <strong>발송 및 열람 현황</strong>에서 누가 몇 번 카드를 열어보았는지 확인할 수 있습니다.
              </p>
            </div>
            <form
              onSubmit={handleCreateLink}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                value={linkRecipient}
                onChange={(e) => setLinkRecipient(e.target.value)}
                placeholder="받는 분 이름 (예: 이지은)"
                className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-stone-800 cursor-pointer"
              >
                <Link2 className="h-4 w-4" />
                <span>전용 링크 생성</span>
              </button>
            </form>

            {generatedLink && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs">
                <div className="flex-1 min-w-0 space-y-2 w-full">
                  <p className="font-semibold text-stone-800">
                    {generatedLink.recipientName}님 전용 링크:
                  </p>
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-white border border-stone-200 px-3 py-2">
                    <span className="font-mono text-stone-700 break-all">
                      {generatedLink.url}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(generatedLink.url, "custom-link")
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-1.5 font-semibold text-white shrink-0 cursor-pointer"
                    >
                      {copiedId === "custom-link" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      복사
                    </button>
                  </div>
                </div>
                {generatedLink.qrDataUrl && (
                  <div className="flex flex-col items-center rounded-xl bg-white border border-stone-200 p-2.5 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={generatedLink.qrDataUrl}
                      alt="개인화 링크 QR"
                      className="h-24 w-24"
                    />
                    <span className="mt-1 text-[10px] text-stone-500">
                      모바일 열기 QR
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Delivery History & Replies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-stone-900 mb-3">
            발송 및 열람 현황 ({card.deliveries.length})
          </h2>
          {card.deliveries.length === 0 ? (
            <p className="text-xs text-stone-500 py-6 text-center">
              아직 발송 내역이 없습니다. 위에서 메일, 카카오톡, SMS로 카드를 보내보세요!
            </p>
          ) : (
            <ul className="space-y-2.5">
              {card.deliveries.map((d) => {
                const personalUrl = `${origin}/c/${card.slug}?d=${d.token}`;
                return (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-stone-200 px-1.5 py-0.5 text-[10px] font-bold text-stone-700">
                          {d.channel}
                        </span>
                        <span className="font-semibold text-stone-900 truncate">
                          {d.recipientName}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            d.status === "SENT"
                              ? "bg-emerald-100 text-emerald-800"
                              : d.status === "FAILED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {d.status === "SENT"
                            ? "전송됨"
                            : d.status === "PREVIEW"
                              ? "미리보기"
                              : d.status === "FAILED"
                                ? "실패"
                                : "준비됨"}
                        </span>
                      </div>
                      <p className="text-stone-500 mt-1 truncate">
                        {d.targetAddress || "개인화 링크"} ·{" "}
                        {d.openCount > 0
                          ? `열람 ${d.openCount}회`
                          : "아직 미열람"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(personalUrl, d.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 font-medium text-stone-700 hover:bg-stone-100 shrink-0 cursor-pointer"
                    >
                      {copiedId === d.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      링크
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-stone-900 mb-3">
            받은 답장 ({card.replies.length})
          </h2>
          {card.replies.length === 0 ? (
            <p className="text-xs text-stone-500 py-6 text-center">
              수신자가 카드를 열고 답장을 남기면 이곳에 표시됩니다.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {card.replies.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50/70 px-4 py-3 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-stone-900">
                      {r.emoji} {r.authorName}
                    </span>
                    <span className="text-stone-400">
                      {new Date(r.createdAt).toLocaleString("ko-KR")}
                    </span>
                  </div>
                  <p className="text-stone-700 leading-relaxed">{r.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Email HTML Preview Modal */}
      {previewHtmlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3.5">
              <span className="text-sm font-bold text-stone-900">
                이메일 렌더링 미리보기
              </span>
              <button
                type="button"
                onClick={() => setPreviewHtmlModal(null)}
                className="rounded-lg bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-200 cursor-pointer"
              >
                닫기
              </button>
            </div>
            <iframe
              title="이메일 미리보기"
              srcDoc={previewHtmlModal}
              className="h-[520px] w-full border-0"
            />
          </div>
        </div>
      )}

      {settingsOpen && (
        <SettingsModal
          key={settingsTab}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onSaved={handleSettingsSaved}
          initialTab={settingsTab}
        />
      )}
      <ManualModal open={manualOpen} onClose={() => setManualOpen(false)} />
    </div>
  );
}
