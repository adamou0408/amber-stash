import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import type { CaptureSession, Detection, SpaceSnapshot } from '@/types/snapshot';
import { dedupeByIOU } from '@/services/dedup';
import { STORAGE_KEYS } from './keys';

// ---------- raw load / save ----------

export async function loadSessions(): Promise<CaptureSession[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.sessions);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CaptureSession[];
  } catch {
    return [];
  }
}

async function saveAllSessions(sessions: CaptureSession[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
}

export async function loadSnapshots(): Promise<SpaceSnapshot[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.snapshots);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SpaceSnapshot[];
  } catch {
    return [];
  }
}

async function saveAllSnapshots(snapshots: SpaceSnapshot[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.snapshots, JSON.stringify(snapshots));
}

// ---------- session CRUD ----------

export async function createSession(spaceId: string): Promise<CaptureSession> {
  const sessions = await loadSessions();
  const session: CaptureSession = {
    id: String(uuid.v4()),
    spaceId,
    startedAt: Date.now(),
    detections: [],
    photoUris: [],
  };
  await saveAllSessions([session, ...sessions]);
  return session;
}

export async function getSession(sessionId: string): Promise<CaptureSession | null> {
  const sessions = await loadSessions();
  return sessions.find((s) => s.id === sessionId) ?? null;
}

export async function updateSession(
  sessionId: string,
  patch: Partial<Omit<CaptureSession, 'id' | 'startedAt'>>,
): Promise<CaptureSession | null> {
  const sessions = await loadSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return null;
  const existing = sessions[idx];
  if (!existing) return null;
  const next: CaptureSession = { ...existing, ...patch };
  sessions[idx] = next;
  await saveAllSessions(sessions);
  return next;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const sessions = await loadSessions();
  await saveAllSessions(sessions.filter((s) => s.id !== sessionId));
}

/**
 * 把一筆 detection 加進 session，立刻 dedup（IOU > 0.5 + 同 category 合併）。
 * 回傳更新後的 session。
 */
export async function addDetectionToSession(
  sessionId: string,
  detection: Detection,
): Promise<CaptureSession | null> {
  const session = await getSession(sessionId);
  if (!session) return null;
  const detections = dedupeByIOU([...session.detections, detection]);
  return updateSession(sessionId, { detections });
}

// ---------- snapshot queries ----------

export async function loadSnapshotsForSpace(spaceId: string): Promise<SpaceSnapshot[]> {
  const snapshots = await loadSnapshots();
  return snapshots
    .filter((s) => s.spaceId === spaceId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** 取得某空間最新的 snapshot；沒有則回 null。 */
export async function loadLatestSnapshotForSpace(
  spaceId: string,
): Promise<SpaceSnapshot | null> {
  const list = await loadSnapshotsForSpace(spaceId);
  return list[0] ?? null;
}

/** 一次撈出所有 spaceId 的最新 snapshot map（不存在的 key 不在 map 內）。 */
export async function loadLatestSnapshotMap(
  spaceIds: string[],
): Promise<Record<string, SpaceSnapshot | null>> {
  const snapshots = await loadSnapshots();
  const latest: Record<string, SpaceSnapshot> = {};
  for (const snap of snapshots) {
    const cur = latest[snap.spaceId];
    if (!cur || cur.createdAt < snap.createdAt) {
      latest[snap.spaceId] = snap;
    }
  }
  const out: Record<string, SpaceSnapshot | null> = {};
  for (const id of spaceIds) {
    out[id] = latest[id] ?? null;
  }
  return out;
}

// ---------- commit ----------

/**
 * 把 session 內已 dedup 的 detections 寫成一份新的 snapshot。
 *
 * 重點：
 *   - snapshot 不可變：寫入後不會被修改（detections 做 deep clone 進去）
 *   - 不會刪除舊 snapshot（保留歷史），最新即「當前狀態」
 *   - 同一個 session commit 第二次會回傳已存在的 snapshot，不會重複寫
 */
export async function commitSnapshot(sessionId: string): Promise<SpaceSnapshot | null> {
  const session = await getSession(sessionId);
  if (!session) return null;

  if (session.committedSnapshotId) {
    const snapshots = await loadSnapshots();
    const existing = snapshots.find((s) => s.id === session.committedSnapshotId);
    if (existing) return existing;
  }

  // deep clone detections — snapshot 必須完全獨立於 session
  const frozen: Detection[] = session.detections.map((d) => ({
    ...d,
    ...(d.bbox ? { bbox: { ...d.bbox } } : {}),
  }));

  const snapshot: SpaceSnapshot = {
    id: String(uuid.v4()),
    spaceId: session.spaceId,
    sourceSessionId: session.id,
    detections: frozen,
    createdAt: Date.now(),
  };

  const allSnapshots = await loadSnapshots();
  await saveAllSnapshots([snapshot, ...allSnapshots]);
  await updateSession(sessionId, { committedSnapshotId: snapshot.id });

  return snapshot;
}
