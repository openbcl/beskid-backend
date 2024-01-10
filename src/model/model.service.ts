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

  getModel(id: any) {
    if (id != Number.parseInt(id, 10)) {
      throw new BadRequestException();
    }
    if (id < 0 || id > this.models.length) {
      throw new NotFoundException();
    }
    return this.models[id - 1];
  }

  getModels() {
    return this.models;
  }
}
