import { Controller, Get, Param } from '@nestjs/common';
import { ModelService } from './model.service';

@Controller('models')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Get(':id')
  getModel(@Param() params: any) {
    return this.modelService.getModel(params.id);
  }

  @Get()
  getModels() {
    return this.modelService.getModels();
  }
}
