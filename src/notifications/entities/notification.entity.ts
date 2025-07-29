import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DELIVERED = 'DELIVERED', // For actual delivery receipts (stretch goal)
  RETRIED = 'RETRIED',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  event_type: string; // The original event type (e.g., 'order.created')

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  correlation_id: string; // ID from the originating service (e.g., orderId, invoiceId)

  @Column({ type: 'varchar', length: 50 })
  channel: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  @Index()
  status: NotificationStatus;

  @Column({ type: 'text', nullable: true })
  subject: string | null; // Final rendered subject (for email/SMS)

  @Column({ type: 'text' })
  body: string | null; // Final rendered content

  @Column({ type: 'timestamp with time zone', nullable: true })
  sent_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  failed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  error_details: string | null;

  @Column({ type: 'int', default: 0 })
  retries_count: number;

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
