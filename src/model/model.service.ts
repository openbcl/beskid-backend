import { Injectable, NotFoundException } from '@nestjs/common';
import { models } from '../config';

@Injectable()
export class ModelService {
  findModelByName(modelName: string) {
    return models.find((model) => model.name === modelName);
  }

  findModel(modelId: number) {
    if (modelId < 0 || modelId > models.length) {
      throw new NotFoundException();
    }
    return models.find((model) => model.id === modelId);
  }

  findModels() {
    return models;
  }
}
