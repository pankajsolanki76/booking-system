import { PartialType } from '@nestjs/swagger';
import { CreateScreenSeatDto } from './create-screen-seat.dto';

export class UpdateScreenSeatDto extends PartialType(CreateScreenSeatDto) {}
