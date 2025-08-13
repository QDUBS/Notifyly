import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { ReceiveEventDto } from './dto/receive-event.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly notificationsService: NotificationsService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async handleIncomingEvent(eventDto: ReceiveEventDto): Promise<void> {
    this.logger.debug(`Received incoming event: ${eventDto.eventType}`);
    
    await this.notificationsService.processEvent(
      eventDto.eventType,
      eventDto.payload,
    );
  }
}
