import { Injectable, NotFoundException } from '@nestjs/common';
import { models } from '../config';
import { Model, ModelPartial } from './model';

@Injectable()
export class ModelService {
  findModelByName(modelName: string) {
    return models.find((model) => model.name === modelName);
  }
  
  findModelPartialByName(modelName: string) {
    return this.toPartial(this.findModelByName(modelName))
  }

  findModel(modelId: number) {
    if (modelId < 0 || modelId > models.length) {
      throw new NotFoundException();
    }
    return models.find((model) => model.id === modelId);
  }

  findModelPartial(modelId: number) {
    return this.toPartial(this.findModel(modelId));
  }

  findModels(fdsVersion?: string, experimentID?: string) {
    return models.filter(
      (model) =>
        (!fdsVersion || model.fds.version === fdsVersion) &&
        (!experimentID || !!model.experiments.find((experiment) => experiment.id === experimentID)),
    );
  }

  toPartial(model: Model): ModelPartial {
    return {
      id: model.id,
      name: model.name,
      fds: model.fds
    }
  }
}
