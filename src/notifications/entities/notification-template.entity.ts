import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  type: string; // e.g., 'order.created'

  @Column({ type: 'varchar', length: 50 })
  channel: string; // 'email', 'sms', 'in_app'

  @Column({ type: 'text', nullable: true })
  subject_template: string; // For email/SMS, e.g., "Your Order {{orderId}} is Confirmed!"

  @Column({ type: 'text' })
  body_template: string; // e.g., "Hi {{userName}}, your order {{orderId}} has shipped!"

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
