"use client";

import { BookOpen, X } from "lucide-react";

export function ManualModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-red-800" />
            <h2 className="text-base font-bold text-stone-900">
              크리스마스 카드 보내기 세부 매뉴얼
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

        <div className="overflow-y-auto p-6 space-y-6 text-xs sm:text-sm text-stone-700 leading-relaxed">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-stone-900">
              1. 이메일 발송 방법 (설정 버튼으로 간편 등록)
            </h3>
            <p>
              <code>.env</code> 파일을 직접 수정할 필요 없이 화면 상단의{" "}
              <strong>[발송 설정]</strong> 버튼을 눌러 Gmail·네이버 메일·Resend 정보를 바로 저장할 수 있습니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li>
                <strong>Gmail 예시:</strong> [발송 설정] → [Gmail 자동 채우기] 클릭 → 본인 Gmail 주소와 Google 계정에서 발급한 <strong>16자리 앱 비밀번호</strong> 입력 후 저장
              </li>
              <li>
                <strong>테스트 발송:</strong> 설정 창 하단에서 내 메일 주소로 [테스트 발송]을 눌러 정상 수신을 확인하세요.
              </li>
              <li>
                <strong>미설정 시:</strong> 메일이 실제로 전송되지 않고 HTML 카드 메일 미리보기만 생성됩니다.
              </li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-stone-200 pt-5">
            <h3 className="text-base font-bold text-stone-900">
              2. 카카오톡 공유 방법 (키 등록 vs 키 없을 때)
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li>
                <strong>JavaScript 키 등록 방법:</strong>{" "}
                <a
                  href="https://developers.kakao.com"
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-red-800 font-semibold"
                >
                  카카오 디벨로퍼스
                </a>
                에서 앱 생성 → [앱 키]의 <strong>JavaScript 키</strong> 복사 → 프로그램 상단 [발송 설정] → [카카오톡] 탭에 입력 → [플랫폼 → Web]에 접속 도메인 등록
              </li>
              <li>
                <strong>키를 등록한 경우:</strong> [카카오톡으로 공유하기] 버튼 클릭 시 카드 썸네일 이미지와 &quot;크리스마스 카드 열어보기&quot; 버튼이 포함된 카톡 피드 전송 창이 열립니다.
              </li>
              <li>
                <strong>키가 없는 경우:</strong> 카톡 API 창 대신 <strong>&quot;카톡용 문구 + 개인화 링크&quot;</strong>가 생성되며, [복사] 버튼으로 PC/모바일 카카오톡 채팅방에 바로 붙여넣어 보낼 수 있습니다. (단, <code>localhost</code>가 아닌 외부 접속 주소여야 카톡에서 미리보기 썸네일이 뜹니다.)
              </li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-stone-200 pt-5">
            <h3 className="text-base font-bold text-stone-900">
              3. SMS 문자 발송 방법 (PC 직접 발송 vs QR 스캔)
            </h3>
            <p>
              PC 브라우저에서는 휴대폰 기본 문자 앱(<code>sms:</code>)이 바로 열리지 않기 때문에 두 가지 방식을 모두 제공합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li>
                <strong>방법 A — PC에서 바로 실제 문자 발송 (Solapi API):</strong>{" "}
                [발송 설정] → [SMS 문자] 탭에 <strong>Solapi API Key, Secret, 사전 등록된 발신번호</strong>를 입력하면 PC에서 버튼 한 번으로 상대방 휴대폰에 실제 SMS/LMS 문자가 즉시 발송됩니다. (문자 중계사 건당 요금 발생)
              </li>
              <li>
                <strong>방법 B — 무료 QR 코드 스캔 / 모바일 전송:</strong> API 키가 없어도 SMS 준비 버튼을 누르면 <strong>QR 코드</strong>가 화면에 생성됩니다. 내 스마트폰 카메라로 QR을 비추면 휴대폰 문자 앱이 수신번호와 카드 문구가 채워진 상태로 바로 열려 무료로 전송할 수 있습니다.
              </li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-stone-200 pt-5">
            <h3 className="text-base font-bold text-stone-900">
              4. 개인화 링크의 작동 원리
            </h3>
            <p>
              같은 카드를 여러 명에게 보낼 때 각 수신자마다 고유 토큰이 붙은 주소(예:{" "}
              <code>/c/카드ID?d=수신자토큰</code>)가 생성됩니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li>
                <strong>맞춤 호칭 표시:</strong> 받는 분이 해당 링크로 접속하면 카드 봉투와 속지 상단에 <code>To. 김민수님</code>처럼 본인 이름이 자동으로 표시됩니다.
              </li>
              <li>
                <strong>열람 추적:</strong> 받는 분이 봉투를 열어 카드를 확인하는 순간 서버에 열람 기록이 남아, 발송 관리 화면에서 <strong>누가 몇 번 열람했는지</strong> 확인할 수 있습니다.
              </li>
              <li>
                이메일·카카오톡·SMS 탭에서 발송할 때도 자동으로 수신자별 개인화 링크가 만들어져 포함됩니다.
              </li>
            </ul>
          </section>

          <section className="space-y-2 border-t border-stone-200 pt-5">
            <h3 className="text-base font-bold text-stone-900">
              5. 이미지 첨부 & 외부 공유 시 주의사항
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li>
                카드 제작 화면에서 프로젝트 내 <code>public/samples</code> 폴더의 기본 크리스마스 샘플 이미지를 선택하거나, 내 PC의 사진을 직접 첨부할 수 있습니다.
              </li>
              <li>
                <strong>외부 지인에게 보내기:</strong> 내 PC의 <code>http://localhost:3000</code> 주소는 내 컴퓨터에서만 열립니다. 다른 사람에게 보낼 때는 Vercel 배포 또는 터널링(ngrok/Cloudflare Tunnel) 주소를 <strong>[발송 설정 → 공유 주소]</strong>에 등록해 주세요.
              </li>
            </ul>
          </section>
        </div>

        <div className="border-t border-stone-200 px-6 py-3.5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-stone-900 px-5 py-2 text-xs font-bold text-white hover:bg-stone-800 cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
