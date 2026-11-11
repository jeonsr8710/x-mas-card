"use client";

import Link from "next/link";
import { Smartphone, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";

export function SmsLaunchClient(props: {
  deliveryId: string;
  manageToken: string | null;
  recipientName: string;
  phone: string | null;
  smsUri: string;
  smsText: string;
  cardUrl: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleOpenSmsApp = () => {
    if (!props.manageToken) return;
    void fetch(`/api/manage/${props.manageToken}/deliveries`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryId: props.deliveryId, status: "SENT" }),
    }).catch(() => {});
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(props.smsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#faf7f2] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-xl space-y-5">
        <div className="text-center space-y-1">
          <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
            모바일 SMS 전송 도우미
          </span>
          <h1 className="text-xl font-bold text-stone-900 pt-1">
            {props.recipientName}님께 문자 보내기
          </h1>
          {props.phone && (
            <p className="text-xs text-stone-500">받는 번호: {props.phone}</p>
          )}
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-700 whitespace-pre-wrap leading-relaxed">
          {props.smsText}
        </div>

        <div className="space-y-2.5">
          <a
            href={props.smsUri}
            onClick={handleOpenSmsApp}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-800 transition"
          >
            <Smartphone className="h-5 w-5" />
            휴대폰 문자 앱 열기
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50 transition cursor-pointer"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "복사 완료!" : "문자 내용 복사하기"}
          </button>

          <Link
            href={props.cardUrl}
            className="flex w-full items-center justify-center gap-1.5 pt-2 text-xs font-medium text-stone-500 hover:text-stone-900"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            카드 화면 미리보기
          </Link>
        </div>
      </div>
    </main>
  );
}
