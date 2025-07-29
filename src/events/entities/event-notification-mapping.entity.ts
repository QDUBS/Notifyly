import { NotificationTemplate } from 'src/notifications/entities/notification-template.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('event_notification_mappings')
export class EventNotificationMapping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  event_type: string; // e.g., 'order.created'

  @Column({ type: 'varchar', array: true })
  default_channels: string[]; // e.g., ['email', 'in_app']

  @Column({ type: 'int', nullable: true })
  template_id_email: number;

  @OneToOne(() => NotificationTemplate)
  @JoinColumn({ name: 'template_id_email' })
  template_email: NotificationTemplate;

  @Column({ type: 'int', nullable: true })
  template_id_sms: number;

  @OneToOne(() => NotificationTemplate)
  @JoinColumn({ name: 'template_id_sms' })
  template_sms: NotificationTemplate;

  @Column({ type: 'int', nullable: true })
  template_id_in_app: number;

  @OneToOne(() => NotificationTemplate)
  @JoinColumn({ name: 'template_id_in_app' })
  template_in_app: NotificationTemplate;

  @Column({ type: 'jsonb', default: {} })
  rules: Record<string, any>; // e.g., {"priority": "high", "debounceSeconds": 30}

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
