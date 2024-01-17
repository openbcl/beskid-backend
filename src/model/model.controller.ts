import { Controller, Get, Param } from '@nestjs/common';
import { ModelService } from './model.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('AI Models')
@ApiBearerAuth()
@Controller({
  path: 'models',
  version: '1',
})
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Get(':modelId')
  findModel(@Param('modelId') modelId: number) {
    return this.modelService.findModel(modelId);
  }

  @Get()
  findModels() {
    return this.modelService.findModels();
  }
}
