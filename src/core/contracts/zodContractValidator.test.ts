import { describe, it, expect } from 'bun:test';
import { validateWireContract } from './zodContractValidator';

describe('Zod Wire Contract Validator', () => {
  it('identifies exact schema matches as compatible', () => {
    const result = validateWireContract('z.string()', 'z.string()');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('compatible');
  });

  it('accepts specialized string subtypes into general string ports', () => {
    const result = validateWireContract('z.string().email()', 'z.string()');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('subtype');
  });

  it('flags incompatible primitive types as mismatch', () => {
    const result = validateWireContract('z.string()', 'z.number()');
    expect(result.isValid).toBe(false);
    expect(result.status).toBe('mismatch');
    expect(result.reason).toContain('Type collision');
  });

  it('handles object shapes safely', () => {
    const result = validateWireContract('z.object({ hash: z.string() })', 'z.object({ hash: z.string() })');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('compatible');
  });

  it('accepts wildcard any contracts', () => {
    const result = validateWireContract('z.any()', 'z.number()');
    expect(result.isValid).toBe(true);
    expect(result.status).toBe('compatible');
  });
});
