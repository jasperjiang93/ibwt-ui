const IBWT_USD_RATE = 0.0001;

export function ibwtToUsd(ibwt: number): string {
  const usd = parseFloat((ibwt * IBWT_USD_RATE).toPrecision(10));
  if (usd >= 1) return `$${usd.toFixed(2)}`;
  if (usd >= 0.01) return `$${parseFloat(usd.toFixed(4))}`;
  return `$${usd}`;
}
