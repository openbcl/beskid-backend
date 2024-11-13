import { Controller, Get, Param, Query } from '@nestjs/common';
import { ModelService } from './model.service';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Model, ModelDto } from './model';

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
    return toDto(this.modelService.findModel(modelId));
  }

  @Get()
  @ApiResponse({
    type: [Model],
    status: 200,
    description: 'Request all available AI models.',

  })
  findModels() {
    return this.modelService.findModels().map(model => toDto(model));
  }
}

const toDto = (model: Model): ModelDto => ({
  id: model.id,
  name: model.name,
  description: model.description,
  resolution: model.resolution,
  experiments: model.experiments,
  fds: model.fds,
  hasTemplate: model.hasTemplate,
  disabled: model.disabled,
});