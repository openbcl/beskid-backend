import { Controller, Get, Param, Query } from '@nestjs/common';
import { ModelService } from './model.service';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiResponse({
    type: Model,
    status: 200,
    description: 'Request a selected AI model.',
  })
  findModel(@Param('modelId') modelId: number) {
    return this.modelService.findModel(modelId);
  }

  @Get()
  @ApiResponse({
    type: [Model],
    status: 200,
    description: 'Request all available AI models.',
  })
  findModels() {
    return this.modelService.findModels();
  }
}
