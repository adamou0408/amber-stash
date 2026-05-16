import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import {
  addDetectionToSession,
  commitSnapshot,
  createSession,
  getSession,
  loadLatestSnapshotForSpace,
  loadLatestSnapshotMap,
  loadSnapshots,
  loadSnapshotsForSpace,
} from '@/storage/sessionStorage';
import type { Detection } from '@/types/snapshot';

// Reset the in-memory stores between tests so they're hermetic.
beforeEach(async () => {
  // @ts-expect-error — test helper exposed by mock
  AsyncStorage.__reset?.();
  // @ts-expect-error — test helper exposed by mock
  uuid.__reset?.();
});

function makeDetection(
  overrides: Partial<Detection> & Pick<Detection, 'id' | 'category'>,
): Detection {
  return {
    id: overrides.id,
    name: overrides.name ?? 'thing',
    category: overrides.category,
    quantity: overrides.quantity ?? 1,
    confidence: overrides.confidence ?? 0.95,
    sourceType: overrides.sourceType ?? 'manual',
    bbox: overrides.bbox,
    photoUri: overrides.photoUri,
    note: overrides.note,
  };
}

describe('sessionStorage — round-trip', () => {
  test('createSession then getSession returns the same record', async () => {
    const sess = await createSession('space-A');
    expect(sess.spaceId).toBe('space-A');
    expect(sess.detections).toEqual([]);
    const loaded = await getSession(sess.id);
    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe(sess.id);
  });

  test('addDetectionToSession persists and dedups by IOU on same category', async () => {
    const sess = await createSession('space-A');
    const a = makeDetection({
      id: 'a',
      category: 'clothing',
      bbox: { x: 0, y: 0, w: 10, h: 10 },
      confidence: 0.6,
    });
    const b = makeDetection({
      id: 'b',
      category: 'clothing',
      bbox: { x: 1, y: 1, w: 10, h: 10 },
      confidence: 0.9,
    });
    const c = makeDetection({
      id: 'c',
      category: 'clothing',
      bbox: { x: 2, y: 2, w: 10, h: 10 },
      confidence: 0.7,
    });
    await addDetectionToSession(sess.id, a);
    await addDetectionToSession(sess.id, b);
    const out = await addDetectionToSession(sess.id, c);
    expect(out?.detections).toHaveLength(1);
    expect(out?.detections[0]?.quantity).toBe(3);
  });
});

describe('sessionStorage — commitSnapshot', () => {
  test('commit writes a snapshot and links it back to the session', async () => {
    const sess = await createSession('space-A');
    await addDetectionToSession(
      sess.id,
      makeDetection({ id: 'a', category: 'books', quantity: 2 }),
    );
    const snap = await commitSnapshot(sess.id);
    expect(snap).not.toBeNull();
    expect(snap?.spaceId).toBe('space-A');
    expect(snap?.detections).toHaveLength(1);

    const after = await getSession(sess.id);
    expect(after?.committedSnapshotId).toBe(snap?.id);

    const all = await loadSnapshots();
    expect(all).toHaveLength(1);
  });

  test('commit is idempotent — second commit returns the same snapshot', async () => {
    const sess = await createSession('space-A');
    await addDetectionToSession(sess.id, makeDetection({ id: 'a', category: 'tools' }));
    const first = await commitSnapshot(sess.id);
    const second = await commitSnapshot(sess.id);
    expect(first?.id).toBe(second?.id);
    const all = await loadSnapshots();
    expect(all).toHaveLength(1);
  });

  test('snapshot is immutable — later session edits do not change earlier snapshot (acceptance #2)', async () => {
    const sess1 = await createSession('space-A');
    await addDetectionToSession(
      sess1.id,
      makeDetection({ id: 'a', category: 'clothing', quantity: 5 }),
    );
    const snap1 = await commitSnapshot(sess1.id);
    expect(snap1?.detections[0]?.quantity).toBe(5);

    // Start a new session, add different content, commit.
    const sess2 = await createSession('space-A');
    await addDetectionToSession(
      sess2.id,
      makeDetection({ id: 'b', category: 'clothing', quantity: 1 }),
    );
    await commitSnapshot(sess2.id);

    // Re-read snap1 from storage — its detections must still be the old value.
    const all = await loadSnapshots();
    const reloadSnap1 = all.find((s) => s.id === snap1!.id);
    expect(reloadSnap1?.detections).toHaveLength(1);
    expect(reloadSnap1?.detections[0]?.quantity).toBe(5);
  });

  test('mutating the returned session detection does not change the snapshot (deep clone)', async () => {
    const sess = await createSession('space-A');
    await addDetectionToSession(
      sess.id,
      makeDetection({
        id: 'a',
        category: 'clothing',
        quantity: 5,
        bbox: { x: 0, y: 0, w: 10, h: 10 },
      }),
    );
    const snap = await commitSnapshot(sess.id);
    // mutate session via storage (simulate user adding another detection after commit)
    await addDetectionToSession(
      sess.id,
      makeDetection({
        id: 'b',
        category: 'clothing',
        quantity: 99,
        bbox: { x: 100, y: 100, w: 1, h: 1 },
      }),
    );
    const reloaded = (await loadSnapshots()).find((s) => s.id === snap?.id);
    expect(reloaded?.detections).toHaveLength(1);
    expect(reloaded?.detections[0]?.quantity).toBe(5);
  });
});

