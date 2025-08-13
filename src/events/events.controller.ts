import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReceiveEventDto } from './dto/receive-event.dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('api/v1/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('receive')
  @HttpCode(HttpStatus.ACCEPTED) // Indicate that the request is accepted for processing
  @ApiOperation({
    summary:
      'Receive an event from another service for notification processing',
  })
  @ApiResponse({
    status: 202,
    description: 'Event received and processing initiated.',
  })
  @ApiResponse({ status: 400, description: 'Invalid event payload.' })
  async receiveEvent(
    @Body() receiveEventDto: ReceiveEventDto,
  ): Promise<{ message: string }> {
    await this.eventsService.handleIncomingEvent(receiveEventDto);
    return { message: 'Event received and processing initiated.' };
  }
}
