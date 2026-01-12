import { Test, TestingModule } from '@nestjs/testing';
import { FeedIncreaseConditionController } from './feed-increase-condition.controller';

describe('FeedIncreaseConditionController', () => {
  let controller: FeedIncreaseConditionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedIncreaseConditionController],
    }).compile();

    controller = module.get<FeedIncreaseConditionController>(FeedIncreaseConditionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
