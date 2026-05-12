import { Test, TestingModule } from '@nestjs/testing';
import { ScreenController } from './screen.controller';
import { ScreenService } from './screen.service';

describe('ScreenController', () => {
  let controller: ScreenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScreenController],
      providers: [
        {
          provide: ScreenService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ScreenController>(ScreenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
