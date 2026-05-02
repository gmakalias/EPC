import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { v4 as uuid } from 'uuid';
import { EventPayload } from './event-types';

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly exchangeName = 'epc-events';
  private readonly dlxName = 'epc-events-dlx';

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  private async connect() {
    try {
      const rabbitUrl = this.configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672';
      
      this.connection = await amqp.connect(rabbitUrl);
      this.channel = await this.connection.createChannel();

      // Ensure exchanges exist
      await Promise.all([
        this.channel.assertExchange(this.exchangeName, 'topic', { durable: true }),
        this.channel.assertExchange(this.dlxName, 'topic', { durable: true })
      ]);

      this.logger.log('✅ RabbitMQ connected and exchanges created');
      
      // Handle connection closure
      this.connection.on('close', () => {
        this.logger.error('RabbitMQ connection closed. Attempting to reconnect...');
        setTimeout(() => this.connect(), 5000);
      });
    } catch (error) {
      this.logger.error('❌ RabbitMQ connection failed:', error.message);
      // In a production microservice, you might want to retry here
    }
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }

  async publish(eventType: string, data: any, metadata?: Record<string, any>): Promise<void> {
    if (!this.channel) {
      this.logger.error(`Cannot publish ${eventType}: No RabbitMQ channel available`);
      return;
    }

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
      const routingKey = eventType.replace(/\./g, '_');
      
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

      this.logger.debug(`📤 Event published: ${eventType} (${event.id})`);
    } catch (error) {
      this.logger.error(`Failed to publish event ${eventType}:`, error);
      throw error;
    }
  }

  async subscribe(
    pattern: string,
    queueName: string,
    handler: (event: EventPayload) => Promise<void>
  ): Promise<void> {
    const queue = await this.channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': this.dlxName,
        'x-dead-letter-routing-key': `dlx.${pattern}`,
      },
    });

    const routingKey = pattern.replace(/\./g, '_');
    await this.channel.bindQueue(queue.queue, this.exchangeName, routingKey);

    await this.channel.consume(queue.queue, async (msg) => {
      if (!msg) return;
      try {
        const event: EventPayload = JSON.parse(msg.content.toString());
        await handler(event);
        this.channel.ack(msg);
      } catch (error) {
        this.logger.error(`Error handling event: ${error.message}`);
        this.channel.nack(msg, false, false); // Send to DLX
      }
    });

    this.logger.log(`✅ Subscribed to: ${pattern} [Queue: ${queueName}]`);
  }

  async publishBatch(events: Array<{ type: string; data: any }>): Promise<void> {
    await Promise.all(events.map(event => this.publish(event.type, event.data)));
  }
}