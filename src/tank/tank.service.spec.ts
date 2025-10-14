import { Test, TestingModule } from '@nestjs/testing';
import { TankService } from './tank.service';

describe('TankService', () => {
  let service: TankService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TankService],
    }).compile();

    service = module.get<TankService>(TankService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
