export interface AuditLogInput {
  userId: string;
  userEmail: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'VIEW' | 'LIFECYCLE_TRANSITION';
  entityType: string;
  entityId: string;
  entityName?: string;
  changes?: any;
  // Added these to fix the lifecycle.service error
  oldValue?: any; 
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface AuditFilters {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}