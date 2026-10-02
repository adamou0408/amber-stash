import uuid from 'react-native-uuid';
import type { CaptureSession, Detection, SpaceSnapshot } from '@/types/snapshot';
import { dedupeByIOU } from '@/services/dedup';
import { STORAGE_KEYS } from '@/storage/keys';
import type { SessionRepository } from '../types';
import { loadArray, saveArray } from './shared';

export class AsyncStorageSessionRepository implements SessionRepository {
  // ---------- raw load / save ----------

  async loadSessions(): Promise<CaptureSession[]> {
    return loadArray<CaptureSession>(STORAGE_KEYS.sessions);
  }

  private async saveAllSessions(sessions: CaptureSession[]): Promise<void> {
    await saveArray(STORAGE_KEYS.sessions, sessions);
  }

  async loadSnapshots(): Promise<SpaceSnapshot[]> {
    return loadArray<SpaceSnapshot>(STORAGE_KEYS.snapshots);
  }

  private async saveAllSnapshots(snapshots: SpaceSnapshot[]): Promise<void> {
    await saveArray(STORAGE_KEYS.snapshots, snapshots);
  }

  // ---------- session CRUD ----------

  async createSession(spaceId: string): Promise<CaptureSession> {
    const sessions = await this.loadSessions();
    const session: CaptureSession = {
      id: String(uuid.v4()),
      spaceId,
      startedAt: Date.now(),
      detections: [],
      photoUris: [],
    };
    await this.saveAllSessions([session, ...sessions]);
    return session;
  }

  async getSession(sessionId: string): Promise<CaptureSession | null> {
    const sessions = await this.loadSessions();
    return sessions.find((s) => s.id === sessionId) ?? null;
  }

  async updateSession(
    sessionId: string,
    patch: Partial<Omit<CaptureSession, 'id' | 'startedAt'>>,
  ): Promise<CaptureSession | null> {
    const sessions = await this.loadSessions();
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return null;
    const existing = sessions[idx];
    if (!existing) return null;
    const next: CaptureSession = { ...existing, ...patch };
    sessions[idx] = next;
    await this.saveAllSessions(sessions);
    return next;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = await this.loadSessions();
    await this.saveAllSessions(sessions.filter((s) => s.id !== sessionId));
  }

  /**
   * 把一筆 detection 加進 session，立刻 dedup（IOU > 0.5 + 同 category 合併）。
   * 回傳更新後的 session。
   */
  async addDetectionToSession(
    sessionId: string,
    detection: Detection,
  ): Promise<CaptureSession | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;
    const detections = dedupeByIOU([...session.detections, detection]);
    return this.updateSession(sessionId, { detections });
  }

  // ---------- snapshot queries ----------

  async loadSnapshotsForSpace(spaceId: string): Promise<SpaceSnapshot[]> {
    const snapshots = await this.loadSnapshots();
    return snapshots
      .filter((s) => s.spaceId === spaceId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /** 取得某空間最新的 snapshot；沒有則回 null。 */
  async loadLatestSnapshotForSpace(spaceId: string): Promise<SpaceSnapshot | null> {
    const list = await this.loadSnapshotsForSpace(spaceId);
    return list[0] ?? null;
  }

  /** 一次撈出所有 spaceId 的最新 snapshot map（不存在的 key 不在 map 內）。 */
  async loadLatestSnapshotMap(
    spaceIds: string[],
  ): Promise<Record<string, SpaceSnapshot | null>> {
    const snapshots = await this.loadSnapshots();
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
  async commitSnapshot(sessionId: string): Promise<SpaceSnapshot | null> {
    const session = await this.getSession(sessionId);
    if (!session) return null;

    if (session.committedSnapshotId) {
      const snapshots = await this.loadSnapshots();
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

    const allSnapshots = await this.loadSnapshots();
    await this.saveAllSnapshots([snapshot, ...allSnapshots]);
    await this.updateSession(sessionId, { committedSnapshotId: snapshot.id });

    return snapshot;
  }
}
