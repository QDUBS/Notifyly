import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { NotificationDto } from 'src/notifications/dto/create-notification.dto';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { UserPreferencesResponseDto } from './dto/user-preferences-response.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me/preferences')
  @ApiOperation({ summary: 'Get current user notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'User preferences retrieved successfully.',
    type: UserPreferencesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMyPreferences(@Request() req): Promise<UserPreferencesResponseDto> {
    const userId = req.user.userId;
    return this.usersService.getUserPreferences(userId);
  }

  @Put('me/preferences')
  @ApiOperation({ summary: 'Update current user notification preferences' })
  @ApiResponse({
    status: 200,
    description: 'User preferences updated successfully.',
    type: UserPreferencesResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updateMyPreferences(
    @Request() req,
    @Body() updateUserPreferencesDto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    const userId = req.user.userId;
    return this.usersService.updateUserPreferences(
      userId,
      updateUserPreferencesDto,
    );
  }

  @Get('me/notifications/in-app')
  @ApiOperation({
    summary:
      'Get paginated list of past in-app notifications for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'In-app notifications retrieved successfully.',
    type: [NotificationDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMyInAppNotifications(@Request() req): Promise<NotificationDto[]> {
    const userId = req.user.userId;
    return this.usersService.getInAppNotifications(userId);
  }
}
