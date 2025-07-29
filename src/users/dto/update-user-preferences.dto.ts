import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  ValidateNested
} from 'class-validator';

class ChannelPreferenceDto {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  in_app?: boolean;
}

export class UpdateUserPreferencesDto {
  @ApiProperty({ type: ChannelPreferenceDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ChannelPreferenceDto)
  global?: ChannelPreferenceDto;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'object',
      properties: {
        email: { type: 'boolean' },
        sms: { type: 'boolean' },
        in_app: { type: 'boolean' },
      },
    },
    example: {
      'order.shipped': { email: true, sms: false },
      'billing.invoice_paid': { in_app: true },
    },
  })
  @IsOptional()
  @IsObject()
  notificationTypes?: { [eventType: string]: ChannelPreferenceDto };
}
