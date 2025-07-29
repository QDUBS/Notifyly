import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationStatus } from 'src/notifications/entities/notification.entity';

export class NotificationFilterDto {
  @ApiProperty({
    enum: NotificationStatus,
    required: false,
    example: NotificationStatus.FAILED,
  })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiProperty({ example: 'order.created', required: false })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiProperty({ example: 'email', required: false })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiProperty({
    example: 'd7e9f8a0-b1c2-3d4e-5f6a-7b8c9d0e1f2a',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ example: 'ORD-XYZ-123', required: false })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiProperty({ example: '2025-07-01T00:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiProperty({ example: '2025-07-31T23:59:59Z', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;
}
