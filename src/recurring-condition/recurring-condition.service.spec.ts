import { Test, TestingModule } from '@nestjs/testing';
import { RecurringConditionService } from './recurring-condition.service';

describe('RecurringConditionService', () => {
  let service: RecurringConditionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecurringConditionService],
    }).compile();

    service = module.get<RecurringConditionService>(RecurringConditionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
