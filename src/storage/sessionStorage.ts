import type { CaptureSession, Detection, SpaceSnapshot } from '@/types/snapshot';
import { repositories } from './repositories';

/**
 * Thin shim — delegate 到 repositories.session。
 * 保留原本 named export 介面，讓既有 screens / tests 0 改動。
 */

export const loadSessions = (): Promise<CaptureSession[]> =>
  repositories.session.loadSessions();

export const loadSnapshots = (): Promise<SpaceSnapshot[]> =>
  repositories.session.loadSnapshots();

export const createSession = (spaceId: string): Promise<CaptureSession> =>
  repositories.session.createSession(spaceId);

export const getSession = (sessionId: string): Promise<CaptureSession | null> =>
  repositories.session.getSession(sessionId);

export const updateSession = (
  sessionId: string,
  patch: Partial<Omit<CaptureSession, 'id' | 'startedAt'>>,
): Promise<CaptureSession | null> => repositories.session.updateSession(sessionId, patch);

export const deleteSession = (sessionId: string): Promise<void> =>
  repositories.session.deleteSession(sessionId);

export const addDetectionToSession = (
  sessionId: string,
  detection: Detection,
): Promise<CaptureSession | null> =>
  repositories.session.addDetectionToSession(sessionId, detection);

export const loadSnapshotsForSpace = (spaceId: string): Promise<SpaceSnapshot[]> =>
  repositories.session.loadSnapshotsForSpace(spaceId);

export const loadLatestSnapshotForSpace = (
  spaceId: string,
): Promise<SpaceSnapshot | null> => repositories.session.loadLatestSnapshotForSpace(spaceId);

export const loadLatestSnapshotMap = (
  spaceIds: string[],
): Promise<Record<string, SpaceSnapshot | null>> =>
  repositories.session.loadLatestSnapshotMap(spaceIds);

export const commitSnapshot = (sessionId: string): Promise<SpaceSnapshot | null> =>
  repositories.session.commitSnapshot(sessionId);
