// backend/src/events/events.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { v4 as uuid } from 'uuid';

export interface EventPayload {
  id?: string;
  type: string;
  timestamp?: Date;
  source?: string;
  data: any;
  metadata?: Record<string, any>;
}

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly exchangeName = 'epc-events';
  private readonly dlxName = 'epc-events-dlx';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const rabbitUrl = this.configService.get<string>('RABBITMQ_URL');
      
      this.connection = await amqp.connect(rabbitUrl);
      this.channel = await this.connection.createChannel();

      // Create main exchange (topic)
      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true,
      });

      // Create Dead Letter Exchange
      await this.channel.assertExchange(this.dlxName, 'topic', {
        durable: true,
      });

      console.log('✅ RabbitMQ connected and exchanges created');
    } catch (error) {
      console.error('❌ RabbitMQ connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
      await this.connection?.close();
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error);
    }
  }

  /**
   * Publish an event to the event bus
   */
  async publish(eventType: string, data: any, metadata?: Record<string, any>): Promise<void> {
    const event: EventPayload = {
      id: uuid(),
      type: eventType,
      timestamp: new Date(),
      source: 'epc-system',
      data,
      metadata: {
        ...metadata,
        correlationId: metadata?.correlationId || uuid(),
      },
    };

    try {
      const routingKey = eventType.replace('.', '_');
      
      this.channel.publish(
        this.exchangeName,
        routingKey,
        Buffer.from(JSON.stringify(event)),
        {
          persistent: true,
          contentType: 'application/json',
          messageId: event.id,
          timestamp: event.timestamp.getTime(),
        }
      );

      console.log(`📤 Event published: ${eventType}`, { eventId: event.id });
    } catch (error) {
      console.error(`Failed to publish event ${eventType}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to events with a specific pattern
   */
  async subscribe(
    pattern: string,
    queueName: string,
    handler: (event: EventPayload) => Promise<void>
  ): Promise<void> {
    try {
      // Create queue with DLX
      const queue = await this.channel.assertQueue(queueName, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': this.dlxName,
          'x-dead-letter-routing-key': `dlx.${pattern}`,
        },
      });

      // Bind queue to exchange with pattern
      const routingKey = pattern.replace('.', '_');
      await this.channel.bindQueue(queue.queue, this.exchangeName, routingKey);

      // Consume messages
      await this.channel.consume(
        queue.queue,
        async (msg) => {
          if (!msg) return;

          try {
            const event: EventPayload = JSON.parse(msg.content.toString());
            console.log(`📥 Event received: ${event.type}`, { eventId: event.id });

            await handler(event);

            // Acknowledge successful processing
            this.channel.ack(msg);
          } catch (error) {
            console.error(`Error handling event:`, error);
            
            // Reject and requeue (will go to DLX after max retries)
            this.channel.nack(msg, false, false);
          }
        },
        {
          noAck: false,
        }
      );

      console.log(`✅ Subscribed to pattern: ${pattern} on queue: ${queueName}`);
    } catch (error) {
      console.error(`Failed to subscribe to pattern ${pattern}:`, error);
      throw error;
    }
  }

  /**
   * Publish multiple events in batch
   */
  async publishBatch(events: Array<{ type: string; data: any }>): Promise<void> {
    await Promise.all(
      events.map(event => this.publish(event.type, event.data))
    );
  }
}

// backend/src/events/events.module.ts
import { Module, Global } from '@nestjs/common';
import { EventsService } from './events.service';

@Global()
@Module({
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}

// backend/src/events/event-types.ts
export const EventTypes = {
  // Product Events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  PRODUCT_ACTIVATED: 'product.activated',
  PRODUCT_RETIRED: 'product.retired',

  // Offering Events
  OFFERING_CREATED: 'offering.created',
  OFFERING_UPDATED: 'offering.updated',
  OFFERING_DELETED: 'offering.deleted',
  OFFERING_PRICE_CHANGED: 'offering.price_changed',

  // Subscription Events
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_ACTIVATED: 'subscription.activated',
  SUBSCRIPTION_SUSPENDED: 'subscription.suspended',
  SUBSCRIPTION_TERMINATED: 'subscription.terminated',
  SUBSCRIPTION_UPDATED: 'subscription.updated',

  // Service Events
  SERVICE_PROVISIONED: 'service.provisioned',
  SERVICE_DEPROVISIONED: 'service.deprovisioned',
  SERVICE_MODIFIED: 'service.modified',

  // Resource Events
  RESOURCE_ALLOCATED: 'resource.allocated',
  RESOURCE_RELEASED: 'resource.released',

  // Lifecycle Events
  LIFECYCLE_TRANSITION_REQUESTED: 'lifecycle.transition_requested',
  LIFECYCLE_TRANSITION_APPROVED: 'lifecycle.transition_approved',
  LIFECYCLE_TRANSITION_REJECTED: 'lifecycle.transition_rejected',
  LIFECYCLE_TRANSITION_EXECUTED: 'lifecycle.transition_executed',

  // Pricing Events
  PRICING_PLAN_CREATED: 'pricing.plan_created',
  PRICING_PLAN_UPDATED: 'pricing.plan_updated',
  PRICING_CALCULATED: 'pricing.calculated',
} as const;