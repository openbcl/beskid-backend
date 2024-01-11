import { Controller, Get, Param } from '@nestjs/common';
import { ModelService } from './model.service';

@Controller('models')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Get(':modelId')
  findModel(@Param('modelId') modelId: string) {
    return this.modelService.findModel(modelId);
  }

  @Get()
  findModels() {
    return this.modelService.findModels();
  }
}