describe('sessionStorage — queries', () => {
  test('loadLatestSnapshotForSpace returns the most recent', async () => {
    const s1 = await createSession('space-A');
    await addDetectionToSession(s1.id, makeDetection({ id: 'x', category: 'books' }));
    await commitSnapshot(s1.id);

    const s2 = await createSession('space-A');
    await addDetectionToSession(s2.id, makeDetection({ id: 'y', category: 'clothing' }));
    const snap2 = await commitSnapshot(s2.id);

    const latest = await loadLatestSnapshotForSpace('space-A');
    expect(latest?.id).toBe(snap2?.id);
    expect(latest?.detections[0]?.category).toBe('clothing');
  });

  test('loadSnapshotsForSpace filters and orders DESC by createdAt', async () => {
    const a = await createSession('space-A');
    await commitSnapshot(a.id);
    const b = await createSession('space-B');
    await commitSnapshot(b.id);
    const c = await createSession('space-A');
    await commitSnapshot(c.id);

    const aOnly = await loadSnapshotsForSpace('space-A');
    expect(aOnly).toHaveLength(2);
    expect(aOnly[0]!.createdAt).toBeGreaterThanOrEqual(aOnly[1]!.createdAt);
  });

  test('loadLatestSnapshotMap returns null for spaces with no snapshot', async () => {
    const sess = await createSession('space-A');
    await commitSnapshot(sess.id);
    const map = await loadLatestSnapshotMap(['space-A', 'space-B']);
    expect(map['space-A']).not.toBeNull();
    expect(map['space-B']).toBeNull();
  });
});

describe('sessionStorage — persistence (acceptance #4)', () => {
  test('after a simulated reload (re-read from mock AsyncStorage), latest snapshot is still there', async () => {
    const sess = await createSession('space-A');
    await addDetectionToSession(
      sess.id,
      makeDetection({ id: 'a', category: 'clothing', quantity: 4 }),
    );
    await commitSnapshot(sess.id);

    // Simulate reload: re-import is not strictly necessary because the storage layer
    // reads from AsyncStorage on every call. Just call the loader again.
    const latest = await loadLatestSnapshotForSpace('space-A');
    expect(latest?.detections[0]?.quantity).toBe(4);
  });
});

describe('sessionStorage — acceptance: 拍 3 次 → snapshot 只有 1 件', () => {
  test('3 overlapping AI detections committed → snapshot has exactly 1 detection with quantity 3', async () => {
    const sess = await createSession('space-A');
    const bbox = { x: 0, y: 0, w: 100, h: 100 };
    await addDetectionToSession(
      sess.id,
      makeDetection({
        id: 'a',
        category: 'clothing',
        bbox,
        sourceType: 'ai',
        confidence: 0.6,
      }),
    );
    await addDetectionToSession(
      sess.id,
      makeDetection({
        id: 'b',
        category: 'clothing',
        bbox: { x: 1, y: 1, w: 100, h: 100 },
        sourceType: 'ai',
        confidence: 0.7,
      }),
    );
    await addDetectionToSession(
      sess.id,
      makeDetection({
        id: 'c',
        category: 'clothing',
        bbox: { x: 2, y: 2, w: 100, h: 100 },
        sourceType: 'ai',
        confidence: 0.95,
      }),
    );
    const snap = await commitSnapshot(sess.id);
    expect(snap?.detections).toHaveLength(1);
    expect(snap?.detections[0]?.quantity).toBe(3);
  });
});
