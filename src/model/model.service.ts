import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from './model';

@Injectable()
export class ModelService {
  models: Model[] = [
    { name: 'model1', resolutions: [100] },
    { name: 'model1', resolutions: [100] },
    { name: 'model3', resolutions: [100] },
    { name: 'model4', resolutions: [100] },
    { name: 'model5', resolutions: [100] },
  ].map((value, key) => ({ id: key + 1, ...value }));

  findModelByName(modelName: string) {
    return this.models.find((model) => model.name === modelName);
  }

  findModel(modelId: any) {
    const id = Number.parseInt(modelId, 10);
    if (modelId != id) {
      throw new BadRequestException();
    }
    if (id < 0 || id > this.models.length) {
      throw new NotFoundException();
    }
    return this.models.find((model) => model.id === id);
  }

  findModels() {
    return this.models;
  }
}
