import { PlainTextPipe } from './plain-text.pipe';

describe('PlainTextPipe', () => {
  const pipe = new PlainTextPipe();

  it('extracts readable text without rendering stored markup', () => {
    const result = pipe.transform('<p>First paragraph.</p><p>Second paragraph.</p>');
    expect(result).toBe('First paragraph. Second paragraph.');
  });

  it('returns an empty string for missing content', () => {
    expect(pipe.transform(undefined)).toBe('');
  });
});
