import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Model } from './model';

@Injectable()
export class ModelService {
  models: Model[] = [
    { name: 'AI Model 1', resolutions: [100] },
    { name: 'AI Model 2', resolutions: [100] },
    { name: 'AI Model 3', resolutions: [100] },
    { name: 'AI Model 4', resolutions: [100] },
    { name: 'AI Model 5', resolutions: [100] },
  ].map((value, key) => ({ id: key + 1, ...value }));

  getModel(modelId: any) {
    const id = Number.parseInt(modelId, 10);
    if (modelId != id) {
      throw new BadRequestException();
    }
    if (id < 0 || id > this.models.length) {
      throw new NotFoundException();
    }
    return this.models.find((model) => model.id === id);
  }

  getModels() {
    return this.models;
  }
}
