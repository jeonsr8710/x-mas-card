import { Suspense } from "react";
import { connection } from "next/server";
import { Sparkles, Mail, MessageCircle, Smartphone, MailOpen } from "lucide-react";
import { CardEditor } from "@/components/CardEditor";
import { HeaderActions } from "@/components/HeaderActions";
import { isPublicViewerOnly } from "@/lib/mode";

async function HomeContent() {
  await connection();

  if (isPublicViewerOnly()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#132a1e] via-[#1b3a29] to-[#4a1219] px-4 text-center text-white">
        <div className="max-w-md rounded-3xl border border-white/20 bg-black/30 p-8 backdrop-blur-md shadow-2xl space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-300 text-stone-900 shadow-lg">
            <MailOpen className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            X-mas Card Viewer
          </h1>
          <p className="text-sm text-white/80 leading-relaxed">
            이 페이지는 온라인 크리스마스 카드 <strong>열람 전용 사이트</strong>입니다.
            <br />
            이메일, 카카오톡, 문자로 전달받으신 <strong>전용 카드 링크</strong>를 클릭해 카드를 열어보세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Festive Hero Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#132a1e] via-[#1b3a29] to-[#4a1219] text-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold text-amber-200 border border-white/20">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            2026 Holiday Card Studio
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            마음을 전하는 온라인 크리스마스 카드
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-white/80 leading-relaxed mb-6">
            별도 회원가입 없이 눈 내리는 인터랙티브 카드를 만들고,{" "}
            <strong className="text-amber-200">이메일 · 카카오톡 · SMS</strong>로 소중한 분들에게 바로 전해 보세요.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-white/90 mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 border border-white/15">
              <Mail className="h-3.5 w-3.5 text-amber-300" />
              HTML 이메일 발송
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 border border-white/15">
              <MessageCircle className="h-3.5 w-3.5 text-yellow-300" />
              카카오톡 공유
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 border border-white/15">
              <Smartphone className="h-3.5 w-3.5 text-sky-300" />
              모바일 · API SMS 문자
            </span>
          </div>

          <HeaderActions />
        </div>
      </header>

      <main className="flex-1">
        <CardEditor />
      </main>

      <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500">
        X-mas Card Studio · 따뜻한 연말 인사 나누기
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#faf7f2] text-stone-500 text-sm">
          불러오는 중...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
