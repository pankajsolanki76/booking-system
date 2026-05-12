import { IsBoolean } from 'class-validator';

export class ProcessPaymentDto {
  @IsBoolean()
  simulateSuccess!: boolean;
}
