import { Controller, Get, Param } from '@nestjs/common';
import { ModelService } from './model.service';

@Controller('models')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Get(':modelId')
  getModel(@Param('modelId') modelId: string) {
    return this.modelService.getModel(modelId);
  }

  @Get()
  getModels() {
    return this.modelService.getModels();
  }
}
