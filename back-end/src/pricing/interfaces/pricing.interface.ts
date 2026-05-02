export interface PriceCalculationRequest {
  offeringId: string;
  quantity?: number;
  customerId?: string;
  characteristics?: Record<string, any>;
  discountCodes?: string[];
}

export interface PriceBreakdown {
  basePrice: number;
  discounts: {
    product: number;
    bundle: number;
    customer: number;
    promotional: number;
  };
  subtotal: number;
  taxes: number;
  total: number;
  currency: string;
  breakdown: Array<{
    name: string;
    amount: number;
    type: string;
  }>;
}