import type { CardTemplate } from "@/lib/templates";

export function CardMotif({ motif }: { motif: CardTemplate["motif"] }) {
  if (motif === "tree") {
    return (
      <svg
        viewBox="0 0 120 120"
        className="h-24 w-24 drop-shadow-md"
        aria-hidden="true"
      >
        <polygon points="60,10 64,22 76,22 66,29 70,41 60,34 50,41 54,29 44,22 56,22" fill="#fbbf24" />
        <polygon points="60,28 32,62 88,62" fill="#15803d" />
        <polygon points="60,46 25,84 95,84" fill="#166534" />
        <polygon points="60,64 18,104 102,104" fill="#14532d" />
        <rect x="52" y="104" width="16" height="12" rx="2" fill="#78350f" />
        <circle cx="52" cy="54" r="3.5" fill="#ef4444" />
        <circle cx="68" cy="57" r="3" fill="#fde047" />
        <circle cx="44" cy="76" r="3.5" fill="#93c5fd" />
        <circle cx="72" cy="74" r="3.5" fill="#ef4444" />
        <circle cx="58" cy="92" r="4" fill="#fbbf24" />
        <circle cx="38" cy="96" r="3" fill="#f9a8d4" />
        <circle cx="80" cy="95" r="3" fill="#fde047" />
      </svg>
    );
  }

  if (motif === "stars") {
    return (
      <svg
        viewBox="0 0 120 120"
        className="h-24 w-24 drop-shadow-md"
        aria-hidden="true"
      >
        <path
          d="M74 22a32 32 0 1 0 24 52 25 25 0 1 1-24-52z"
          fill="#fde68a"
        />
        <polygon points="34,26 36,33 43,35 36,37 34,44 32,37 25,35 32,33" fill="#e0f2fe" />
        <polygon points="90,46 92,51 97,53 92,55 90,60 88,55 83,53 88,51" fill="#bae6fd" />
        <polygon points="48,76 50,82 56,84 50,86 48,92 46,86 40,84 46,82" fill="#fde68a" />
        <circle cx="24" cy="64" r="2" fill="#e0f2fe" />
        <circle cx="76" cy="92" r="2.2" fill="#bae6fd" />
      </svg>
    );
  }

  if (motif === "cabin") {
    return (
      <svg
        viewBox="0 0 120 120"
        className="h-24 w-24 drop-shadow-md"
        aria-hidden="true"
      >
        <rect x="78" y="24" width="12" height="26" fill="#78350f" />
        <circle cx="84" cy="16" r="5" fill="#e7e5e4" opacity="0.7" />
        <circle cx="90" cy="10" r="3.5" fill="#e7e5e4" opacity="0.5" />
        <polygon points="18,62 60,26 102,62" fill="#991b1b" />
        <path d="M16 62 L60 24 L104 62" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" fill="none" />
        <rect x="28" y="62" width="64" height="42" rx="3" fill="#92400e" />
        <rect x="52" y="76" width="16" height="28" rx="2" fill="#451a03" />
        <rect x="35" y="72" width="12" height="12" rx="2" fill="#fde047" />
        <rect x="73" y="72" width="12" height="12" rx="2" fill="#fde047" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 120 120"
      className="h-24 w-24 drop-shadow-sm"
      aria-hidden="true"
    >
      <circle
        cx="60"
        cy="60"
        r="34"
        fill="none"
        stroke="#166534"
        strokeWidth="12"
        strokeDasharray="10 4"
      />
      <circle
        cx="60"
        cy="60"
        r="34"
        fill="none"
        stroke="#a16207"
        strokeWidth="2"
      />
      <circle cx="34" cy="40" r="3.5" fill="#b91c1c" />
      <circle cx="86" cy="42" r="3.5" fill="#b91c1c" />
      <circle cx="32" cy="76" r="3.5" fill="#d97706" />
      <circle cx="88" cy="76" r="3.5" fill="#b91c1c" />
      <path d="M50 26 L60 34 L70 26 L65 18 L60 24 L55 18 Z" fill="#b91c1c" />
    </svg>
  );
}
