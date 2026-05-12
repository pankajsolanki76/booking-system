import { Test, TestingModule } from '@nestjs/testing';
import { SeatController } from './seat.controller';
import { SeatService } from './seat.service';

describe('SeatController', () => {
  let controller: SeatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeatController],
      providers: [
        {
          provide: SeatService,
          useValue: {
            createScreenSeat: jest.fn(),
            getShowSeats: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SeatController>(SeatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
