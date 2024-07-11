import amqp from 'amqplib';
import logger from '../logger';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    logger.info('RabbitMQ connected');
  } catch (error) {
    const err = error as Error;
    logger.error(`RabbitMQ connection error: ${err.message}`);
  }
};

export const publishToQueue = async (
  queue: string,
  message: any
): Promise<any> => {
  if (!channel) {
    await connectRabbitMQ();
  }

  try {
    const correlationId = Math.random().toString();
    const replyQueue = 'amq.rabbitmq.reply-to';

    await channel.assertQueue(queue, { durable: true });

    return new Promise((resolve) => {
      const consumerTag = `consumer-${correlationId}`;

      channel.consume(
        replyQueue,
        (msg) => {
          if (msg?.properties.correlationId === correlationId) {
            const response = JSON.parse(msg.content.toString());
            resolve(response);
            channel.cancel(consumerTag);
          }
        },
        { noAck: true, consumerTag }
      );

      channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
        correlationId,
        replyTo: replyQueue,
      });

      logger.info(`Message sent to queue ${queue}: ${JSON.stringify(message)}`);
    });
  } catch (error) {
    const err = error as Error;
    logger.error(`Error publishing message: ${err.message}`);
    throw error;
  }
};
