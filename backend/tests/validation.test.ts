import { describe, it, expect } from 'vitest';
import { safeParseJsonArray } from '../src/utils/validation';

describe('safeParseJsonArray Helper', () => {
  it('should parse valid JSON array string', () => {
    expect(safeParseJsonArray('["LOANS", "INSURANCE"]')).toEqual(['LOANS', 'INSURANCE']);
  });

  it('should handle unquoted plain string without throwing SyntaxError', () => {
    expect(safeParseJsonArray('LOANS')).toEqual(['LOANS']);
  });

  it('should handle comma-separated string without throwing SyntaxError', () => {
    expect(safeParseJsonArray('LOANS,INSURANCE')).toEqual(['LOANS', 'INSURANCE']);
  });

  it('should handle string with quotes or bracket formatting issues', () => {
    expect(safeParseJsonArray('"LOANS"')).toEqual(['LOANS']);
  });

  it('should return empty array for null, undefined, or empty string', () => {
    expect(safeParseJsonArray(null)).toEqual([]);
    expect(safeParseJsonArray(undefined)).toEqual([]);
    expect(safeParseJsonArray('')).toEqual([]);
    expect(safeParseJsonArray('   ')).toEqual([]);
  });

  it('should handle input if already an array', () => {
    expect(safeParseJsonArray(['LOANS', 'INSURANCE'])).toEqual(['LOANS', 'INSURANCE']);
  });
});
