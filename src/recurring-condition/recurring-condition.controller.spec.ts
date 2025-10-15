import { Test, TestingModule } from '@nestjs/testing';
import { RecurringConditionController } from './recurring-condition.controller';

describe('RecurringConditionController', () => {
  let controller: RecurringConditionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecurringConditionController],
    }).compile();

    controller = module.get<RecurringConditionController>(RecurringConditionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
