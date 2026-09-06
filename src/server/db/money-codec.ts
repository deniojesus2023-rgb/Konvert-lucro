import { toDerivedCents, type Cents } from "@/domain/money/cents";

/**
 * Money lives in PostgreSQL as `bigint`, which the driver hands back as a
 * string (or bigint) precisely because it can hold values a JS `number`
 * cannot represent exactly.
 *
 * Every read goes through here: a value outside the safe-integer range is
 * rejected loudly rather than silently truncated — the same principle as
 * `UnsafeIntegerRangeError` in the domain layer. Losing precision on money
 * is never an acceptable fallback.
 */
export function centsFromDb(value: string | number | bigint | null): Cents | null {
  if (value === null) return null;

  const asBigInt = typeof value === "bigint" ? value : BigInt(value);

  if (
    asBigInt > BigInt(Number.MAX_SAFE_INTEGER) ||
    asBigInt < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    throw new RangeError(
      `Valor monetário no banco fora do intervalo seguro de inteiros: ${asBigInt.toString()}`,
    );
  }

  return toDerivedCents(Number(asBigInt));
}

/** Same guard for plain counts (orders), which are also stored as bigint. */
export function countFromDb(value: string | number | bigint | null): number | null {
  if (value === null) return null;

  const asBigInt = typeof value === "bigint" ? value : BigInt(value);

  if (
    asBigInt > BigInt(Number.MAX_SAFE_INTEGER) ||
    asBigInt < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    throw new RangeError(
      `Contagem no banco fora do intervalo seguro de inteiros: ${asBigInt.toString()}`,
    );
  }

  return Number(asBigInt);
}

/** Writes go out as `bigint` so the value never round-trips through a float. */
export function centsToDb(value: number | null): bigint | null {
  if (value === null) return null;
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Valor monetário inválido para gravação: ${value}`);
  }
  return BigInt(value);
}
