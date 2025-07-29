import { IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserPreferencesJson } from 'src/users/entities/user-preference.entity';

export class UserPreferencesResponseDto {
  @ApiProperty({ example: 'd7e9f8a0-b1c2-3d4e-5f6a-7b8c9d0e1f2a' })
  @IsString()
  userId: string;

  @ApiProperty({
    example: {
      global: { email: true, sms: false, in_app: true },
      notificationTypes: {
        'order.shipped': { email: true, sms: false },
      },
    },
  })
  @IsObject()
  preferences: UserPreferencesJson;
}
