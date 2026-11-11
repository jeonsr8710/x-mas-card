export type TemplateId =
  | "classic-tree"
  | "snowy-night"
  | "cozy-cabin"
  | "minimal-gold";

export type BgmKey = "jingle-bells" | "silent-night" | "we-wish" | "none";

export interface CardTemplate {
  id: TemplateId;
  name: string;
  subtitle: string;
  badge: string;
  envelopeBg: string;
  envelopeFlap: string;
  envelopeAccent: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  snowColor: string;
  ogBg: string;
  ogAccent: string;
  motif: "tree" | "stars" | "cabin" | "wreath";
}

export const CARD_TEMPLATES: Record<TemplateId, CardTemplate> = {
  "classic-tree": {
    id: "classic-tree",
    name: "클래식 홀리데이",
    subtitle: "붉은 벨벳 봉투와 반짝이는 크리스마스 트리",
    badge: "인기",
    envelopeBg: "from-red-900 via-red-800 to-rose-950",
    envelopeFlap: "#7f1d1d",
    envelopeAccent: "#fbbf24",
    cardBg: "from-[#173628] via-[#0f291e] to-[#0a1d15]",
    cardBorder: "border-amber-400/40",
    textColor: "text-amber-50",
    mutedColor: "text-emerald-200/80",
    accentColor: "#fbbf24",
    snowColor: "rgba(255, 250, 235, 0.85)",
    ogBg: "#123023",
    ogAccent: "#fbbf24",
    motif: "tree",
  },
  "snowy-night": {
    id: "snowy-night",
    name: "고요한 눈 내리는 밤",
    subtitle: "깊은 겨울 밤하늘과 은빛 별빛",
    badge: "감성",
    envelopeBg: "from-slate-900 via-indigo-950 to-slate-950",
    envelopeFlap: "#1e1b4b",
    envelopeAccent: "#93c5fd",
    cardBg: "from-[#0f172a] via-[#172554] to-[#090d1a]",
    cardBorder: "border-sky-300/35",
    textColor: "text-sky-50",
    mutedColor: "text-sky-200/80",
    accentColor: "#93c5fd",
    snowColor: "rgba(224, 242, 254, 0.9)",
    ogBg: "#111c3a",
    ogAccent: "#93c5fd",
    motif: "stars",
  },
  "cozy-cabin": {
    id: "cozy-cabin",
    name: "따뜻한 겨울 오두막",
    subtitle: "벽난로 온기를 담은 포근한 크림 레터",
    badge: "따뜻함",
    envelopeBg: "from-amber-900 via-stone-800 to-amber-950",
    envelopeFlap: "#78350f",
    envelopeAccent: "#fcd34d",
    cardBg: "from-[#fffbeb] via-[#fef3c7] to-[#fde68a]/40",
    cardBorder: "border-amber-700/25",
    textColor: "text-stone-900",
    mutedColor: "text-stone-600",
    accentColor: "#b45309",
    snowColor: "rgba(255, 255, 255, 0.8)",
    ogBg: "#fef3c7",
    ogAccent: "#b45309",
    motif: "cabin",
  },
  "minimal-gold": {
    id: "minimal-gold",
    name: "미니멀 골드 리스",
    subtitle: "단정하고 고급스러운 아이보리 & 샴페인 골드",
    badge: "모던",
    envelopeBg: "from-stone-800 via-neutral-900 to-stone-950",
    envelopeFlap: "#292524",
    envelopeAccent: "#e7c980",
    cardBg: "from-[#fafaf9] via-[#f5f5f4] to-[#ece7de]",
    cardBorder: "border-amber-600/30",
    textColor: "text-stone-900",
    mutedColor: "text-stone-500",
    accentColor: "#a16207",
    snowColor: "rgba(217, 179, 108, 0.55)",
    ogBg: "#f5f2eb",
    ogAccent: "#a16207",
    motif: "wreath",
  },
};

export const TEMPLATE_LIST: CardTemplate[] = Object.values(CARD_TEMPLATES);

export interface MessagePreset {
  category: string;
  title: string;
  message: string;
}

export const MESSAGE_PRESETS: MessagePreset[] = [
  {
    category: "친구 · 지인",
    title: "Merry Christmas! 따뜻한 연말 보내세요",
    message:
      "올 한 해도 덕분에 참 많이 웃고 힘낼 수 있었어요.\n다가오는 크리스마스에는 사랑하는 사람들과 포근하고 행복한 시간 보내고, 새해에도 좋은 일만 가득하길 바랄게요!",
  },
  {
    category: "가족 · 연인",
    title: "올겨울 가장 따뜻한 마음을 전해요",
    message:
      "바쁜 일상 속에서도 언제나 곁에서 든든한 버팀목이 되어주어 고마워요.\n하얀 눈처럼 포근하고 반짝이는 크리스마스 함께 보내고, 내년에도 건강하고 행복하자!",
  },
  {
    category: "직장 · 비즈니스",
    title: "한 해 동안 감사했습니다. 행복한 성탄절 되세요",
    message:
      "올 한 해 함께해 주시고 많은 도움을 주셔서 진심으로 감사드립니다.\n연말연시 따뜻하고 평안한 휴식 보내시길 바라며, 다가오는 새해에도 건승과 행복이 가득하시기를 기원합니다.",
  },
];

export const BGM_OPTIONS: { key: BgmKey; label: string; description: string }[] = [
  { key: "jingle-bells", label: "징글벨 (오르골)", description: "경쾌한 크리스마스 캐롤" },
  { key: "silent-night", label: "고요한 밤 거룩한 밤", description: "잔잔하고 포근한 선율" },
  { key: "we-wish", label: "We Wish You a Merry Christmas", description: "따뜻한 연말 인사 멜로디" },
  { key: "none", label: "배경음악 없음", description: "조용히 카드만 감상" },
];

export function getTemplate(templateId: string): CardTemplate {
  if (templateId in CARD_TEMPLATES) {
    return CARD_TEMPLATES[templateId as TemplateId];
  }
  return CARD_TEMPLATES["classic-tree"];
}
