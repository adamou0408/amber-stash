import { parseToolResult } from '../ai/recognizeItems';
import { mockRecognize } from '../ai/mockDetections';

describe('parseToolResult', () => {
  it('returns empty array on invalid input', () => {
    expect(parseToolResult(null, 'photo.jpg')).toEqual([]);
    expect(parseToolResult('not-an-object', 'photo.jpg')).toEqual([]);
    expect(parseToolResult({}, 'photo.jpg')).toEqual([]);
    expect(parseToolResult({ detections: 'not-array' }, 'photo.jpg')).toEqual([]);
  });

  it('parses well-formed tool output into Detections', () => {
    const result = parseToolResult(
      {
        detections: [
          { name: '長袖襯衫', category: 'clothing', quantity: 5, confidence: 0.9 },
          { name: '咖啡杯', category: 'kitchen', quantity: 3, confidence: 0.75 },
        ],
      },
      'file://photo.jpg',
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      name: '長袖襯衫',
      category: 'clothing',
      quantity: 5,
      confidence: 0.9,
      sourceType: 'ai',
      photoUri: 'file://photo.jpg',
    });
    expect(result[0]?.id).toBeDefined();
  });

  it('filters out unknown categories', () => {
    const result = parseToolResult(
      {
        detections: [
          { name: 'foo', category: 'made-up-category', quantity: 1, confidence: 0.8 },
          { name: 'bar', category: 'clothing', quantity: 1, confidence: 0.8 },
        ],
      },
      'photo.jpg',
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('bar');
  });

  it('clamps confidence to 0..1 and quantity to >= 1', () => {
    const result = parseToolResult(
      {
        detections: [
          { name: 'a', category: 'other', quantity: 0, confidence: 1.5 },
          { name: 'b', category: 'other', quantity: -3, confidence: -0.5 },
          { name: 'c', category: 'other', quantity: 2.7, confidence: 0.6 },
        ],
      },
      'p',
    );
    expect(result.map((d) => [d.quantity, d.confidence])).toEqual([
      [1, 1],
      [1, 0],
      [2, 0.6],
    ]);
  });

  it('rejects bbox out of 0..1 range', () => {
    const result = parseToolResult(
      {
        detections: [
          {
            name: 'a',
            category: 'other',
            quantity: 1,
            confidence: 0.5,
            bbox: { x: 0.1, y: 0.1, w: 0.2, h: 0.2 },
          },
          {
            name: 'b',
            category: 'other',
            quantity: 1,
            confidence: 0.5,
            bbox: { x: 1.5, y: 0.1, w: 0.2, h: 0.2 },
          },
        ],
      },
      'p',
    );
    expect(result[0]?.bbox).toBeDefined();
    expect(result[1]?.bbox).toBeUndefined();
  });

  it('truncates names longer than 40 chars', () => {
    const longName = 'a'.repeat(50);
    const result = parseToolResult(
      { detections: [{ name: longName, category: 'other', quantity: 1, confidence: 0.5 }] },
      'p',
    );
    expect(result[0]?.name.length).toBe(40);
  });
});

describe('mockRecognize', () => {
  it('returns deterministic scenarios per URI', () => {
    const a = mockRecognize('photo-A.jpg');
    const b = mockRecognize('photo-A.jpg');
    expect(a.map((d) => d.name)).toEqual(b.map((d) => d.name));
  });

  it('all detections marked ai source', () => {
    const result = mockRecognize('any.jpg');
    for (const d of result) {
      expect(d.sourceType).toBe('ai');
      expect(d.confidence).toBeGreaterThan(0);
      expect(d.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('different URIs may yield different scenarios', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const detections = mockRecognize(`photo-${i}.jpg`);
      if (detections[0]) seen.add(detections[0].name);
    }
    expect(seen.size).toBeGreaterThan(1);
  });
});
