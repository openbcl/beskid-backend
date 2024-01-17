import { Controller, Get, Param } from '@nestjs/common';
import { ModelService } from './model.service';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Model } from './model';

@ApiTags('AI Models')
@ApiBearerAuth()
@Controller({
  path: 'models',
  version: '1',
})
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Get(':modelId')
  @ApiResponse({ type: Model })
  findModel(@Param('modelId') modelId: number) {
    return this.modelService.findModel(modelId);
  }

  @Get()
  @ApiResponse({ type: [Model] })
  findModels() {
    return this.modelService.findModels();
  }
}
