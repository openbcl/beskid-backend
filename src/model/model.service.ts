import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from './model';

@Injectable()
export class ModelService {
  models: Model[] = [
    { name: 'model1', resolutions: [100] },
    { name: 'model2', resolutions: [100] },
  ].map((value, key) => ({ id: key + 1, ...value }));

  findModelByName(modelName: string) {
    return this.models.find((model) => model.name === modelName);
  }

  findModel(modelId: number) {
    if (modelId < 0 || modelId > this.models.length) {
      throw new NotFoundException();
    }
    return this.models.find((model) => model.id === modelId);
  }

  findModels() {
    return this.models;
  }
}
