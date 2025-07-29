import { join } from 'path';
import { EventNotificationMapping } from 'src/events/entities/event-notification-mapping.entity';
import { NotificationTemplate } from 'src/notifications/entities/notification-template.entity';
import { DataSource } from 'typeorm';
import databaseConfig from '../../config/database.config';

async function seed() {
  const config = databaseConfig();
  const dataSource = new DataSource({
    ...config,
    entities: [
      NotificationTemplate,
      EventNotificationMapping,
      join(__dirname, '..', '..', '**', '*.entity.{ts,js}'),
    ],
  });

  await dataSource.initialize();
  console.log('Database connection initialized for seeding.');

  const templateRepository = dataSource.getRepository(NotificationTemplate);
  const mappingRepository = dataSource.getRepository(EventNotificationMapping);

  try {
    // Clear existing data
    await mappingRepository.clear();
    await templateRepository.clear();
    console.log('Cleared existing templates and mappings.');

    // Insert Notification Templates
    const templatesData = [
      {
        type: 'order.created',
        channel: 'email',
        subject_template: 'Your Order {{orderId}} is Confirmed!',
        body_template:
          'Hi {{userName}}, your order {{orderId}} has been successfully placed. Total: ${{totalAmount}}.',
      },
      {
        type: 'order.created',
        channel: 'in_app',
        body_template:
          'Your order {{orderId}} for ${{totalAmount}} is confirmed.',
      },
      {
        type: 'invoice.paid',
        channel: 'sms',
        body_template: 'Invoice {{invoiceId}} for ${{amount}} paid. Thanks!',
      },
      {
        type: 'invoice.paid',
        channel: 'in_app',
        body_template: 'Your invoice {{invoiceId}} has been paid successfully.',
      },
      {
        type: 'password.reset_request',
        channel: 'email',
        subject_template: 'Password Reset Request',
        body_template:
          'Hello {{userName}}, you requested a password reset. Click here: {{resetLink}}',
      },
    ];

    const insertedTemplates = await templateRepository.save(templatesData);
    console.log('Notification templates seeded successfully.');

    // Insert Event Notification Mappings
    const orderCreatedEmailTemplate = insertedTemplates.find(
      (t) => t.type === 'order.created' && t.channel === 'email',
    );
    const orderCreatedInAppTemplate = insertedTemplates.find(
      (t) => t.type === 'order.created' && t.channel === 'in_app',
    );
    const invoicePaidSmsTemplate = insertedTemplates.find(
      (t) => t.type === 'invoice.paid' && t.channel === 'sms',
    );
    const invoicePaidInAppTemplate = insertedTemplates.find(
      (t) => t.type === 'invoice.paid' && t.channel === 'in_app',
    );
    const passwordResetEmailTemplate = insertedTemplates.find(
      (t) => t.type === 'password.reset_request' && t.channel === 'email',
    );

    const mappingsData = [
      {
        event_type: 'order.created',
        default_channels: ['email', 'in_app'],
        template_id_email: orderCreatedEmailTemplate?.id,
        template_id_in_app: orderCreatedInAppTemplate?.id,
        rules: {},
      },
      {
        event_type: 'invoice.paid',
        default_channels: ['sms', 'in_app'],
        template_id_sms: invoicePaidSmsTemplate?.id,
        template_id_in_app: invoicePaidInAppTemplate?.id,
        rules: {},
      },
      {
        event_type: 'password.reset_request',
        default_channels: ['email'],
        template_id_email: passwordResetEmailTemplate?.id,
        rules: {},
      },
    ];

    await mappingRepository.save(mappingsData);
    console.log('Event notification mappings seeded successfully.');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed.');
  }
}

seed();
