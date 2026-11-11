import fs from "node:fs";
import path from "node:path";
import { prisma } from "./prisma";
import { isPublicViewerOnly } from "./mode";

export interface EffectiveSettings {
  baseUrl: string;
  kakaoJsKey: string;
  emailProvider: "smtp" | "resend";
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  resendApiKey: string;
  resendFrom: string;
  solapiApiKey: string;
  solapiApiSecret: string;
  solapiSenderPhone: string;
}

const LOCAL_SETTINGS_PATH = path.join(
  process.cwd(),
  ".xmas-settings.local.json"
);

type StoredLocalSettings = Partial<EffectiveSettings>;

function readLocalSettingsFile(): StoredLocalSettings | null {
  try {
    if (!fs.existsSync(LOCAL_SETTINGS_PATH)) return null;
    const raw = fs.readFileSync(LOCAL_SETTINGS_PATH, "utf8");
    return JSON.parse(raw) as StoredLocalSettings;
  } catch {
    return null;
  }
}

function writeLocalSettingsFile(data: EffectiveSettings): void {
  fs.writeFileSync(LOCAL_SETTINGS_PATH, JSON.stringify(data, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  try {
    fs.chmodSync(LOCAL_SETTINGS_PATH, 0o600);
  } catch {
    // ignore chmod issues on unsupported filesystems
  }
}

async function migrateLegacyDbSettingsIfNeeded(): Promise<StoredLocalSettings | null> {
  if (isPublicViewerOnly()) return null;
  const existingFile = readLocalSettingsFile();
  if (existingFile) return existingFile;

  try {
    const legacyDelegate = (
      prisma as unknown as {
        appSettings?: {
          findUnique: (args: {
            where: { id: string };
          }) => Promise<StoredLocalSettings | null>;
        };
      }
    ).appSettings;
    if (!legacyDelegate) return null;

    const dbRow = await legacyDelegate.findUnique({
      where: { id: "default" },
    });
    if (!dbRow) return null;

    const normalized: EffectiveSettings = {
      baseUrl: dbRow.baseUrl ?? "",
      kakaoJsKey: dbRow.kakaoJsKey ?? "",
      emailProvider: dbRow.emailProvider === "resend" ? "resend" : "smtp",
      smtpHost: dbRow.smtpHost ?? "",
      smtpPort: dbRow.smtpPort || "587",
      smtpSecure: Boolean(dbRow.smtpSecure),
      smtpUser: dbRow.smtpUser ?? "",
      smtpPass: dbRow.smtpPass ?? "",
      smtpFrom: dbRow.smtpFrom ?? "",
      resendApiKey: dbRow.resendApiKey ?? "",
      resendFrom: dbRow.resendFrom ?? "",
      solapiApiKey: dbRow.solapiApiKey ?? "",
      solapiApiSecret: dbRow.solapiApiSecret ?? "",
      solapiSenderPhone: dbRow.solapiSenderPhone ?? "",
    };
    writeLocalSettingsFile(normalized);
    return normalized;
  } catch {
    return null;
  }
}

export async function getEffectiveSettings(): Promise<EffectiveSettings> {
  const local = isPublicViewerOnly()
    ? null
    : await migrateLegacyDbSettingsIfNeeded();

  const pick = (localVal: string | undefined | null, envKey: string) =>
    localVal?.trim() || process.env[envKey]?.trim() || "";

  const emailProvider =
    local?.emailProvider === "resend" ||
    (!local?.smtpHost && Boolean(process.env.RESEND_API_KEY?.trim()))
      ? "resend"
      : "smtp";

  return {
    baseUrl: pick(local?.baseUrl, "NEXT_PUBLIC_BASE_URL"),
    kakaoJsKey: pick(local?.kakaoJsKey, "NEXT_PUBLIC_KAKAO_JS_KEY"),
    emailProvider,
    smtpHost: pick(local?.smtpHost, "SMTP_HOST"),
    smtpPort: pick(local?.smtpPort, "SMTP_PORT") || "587",
    smtpSecure:
      local !== null && local.smtpSecure !== undefined
        ? Boolean(local.smtpSecure)
        : process.env.SMTP_SECURE === "true" ||
          process.env.SMTP_PORT === "465",
    smtpUser: pick(local?.smtpUser, "SMTP_USER"),
    smtpPass: pick(local?.smtpPass, "SMTP_PASS"),
    smtpFrom: pick(local?.smtpFrom, "SMTP_FROM"),
    resendApiKey: pick(local?.resendApiKey, "RESEND_API_KEY"),
    resendFrom: pick(local?.resendFrom, "RESEND_FROM"),
    solapiApiKey: pick(local?.solapiApiKey, "SOLAPI_API_KEY"),
    solapiApiSecret: pick(local?.solapiApiSecret, "SOLAPI_API_SECRET"),
    solapiSenderPhone: pick(local?.solapiSenderPhone, "SOLAPI_SENDER_PHONE"),
  };
}

export interface PublicSettingsSummary {
  baseUrl: string;
  kakaoJsKey: string;
  emailProvider: "smtp" | "resend";
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUser: string;
  hasSmtpPass: boolean;
  smtpFrom: string;
  hasResendApiKey: boolean;
  resendFrom: string;
  solapiApiKey: string;
  hasSolapiApiSecret: boolean;
  solapiSenderPhone: string;
  emailConfigured: boolean;
  activeEmailMethod: "resend" | "smtp" | "preview";
  kakaoConfigured: boolean;
  smsApiConfigured: boolean;
}

export function summarizeSettings(
  s: EffectiveSettings
): PublicSettingsSummary {
  const resendReady = Boolean(s.resendApiKey && s.resendFrom);
  const smtpReady = Boolean(s.smtpHost && s.smtpUser && s.smtpPass);
  const activeEmailMethod =
    s.emailProvider === "resend"
      ? resendReady
        ? "resend"
        : smtpReady
          ? "smtp"
          : "preview"
      : smtpReady
        ? "smtp"
        : resendReady
          ? "resend"
          : "preview";

  return {
    baseUrl: s.baseUrl,
    kakaoJsKey: s.kakaoJsKey,
    emailProvider: s.emailProvider,
    smtpHost: s.smtpHost,
    smtpPort: s.smtpPort,
    smtpSecure: s.smtpSecure,
    smtpUser: s.smtpUser,
    hasSmtpPass: Boolean(s.smtpPass),
    smtpFrom: s.smtpFrom,
    hasResendApiKey: Boolean(s.resendApiKey),
    resendFrom: s.resendFrom,
    solapiApiKey: s.solapiApiKey,
    hasSolapiApiSecret: Boolean(s.solapiApiSecret),
    solapiSenderPhone: s.solapiSenderPhone,
    emailConfigured: activeEmailMethod !== "preview",
    activeEmailMethod,
    kakaoConfigured: Boolean(s.kakaoJsKey),
    smsApiConfigured: Boolean(
      s.solapiApiKey && s.solapiApiSecret && s.solapiSenderPhone
    ),
  };
}

export async function getPublicSettingsSummary(): Promise<PublicSettingsSummary> {
  const s = await getEffectiveSettings();
  return summarizeSettings(s);
}

export interface SettingsUpdateInput {
  baseUrl?: string;
  kakaoJsKey?: string;
  emailProvider?: "smtp" | "resend";
  smtpHost?: string;
  smtpPort?: string;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  clearSmtpPass?: boolean;
  smtpFrom?: string;
  resendApiKey?: string;
  clearResendApiKey?: boolean;
  resendFrom?: string;
  solapiApiKey?: string;
  solapiApiSecret?: string;
  clearSolapiApiSecret?: boolean;
  solapiSenderPhone?: string;
}

export async function saveAppSettings(
  input: SettingsUpdateInput
): Promise<PublicSettingsSummary> {
  if (isPublicViewerOnly()) {
    throw new Error("공개 뷰어 모드에서는 설정을 변경할 수 없습니다.");
  }

  const existing = (await migrateLegacyDbSettingsIfNeeded()) ?? {};

  const data: EffectiveSettings = {
    baseUrl:
      input.baseUrl !== undefined
        ? input.baseUrl.trim()
        : (existing.baseUrl ?? ""),
    kakaoJsKey:
      input.kakaoJsKey !== undefined
        ? input.kakaoJsKey.trim()
        : (existing.kakaoJsKey ?? ""),
    emailProvider:
      input.emailProvider === "resend"
        ? "resend"
        : input.emailProvider === "smtp"
          ? "smtp"
          : (existing.emailProvider ?? "smtp"),
    smtpHost:
      input.smtpHost !== undefined
        ? input.smtpHost.trim()
        : (existing.smtpHost ?? ""),
    smtpPort:
      input.smtpPort !== undefined
        ? input.smtpPort.trim() || "587"
        : (existing.smtpPort ?? "587"),
    smtpSecure:
      input.smtpSecure !== undefined
        ? Boolean(input.smtpSecure)
        : Boolean(existing.smtpSecure),
    smtpUser:
      input.smtpUser !== undefined
        ? input.smtpUser.trim()
        : (existing.smtpUser ?? ""),
    smtpPass: input.clearSmtpPass
      ? ""
      : input.smtpPass && input.smtpPass.trim()
        ? input.smtpPass.trim()
        : (existing.smtpPass ?? ""),
    smtpFrom:
      input.smtpFrom !== undefined
        ? input.smtpFrom.trim()
        : (existing.smtpFrom ?? ""),
    resendApiKey: input.clearResendApiKey
      ? ""
      : input.resendApiKey && input.resendApiKey.trim()
        ? input.resendApiKey.trim()
        : (existing.resendApiKey ?? ""),
    resendFrom:
      input.resendFrom !== undefined
        ? input.resendFrom.trim()
        : (existing.resendFrom ?? ""),
    solapiApiKey:
      input.solapiApiKey !== undefined
        ? input.solapiApiKey.trim()
        : (existing.solapiApiKey ?? ""),
    solapiApiSecret: input.clearSolapiApiSecret
      ? ""
      : input.solapiApiSecret && input.solapiApiSecret.trim()
        ? input.solapiApiSecret.trim()
        : (existing.solapiApiSecret ?? ""),
    solapiSenderPhone:
      input.solapiSenderPhone !== undefined
        ? input.solapiSenderPhone.replace(/[^0-9]/g, "")
        : (existing.solapiSenderPhone ?? ""),
  };

  writeLocalSettingsFile(data);
  return summarizeSettings(data);
}
