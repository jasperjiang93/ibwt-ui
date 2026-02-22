/**
 * Price Oracle - Get real-time SOL/USD prices from Jupiter
 */

const JUPITER_PRICE_API = 'https://price.jup.ag/v6/price';

// Token addresses
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

interface PriceData {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
}

interface JupiterPriceResponse {
  data: Record<string, PriceData>;
  timeTaken: number;
}

/**
 * Get current SOL price in USD
 */
export async function getSolPrice(): Promise<number> {
  try {
    const response = await fetch(`${JUPITER_PRICE_API}?ids=${SOL_MINT}&vsToken=${USDC_MINT}`);
    const data: JupiterPriceResponse = await response.json();
    return data.data[SOL_MINT]?.price || 0;
  } catch (error) {
    console.error('Error fetching SOL price:', error);
    throw new Error('Failed to fetch SOL price');
  }
}

/**
 * Convert USD to SOL
 */
export async function usdToSol(usdAmount: number): Promise<number> {
  const solPrice = await getSolPrice();
  if (solPrice === 0) throw new Error('Invalid SOL price');
  return usdAmount / solPrice;
}

/**
 * Convert SOL to USD
 */
export async function solToUsd(solAmount: number): Promise<number> {
  const solPrice = await getSolPrice();
  return solAmount * solPrice;
}

/**
 * Get multiple token prices
 */
export async function getTokenPrices(mints: string[]): Promise<Record<string, number>> {
  try {
    const response = await fetch(`${JUPITER_PRICE_API}?ids=${mints.join(',')}&vsToken=${USDC_MINT}`);
    const data: JupiterPriceResponse = await response.json();
    
    const prices: Record<string, number> = {};
    for (const mint of mints) {
      prices[mint] = data.data[mint]?.price || 0;
    }
    return prices;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    throw new Error('Failed to fetch token prices');
  }
}
