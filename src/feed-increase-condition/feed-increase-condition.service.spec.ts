import { Test, TestingModule } from '@nestjs/testing';
import { FeedIncreaseConditionService } from './feed-increase-condition.service';

describe('FeedIncreaseConditionService', () => {
  let service: FeedIncreaseConditionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FeedIncreaseConditionService],
    }).compile();

    service = module.get<FeedIncreaseConditionService>(FeedIncreaseConditionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
