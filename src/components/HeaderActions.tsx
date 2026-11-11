"use client";

import { useState } from "react";
import { Settings, BookOpen } from "lucide-react";
import { SettingsModal } from "./SettingsModal";
import { ManualModal } from "./ManualModal";

export function HeaderActions() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white border border-white/25 hover:bg-white/25 transition cursor-pointer"
        >
          <Settings className="h-3.5 w-3.5 text-amber-300" />
          발송 설정 (이메일 · 카톡 · SMS)
        </button>
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-4 py-2 text-xs font-bold text-stone-900 hover:bg-amber-200 transition cursor-pointer"
        >
          <BookOpen className="h-3.5 w-3.5" />
          사용 매뉴얼
        </button>
      </div>

      {settingsOpen && (
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      )}
      <ManualModal open={manualOpen} onClose={() => setManualOpen(false)} />
    </>
  );
}
