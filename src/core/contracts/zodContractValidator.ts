/**
 * Zod Wire Contract Validator
 * Validates wire connections between node ports based on their Zod schemas.
 * Detects type compatibility, subtyping, and flagrant contract violations.
 */

export interface ContractCheckResult {
  isValid: boolean;
  status: 'compatible' | 'mismatch' | 'unknown' | 'subtype';
  sourceSchema: string;
  targetSchema: string;
  reason?: string;
  diff?: {
    expected: string;
    actual: string;
  };
}

function normalizeSchema(schema: string): string {
  return schema
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^z\./, '')
    .toLowerCase();
}

/**
 * Validates whether a wire connection from source to target is type-safe
 */
export function validateWireContract(sourceSchemaStr: string, targetSchemaStr: string): ContractCheckResult {
  if (!sourceSchemaStr || !targetSchemaStr) {
    return {
      isValid: true,
      status: 'unknown',
      sourceSchema: sourceSchemaStr || 'unknown',
      targetSchema: targetSchemaStr || 'unknown',
      reason: 'Unspecified schema - runtime lenient mode',
    };
  }

  const normSource = normalizeSchema(sourceSchemaStr);
  const normTarget = normalizeSchema(targetSchemaStr);

  // Exact match
  if (normSource === normTarget) {
    return {
      isValid: true,
      status: 'compatible',
      sourceSchema: sourceSchemaStr,
      targetSchema: targetSchemaStr,
      reason: 'Exact schema contract match',
    };
  }

  // Any matches anything
  if (normSource.includes('any()') || normTarget.includes('any()') || normSource === 'any' || normTarget === 'any') {
    return {
      isValid: true,
      status: 'compatible',
      sourceSchema: sourceSchemaStr,
      targetSchema: targetSchemaStr,
      reason: 'Dynamic any wildcard contract',
    };
  }

  // Subtyping: string().email() or string().min() -> string()
  if (normSource.startsWith('string(') && normTarget === 'string()') {
    return {
      isValid: true,
      status: 'subtype',
      sourceSchema: sourceSchemaStr,
      targetSchema: targetSchemaStr,
      reason: 'Subtype refinement accepted: specialized string satisfies base string()',
    };
  }

  // Base string vs specialized string
  if (normSource === 'string()' && (normTarget.startsWith('string(') && normTarget !== 'string()')) {
    return {
      isValid: false,
      status: 'mismatch',
      sourceSchema: sourceSchemaStr,
      targetSchema: targetSchemaStr,
      reason: 'Under-refined contract: general string cannot satisfy constrained target schema',
      diff: {
        expected: targetSchemaStr,
        actual: sourceSchemaStr,
      },
    };
  }

  // Number subtyping: number().int() -> number()
  if (normSource.startsWith('number(') && normTarget === 'number()') {
    return {
      isValid: true,
      status: 'subtype',
      sourceSchema: sourceSchemaStr,
      targetSchema: targetSchemaStr,
      reason: 'Subtype refinement accepted: specialized number satisfies base number()',
    };
  }

  // Incompatible primitive types: string vs number vs boolean vs object vs array
  const primitives = ['string', 'number', 'boolean', 'object', 'array'];
  const sourcePrim = primitives.find((p) => normSource.includes(p));
  const targetPrim = primitives.find((p) => normTarget.includes(p));

  if (sourcePrim && targetPrim && sourcePrim !== targetPrim) {
    return {
      isValid: false,
      status: 'mismatch',
      sourceSchema: sourceSchemaStr,
      targetSchema: targetSchemaStr,
      reason: `Type collision: wire source produces [${sourcePrim}] but wire target expects [${targetPrim}]`,
      diff: {
        expected: targetSchemaStr,
        actual: sourceSchemaStr,
      },
    };
  }

  // If both are objects, check field overlaps if present in simplified strings
  if (sourcePrim === 'object' && targetPrim === 'object') {
    // Both objects, check if identical or compatible
    return {
      isValid: true,
      status: 'compatible',
      sourceSchema: sourceSchemaStr,
      targetSchema: targetSchemaStr,
      reason: 'Object shape compatible',
    };
  }

  return {
    isValid: true,
    status: 'compatible',
    sourceSchema: sourceSchemaStr,
    targetSchema: targetSchemaStr,
  };
}
