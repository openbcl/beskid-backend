import { Injectable, NotFoundException } from '@nestjs/common';
import { models } from '../config';
import { Model, ModelPartial } from './model';

@Injectable()
export class ModelService {
  findModelByName(modelName: string) {
    return models.find((model) => model.name === modelName);
  }

  findModel(modelId: number) {
    if (modelId <= 0 || modelId > models.length) {
      throw new NotFoundException();
    }
    return models.find((model) => model.id === modelId);
  }

  findModelPartial(modelId: number) {
    return this.toPartial(this.findModel(modelId));
  }

  findModels() {
    return models.filter(model => !model.disabled);
  }

  toPartial(model: Model): ModelPartial {
    return {
      id: model.id,
      name: model.name,
      fds: model.fds,
      disabled: model.disabled,
      hasTemplate: !!model.templatePath?.length
    }
  }
}
