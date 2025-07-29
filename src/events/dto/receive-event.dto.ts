import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsString
} from 'class-validator';

export class ReceiveEventDto {
  @ApiProperty({ example: 'order.created', description: 'Type of the event' })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiProperty({
    example: {
      userId: 'd7e9f8a0-b1c2-3d4e-5f6a-7b8c9d0e1f2a',
      orderId: 'ORD-001-XYZ',
      userName: 'Alice',
      email: 'alice@example.com',
      phoneNumber: '+1234567890',
      totalAmount: 99.99,
    },
    description:
      'Payload containing event-specific data and recipient information',
  })
  @IsObject()
  @IsNotEmpty()
  payload: {
    userId: string;
    email?: string;
    phoneNumber?: string;
    [key: string]: any;
  };
}
