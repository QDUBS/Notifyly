export class CreateNotificationDto {}

import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationStatus } from 'src/notifications/entities/notification.entity';

export class NotificationDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'd7e9f8a0-b1c2-3d4e-5f6a-7b8c9d0e1f2a' })
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'order.created' })
  @IsString()
  eventType: string;

  @ApiProperty({ example: 'ORD-XYZ-123', nullable: true })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiProperty({ example: 'email' })
  @IsString()
  channel: string;

  @ApiProperty({ enum: NotificationStatus, example: NotificationStatus.SENT })
  @IsEnum(NotificationStatus)
  status: NotificationStatus;

  @ApiProperty({ example: 'Your Order is Confirmed!', nullable: true })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ example: 'Hi John, your order ORD-XYZ-123 has been placed.' })
  @IsString()
  body: string;

  @ApiProperty({ example: '2025-07-27T10:00:00Z', nullable: true })
  @IsOptional()
  @IsDateString()
  sentAt?: Date;

  @ApiProperty({ example: '2025-07-27T10:05:00Z', nullable: true })
  @IsOptional()
  @IsDateString()
  failedAt?: Date;

  @ApiProperty({ example: 'SMTP error: Connection refused', nullable: true })
  @IsOptional()
  @IsString()
  errorDetails?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  retriesCount: number;

  @ApiProperty({ example: '2025-07-27T09:59:00Z' })
  @IsDateString()
  createdAt: Date;

  @ApiProperty({ example: '2025-07-27T10:00:00Z' })
  @IsDateString()
  updatedAt: Date;
}
