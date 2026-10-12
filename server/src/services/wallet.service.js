export const INR_PER_VERTEX_COIN = 2.5;
export const PAISE_PER_INR = 100;
export const PAISE_PER_VERTEX_COIN = INR_PER_VERTEX_COIN * PAISE_PER_INR;

export function assertWholeCoinAmount(value) {
  const coins = Number(value);
  if (!Number.isSafeInteger(coins) || coins <= 0) {
    const error = new Error('Coin amount must be a positive whole number');
    error.status = 422;
    throw error;
  }
  return coins;
}

export function coinsToInrPaise(coins) {
  return assertWholeCoinAmount(coins) * PAISE_PER_VERTEX_COIN;
}

export function paiseToInr(paise) {
  return Number((Number(paise || 0) / PAISE_PER_INR).toFixed(2));
}

export function coinsToInr(coins) {
  if (!Number.isFinite(Number(coins)) || Number(coins) < 0) return 0;
  return paiseToInr(Math.round(Number(coins) * PAISE_PER_VERTEX_COIN));
}

export function inrToCoins(inr) {
  const paise = Math.round(Number(inr || 0) * PAISE_PER_INR);
  return Math.ceil(paise / PAISE_PER_VERTEX_COIN);
}
