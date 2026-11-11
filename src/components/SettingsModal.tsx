"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  X,
  Mail,
  MessageCircle,
  Smartphone,
  Globe,
  CheckCircle2,
  Send,
} from "lucide-react";
import type { PublicSettingsSummary } from "@/lib/settings";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: (settings: PublicSettingsSummary) => void;
  initialTab?: "EMAIL" | "KAKAO" | "SMS" | "BASE";
}

export function SettingsModal({
  open,
  onClose,
  onSaved,
  initialTab = "EMAIL",
}: SettingsModalProps) {
  const [tab, setTab] = useState<"EMAIL" | "KAKAO" | "SMS" | "BASE">(
    initialTab
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [emailProvider, setEmailProvider] = useState<"smtp" | "resend">("smtp");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [hasSmtpPass, setHasSmtpPass] = useState(false);
  const [smtpFrom, setSmtpFrom] = useState("");

  const [resendApiKey, setResendApiKey] = useState("");
  const [hasResendApiKey, setHasResendApiKey] = useState(false);
  const [resendFrom, setResendFrom] = useState("");

  const [kakaoJsKey, setKakaoJsKey] = useState("");

  const [solapiApiKey, setSolapiApiKey] = useState("");
  const [solapiApiSecret, setSolapiApiSecret] = useState("");
  const [hasSolapiSecret, setHasSolapiSecret] = useState(false);
  const [solapiSenderPhone, setSolapiSenderPhone] = useState("");

  const [baseUrl, setBaseUrl] = useState("");
  const [detectedLanUrl, setDetectedLanUrl] = useState<string | null>(null);

  const [testEmail, setTestEmail] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    void Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/config/status").then((r) => r.json()),
    ])
      .then(([d, status]: [{ settings?: PublicSettingsSummary }, { lanUrl?: string | null }]) => {
        if (!active) return;
        if (status?.lanUrl) setDetectedLanUrl(status.lanUrl);
        if (!d.settings) return;
        const s = d.settings;
        setEmailProvider(s.emailProvider);
        setSmtpHost(s.smtpHost);
        setSmtpPort(s.smtpPort || "587");
        setSmtpSecure(s.smtpSecure);
        setSmtpUser(s.smtpUser);
        setHasSmtpPass(s.hasSmtpPass);
        setSmtpPass("");
        setSmtpFrom(s.smtpFrom);
        setHasResendApiKey(s.hasResendApiKey);
        setResendApiKey("");
        setResendFrom(s.resendFrom);
        setKakaoJsKey(s.kakaoJsKey);
        setSolapiApiKey(s.solapiApiKey);
        setHasSolapiSecret(s.hasSolapiApiSecret);
        setSolapiApiSecret("");
        setSolapiSenderPhone(s.solapiSenderPhone);
        setBaseUrl(s.baseUrl);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  if (!open) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl,
          kakaoJsKey,
          emailProvider,
          smtpHost,
          smtpPort,
          smtpSecure,
          smtpUser,
          ...(smtpPass ? { smtpPass } : {}),
          smtpFrom,
          ...(resendApiKey ? { resendApiKey } : {}),
          resendFrom,
          solapiApiKey,
          ...(solapiApiSecret ? { solapiApiSecret } : {}),
          solapiSenderPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "err",
          text: data.error || "설정 저장에 실패했습니다.",
        });
        return;
      }
      setHasSmtpPass(data.settings.hasSmtpPass);
      setHasResendApiKey(data.settings.hasResendApiKey);
      setHasSolapiSecret(data.settings.hasSolapiApiSecret);
      setSmtpPass("");
      setResendApiKey("");
      setSolapiApiSecret("");
      setFeedback({ type: "ok", text: "설정이 저장되었습니다!" });
      onSaved?.(data.settings);
    } catch {
      setFeedback({
        type: "err",
        text: "서버에 연결할 수 없습니다. 바탕화면의 '크리스마스 카드' 아이콘으로 서버를 실행한 뒤 다시 시도하세요.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      setFeedback({
        type: "err",
        text: "테스트 메일을 받을 이메일 주소를 입력하세요.",
      });
      return;
    }
    setTestingEmail(true);
    setFeedback(null);
    try {
      // Save current form values first so users can test immediately without a separate Save click
      const saveRes = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl,
          kakaoJsKey,
          emailProvider,
          smtpHost,
          smtpPort,
          smtpSecure,
          smtpUser,
          ...(smtpPass ? { smtpPass } : {}),
          smtpFrom,
          ...(resendApiKey ? { resendApiKey } : {}),
          resendFrom,
          solapiApiKey,
          ...(solapiApiSecret ? { solapiApiSecret } : {}),
          solapiSenderPhone,
        }),
      });
      if (saveRes.ok) {
        const saveData = await saveRes.json();
        if (saveData.settings) {
          setHasSmtpPass(saveData.settings.hasSmtpPass);
          setHasResendApiKey(saveData.settings.hasResendApiKey);
          setHasSolapiSecret(saveData.settings.hasSolapiApiSecret);
          onSaved?.(saveData.settings);
        }
      }

      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test-email", testEmail }),
      });
      const data = await res.json();
      if (data.sent) {
        setFeedback({
          type: "ok",
          text: `${testEmail} 주소로 테스트 메일을 성공적으로 발송했습니다!`,
        });
      } else {
        setFeedback({
          type: "err",
          text:
            data.error ||
            "테스트 발송에 실패했습니다. 입력한 SMTP/Resend 정보를 확인하세요.",
        });
      }
    } catch {
      setFeedback({
        type: "err",
        text: "서버에 연결할 수 없습니다. 바탕화면의 '크리스마스 카드' 아이콘으로 서버를 실행한 뒤 다시 시도하세요.",
      });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-red-800" />
            <h2 className="text-base font-bold text-stone-900">
              발송 채널 환경 설정
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 cursor-pointer"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 border-b border-stone-200 bg-stone-50 text-xs font-semibold">
          {(
            [
              { id: "EMAIL", label: "이메일", icon: Mail },
              { id: "KAKAO", label: "카카오톡", icon: MessageCircle },
              { id: "SMS", label: "SMS 문자", icon: Smartphone },
              { id: "BASE", label: "공유 주소", icon: Globe },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-1.5 py-3 border-b-2 transition cursor-pointer ${
                  tab === t.id
                    ? "border-red-800 bg-white text-red-800"
                    : "border-transparent text-stone-500 hover:text-stone-800"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-5">
          {loading ? (
            <p className="text-xs text-stone-500 py-8 text-center">
              설정을 불러오는 중...
            </p>
          ) : (
            <>
              {tab === "EMAIL" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEmailProvider("smtp")}
                      className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold cursor-pointer ${
                        emailProvider === "smtp"
                          ? "border-red-800 bg-red-50 text-red-900"
                          : "border-stone-200 text-stone-600"
                      }`}
                    >
                      SMTP (Gmail / 네이버 / 다음)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEmailProvider("resend")}
                      className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold cursor-pointer ${
                        emailProvider === "resend"
                          ? "border-red-800 bg-red-50 text-red-900"
                          : "border-stone-200 text-stone-600"
                      }`}
                    >
                      Resend API
                    </button>
                  </div>

                  {emailProvider === "smtp" ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSmtpHost("smtp.gmail.com");
                            setSmtpPort("587");
                            setSmtpSecure(false);
                          }}
                          className="rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1 text-[11px] font-medium hover:bg-stone-100 cursor-pointer"
                        >
                          Gmail 자동 채우기
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSmtpHost("smtp.naver.com");
                            setSmtpPort("465");
                            setSmtpSecure(true);
                          }}
                          className="rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1 text-[11px] font-medium hover:bg-stone-100 cursor-pointer"
                        >
                          네이버 메일 자동 채우기
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSmtpHost("smtp.daum.net");
                            setSmtpPort("465");
                            setSmtpSecure(true);
                          }}
                          className="rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1 text-[11px] font-medium hover:bg-stone-100 cursor-pointer"
                        >
                          다음 메일 자동 채우기
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            SMTP 호스트
                          </label>
                          <input
                            type="text"
                            value={smtpHost}
                            onChange={(e) => setSmtpHost(e.target.value)}
                            placeholder="smtp.gmail.com"
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            포트
                          </label>
                          <input
                            type="text"
                            value={smtpPort}
                            onChange={(e) => setSmtpPort(e.target.value)}
                            placeholder="587"
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            계정 이메일 (ID)
                          </label>
                          <input
                            type="text"
                            value={smtpUser}
                            onChange={(e) => setSmtpUser(e.target.value)}
                            placeholder="myname@gmail.com"
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            앱 비밀번호 {hasSmtpPass && "(등록됨)"}
                          </label>
                          <input
                            type="password"
                            value={smtpPass}
                            onChange={(e) => setSmtpPass(e.target.value)}
                            placeholder={
                              hasSmtpPass
                                ? "변경할 경우에만 새로 입력"
                                : "16자리 앱 비밀번호 입력"
                            }
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">
                            보내는 사람 표시 (선택)
                          </label>
                          <input
                            type="text"
                            value={smtpFrom}
                            onChange={(e) => setSmtpFrom(e.target.value)}
                            placeholder="홍길동 (이름만 입력해도 자동 적용)"
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-xs text-stone-700 pt-4 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={smtpSecure}
                            onChange={(e) => setSmtpSecure(e.target.checked)}
                          />
                          SSL/TLS 보안 연결 사용 (포트 465일 때 체크)
                        </label>
                      </div>

                      <div className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-[11px] text-stone-600 leading-relaxed space-y-1">
                        <p>
                          <strong>Gmail 사용 팁:</strong> Google 계정 → 보안 → 2단계 인증 활성화 후 <strong>앱 비밀번호</strong>(16자리)를 생성해 비밀번호 칸에 입력하세요.
                        </p>
                        <p>
                          <strong>네이버 메일 사용 팁:</strong> (1) 네이버 메일 하단 <strong>환경설정 → POP3/IMAP 설정 → IMAP/SMTP 사용함</strong>으로 저장 필수 (2) 네이버 2단계 인증 사용 시 일반 비밀번호가 아닌 <strong>네이버 보안설정 → 애플리케이션 비밀번호</strong>를 발급해 입력해야 합니다.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Resend API Key {hasResendApiKey && "(등록됨)"}
                        </label>
                        <input
                          type="password"
                          value={resendApiKey}
                          onChange={(e) => setResendApiKey(e.target.value)}
                          placeholder={
                            hasResendApiKey
                              ? "변경할 경우에만 새 키 입력"
                              : "re_..."
                          }
                          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          발신자 주소 (Resend 인증 도메인)
                        </label>
                        <input
                          type="text"
                          value={resendFrom}
                          onChange={(e) => setResendFrom(e.target.value)}
                          placeholder="X-mas <onboarding@resend.dev>"
                          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Quick Test Email */}
                  <div className="border-t border-stone-200 pt-4">
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      설정 저장 후 테스트 메일 발송해 보기
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="테스트 받을 내 이메일 주소"
                        className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleTestEmail}
                        disabled={testingEmail}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-60 cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {testingEmail ? "발송 중..." : "테스트 발송"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {tab === "KAKAO" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      카카오 JavaScript 키
                    </label>
                    <input
                      type="text"
                      value={kakaoJsKey}
                      onChange={(e) => setKakaoJsKey(e.target.value)}
                      placeholder="예: 1a2b3c4d5e6f..."
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs font-mono"
                    />
                  </div>
                  <div className="rounded-2xl border border-yellow-200 bg-yellow-50/80 p-4 text-xs text-yellow-950 space-y-2 leading-relaxed">
                    <p className="font-bold">카카오 JavaScript 키 발급 순서 (무료)</p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>
                        <a
                          href="https://developers.kakao.com"
                          target="_blank"
                          rel="noreferrer"
                          className="underline font-semibold"
                        >
                          카카오 디벨로퍼스
                        </a>
                        에 카카오 계정으로 로그인 후 <strong>[내 애플리케이션] → [애플리케이션 추가하기]</strong>
                      </li>
                      <li>
                        생성된 앱의 <strong>[앱 키]</strong> 메뉴에서 <strong>JavaScript 키</strong>를 복사해 위 입력창에 붙여넣기
                      </li>
                      <li>
                        <strong>[플랫폼] → [Web 플랫폼 등록]</strong>에 접속 주소(예: <code>http://localhost:3000</code> 또는 실제 도메인) 등록
                      </li>
                      <li>
                        <strong>[카카오톡 공유]</strong> 기능이 활성화되면 카드 발송 시 썸네일과 버튼이 포함된 카톡 피드 창이 열립니다.
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {tab === "SMS" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-xs text-sky-950 leading-relaxed space-y-1">
                    <p className="font-bold">PC에서 실제 SMS/LMS 문자 직접 발송하기 (Solapi 연동)</p>
                    <p>
                      휴대폰의 기본 문자 앱(<code>sms:</code>)은 스마트폰에서만 바로 열립니다. PC 웹에서 상대방 휴대폰으로 바로 문자를 보내려면 국내 문자 중계사(<strong>Solapi</strong>)의 API 키와 사전 등록된 발신번호를 입력하세요. (미등록 시에도 QR 코드 스캔 및 문자 내용 복사 사용 가능)
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Solapi API Key
                    </label>
                    <input
                      type="text"
                      value={solapiApiKey}
                      onChange={(e) => setSolapiApiKey(e.target.value)}
                      placeholder="NCS..."
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Solapi API Secret {hasSolapiSecret && "(등록됨)"}
                    </label>
                    <input
                      type="password"
                      value={solapiApiSecret}
                      onChange={(e) => setSolapiApiSecret(e.target.value)}
                      placeholder={
                        hasSolapiSecret
                          ? "변경할 경우에만 새 Secret 입력"
                          : "API Secret 입력"
                      }
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      사전 등록된 발신번호 (숫자만)
                    </label>
                    <input
                      type="tel"
                      value={solapiSenderPhone}
                      onChange={(e) => setSolapiSenderPhone(e.target.value)}
                      placeholder="01012345678"
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {tab === "BASE" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      카드 외부 공유 기본 URL (비워두면 같은 Wi-Fi LAN IP 자동 사용)
                    </label>
                    <input
                      type="url"
                      value={baseUrl}
                      onChange={(e) => setBaseUrl(e.target.value)}
                      placeholder={
                        detectedLanUrl || "https://my-xmas-card.example.com"
                      }
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs font-mono"
                    />
                    {detectedLanUrl && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setBaseUrl(detectedLanUrl)}
                          className="rounded-lg border border-stone-300 bg-stone-50 px-2.5 py-1 text-[11px] font-medium hover:bg-stone-100 cursor-pointer"
                        >
                          같은 Wi-Fi 주소 채우기 ({detectedLanUrl})
                        </button>
                        {baseUrl && (
                          <button
                            type="button"
                            onClick={() => setBaseUrl("")}
                            className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600 hover:bg-stone-50 cursor-pointer"
                          >
                            자동 감지 사용(비우기)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-700 leading-relaxed space-y-1.5">
                    <p className="font-bold">모바일 QR 및 외부 지인 공유 안내</p>
                    <p>
                      • <strong>같은 Wi-Fi 내 스마트폰 테스트:</strong> 비워두면 자동으로 내 PC의 Wi-Fi 주소(<code>{detectedLanUrl || "192.168.x.x"}</code>)가 QR에 사용됩니다. (연결이 차단되면 PC 방화벽에서 <code>3000</code> 포트를 허용해 주세요.)
                    </p>
                    <p>
                      • <strong>외부 지인에게 보내기:</strong> Vercel 배포 또는 Cloudflare Tunnel / ngrok으로 공인 <code>https://...</code> 주소를 연결한 뒤 여기에 등록해 주세요.
                    </p>
                  </div>
                </div>
              )}

              {feedback && (
                <div
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-medium ${
                    feedback.type === "ok"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  {feedback.type === "ok" && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-stone-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
            >
              닫기
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-red-800 px-5 py-2 text-xs font-bold text-white hover:bg-red-900 disabled:opacity-60 cursor-pointer"
            >
              {saving ? "저장 중..." : "설정 저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
