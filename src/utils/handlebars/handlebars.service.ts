import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';

@Injectable()
export class HandlebarsService {
  renderTemplate(templateString: string, data: any): string {
    const template = Handlebars.compile(templateString);
    return template(data);
  }
}
