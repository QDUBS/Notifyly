import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { NotificationDto } from 'src/notifications/dto/create-notification.dto';
import { NotificationFilterDto } from 'src/notifications/dto/notification-filter.dto';

@ApiTags('Admin')
@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('notifications')
  @ApiOperation({
    summary:
      'Get paginated list of all notifications with filters (Admin only)',
  })
  @ApiQuery({
    name: 'status',
    enum: ['PENDING', 'SENT', 'FAILED', 'DELIVERED', 'RETRIED'],
    required: false,
  })
  @ApiQuery({ name: 'eventType', type: String, required: false })
  @ApiQuery({ name: 'channel', type: String, required: false })
  @ApiQuery({ name: 'userId', type: String, required: false })
  @ApiQuery({ name: 'correlationId', type: String, required: false })
  @ApiQuery({
    name: 'startDate',
    type: String,
    required: false,
    description: 'ISO 8601 date string',
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    required: false,
    description: 'ISO 8601 date string',
  })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiQuery({ name: 'offset', type: Number, required: false })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully.',
    type: [NotificationDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires admin role.' })
  async getAllNotifications(
    @Query() filterDto: NotificationFilterDto,
  ): Promise<NotificationDto[]> {
    return this.adminService.getNotifications(filterDto);
  }

  @Get('notifications/:notificationId')
  @ApiOperation({
    summary: 'Get details of a specific notification by ID (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification details retrieved successfully.',
    type: NotificationDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires admin role.' })
  async getNotificationById(
    @Param('notificationId') notificationId: string,
  ): Promise<NotificationDto> {
    return this.adminService.getNotificationDetails(notificationId);
  }

  @Post('notifications/:notificationId/retry')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Retry a failed notification (Admin only)' })
  @ApiResponse({ status: 202, description: 'Notification retry initiated.' })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  @ApiResponse({
    status: 400,
    description: 'Notification cannot be retried (e.g., not in FAILED status).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires admin role.' })
  async retryNotification(
    @Param('notificationId') notificationId: string,
  ): Promise<{ message: string }> {
    await this.adminService.retryFailedNotification(notificationId);
    return { message: 'Notification retry initiated.' };
  }
}
