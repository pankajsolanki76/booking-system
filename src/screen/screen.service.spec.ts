import { Test, TestingModule } from '@nestjs/testing';
import { ScreenService } from './screen.service';
import { ScreenRepository } from './screen.repository';
import { VenueRepository } from '../venue/venue.repository';

describe('ScreenService', () => {
  let service: ScreenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScreenService,
        {
          provide: ScreenRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: VenueRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ScreenService>(ScreenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
