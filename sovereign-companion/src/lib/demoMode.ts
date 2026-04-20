import { prisma } from "./prisma";

export interface DemoStatus {
  active: boolean;
  reason: "ok" | "manual_pause" | "outside_schedule";
  message: string;
  schedule: {
    enabled: boolean;
    activeFromHour: number;
    activeToHour: number;
  };
}

export interface AppSettingsSnapshot {
  demoEnabled: boolean;
  pausedMessage: string;
  scheduleEnabled: boolean;
  activeFromHour: number;
  activeToHour: number;
  updatedAt: string;
  updatedBy: string;
}

const DEFAULT_SNAPSHOT: AppSettingsSnapshot = {
  demoEnabled: true,
  pausedMessage: "",
  scheduleEnabled: false,
  activeFromHour: 9,
  activeToHour: 21,
  updatedAt: new Date(0).toISOString(),
  updatedBy: "",
};

export async function getAppSettings(): Promise<AppSettingsSnapshot> {
  const row = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });
  return {
    demoEnabled: row.demoEnabled,
    pausedMessage: row.pausedMessage,
    scheduleEnabled: row.scheduleEnabled,
    activeFromHour: row.activeFromHour,
    activeToHour: row.activeToHour,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy,
  };
}

export async function updateAppSettings(
  patch: Partial<Omit<AppSettingsSnapshot, "updatedAt">>
): Promise<AppSettingsSnapshot> {
  const data: Record<string, unknown> = {};
  if (typeof patch.demoEnabled === "boolean") data.demoEnabled = patch.demoEnabled;
  if (typeof patch.pausedMessage === "string") data.pausedMessage = patch.pausedMessage.slice(0, 500);
  if (typeof patch.scheduleEnabled === "boolean") data.scheduleEnabled = patch.scheduleEnabled;
  if (typeof patch.activeFromHour === "number") data.activeFromHour = clampHour(patch.activeFromHour);
  if (typeof patch.activeToHour === "number") data.activeToHour = clampHour(patch.activeToHour);
  if (typeof patch.updatedBy === "string") data.updatedBy = patch.updatedBy.slice(0, 64);

  const row = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });
  return {
    demoEnabled: row.demoEnabled,
    pausedMessage: row.pausedMessage,
    scheduleEnabled: row.scheduleEnabled,
    activeFromHour: row.activeFromHour,
    activeToHour: row.activeToHour,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy,
  };
}

function clampHour(h: number): number {
  if (!Number.isFinite(h)) return 0;
  return Math.max(0, Math.min(23, Math.floor(h)));
}

function isWithinSchedule(from: number, to: number, hour: number): boolean {
  if (from === to) return true;
  if (from < to) return hour >= from && hour < to;
  return hour >= from || hour < to;
}

export function evaluateStatus(
  snapshot: AppSettingsSnapshot,
  now: Date = new Date()
): DemoStatus {
  const schedule = {
    enabled: snapshot.scheduleEnabled,
    activeFromHour: snapshot.activeFromHour,
    activeToHour: snapshot.activeToHour,
  };
  const message = snapshot.pausedMessage;
  if (!snapshot.demoEnabled) {
    return { active: false, reason: "manual_pause", message, schedule };
  }
  if (snapshot.scheduleEnabled) {
    const hour = now.getHours();
    if (!isWithinSchedule(snapshot.activeFromHour, snapshot.activeToHour, hour)) {
      return { active: false, reason: "outside_schedule", message, schedule };
    }
  }
  return { active: true, reason: "ok", message, schedule };
}

export async function getDemoStatus(): Promise<DemoStatus> {
  try {
    const snapshot = await getAppSettings();
    return evaluateStatus(snapshot);
  } catch {
    return evaluateStatus(DEFAULT_SNAPSHOT);
  }
}

export function verifyAdminPassword(provided: string | null | undefined): boolean {
  if (!provided) return false;
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return provided === expected;
}
