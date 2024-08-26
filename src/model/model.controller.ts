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
  @ApiQuery({
    name: "fdsVersion",
    type: String,
    description: "Filter models by FDS version (optional)",
    required: false
  })
  @ApiQuery({
    name: "experimentID",
    type: String,
    description: "Filter models by experiment (optional)",
    required: false
  })
  findModels(
    @Query('fdsVersion') fdsVersion?: string,
    @Query('experimentID') experimentID?: string
  ) {
    return this.modelService.findModels(fdsVersion, experimentID?.toUpperCase());
  }
}
