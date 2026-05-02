export const EventTypes = {
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  PRODUCT_ACTIVATED: 'product.activated',
  PRODUCT_RETIRED: 'product.retired',
  OFFERING_CREATED: 'offering.created',
  OFFERING_UPDATED: 'offering.updated',
  OFFERING_DELETED: 'offering.deleted',
  OFFERING_PRICE_CHANGED: 'offering.price_changed',
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_ACTIVATED: 'subscription.activated',
  SUBSCRIPTION_SUSPENDED: 'subscription.suspended',
  SUBSCRIPTION_TERMINATED: 'subscription.terminated',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SERVICE_PROVISIONED: 'service.provisioned',
  SERVICE_DEPROVISIONED: 'service.deprovisioned',
  SERVICE_MODIFIED: 'service.modified',
  RESOURCE_ALLOCATED: 'resource.allocated',
  RESOURCE_RELEASED: 'resource.released',
  LIFECYCLE_TRANSITION_REQUESTED: 'lifecycle.transition_requested',
  LIFECYCLE_TRANSITION_APPROVED: 'lifecycle.transition_approved',
  LIFECYCLE_TRANSITION_REJECTED: 'lifecycle.transition_rejected',
  LIFECYCLE_TRANSITION_EXECUTED: 'lifecycle.transition_executed',
  PRICING_PLAN_CREATED: 'pricing.plan_created',
  PRICING_PLAN_UPDATED: 'pricing.plan_updated',
  PRICING_CALCULATED: 'pricing.calculated',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];

export interface EventPayload {
  id?: string;
  type: string;
  timestamp: Date;
  source: string;
  data: any;
  metadata?: Record<string, any>;
}