export const INR_PER_VERTEX_COIN = 2.5;

export function coinsToInr(coins) {
  return Number((Number(coins || 0) * INR_PER_VERTEX_COIN).toFixed(2));
}

export function inrToCoins(inr) {
  return Math.ceil(Number(inr || 0) / INR_PER_VERTEX_COIN);
}
