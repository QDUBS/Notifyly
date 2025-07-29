import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { NotificationDto } from './create-notification.dto';

export class NotificationStatusResponseDto {
  @ApiProperty({ example: 'ORD-XYZ-123' })
  @IsString()
  correlationId: string;

  @ApiProperty({
    type: [NotificationDto],
    description: 'List of notifications related to the correlation ID',
  })
  @IsArray()
  notifications: NotificationDto[];
}
