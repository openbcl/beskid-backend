import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { Model } from '../model/model';
import * as rawModels from './models.json';
import * as rawFDS from './fds.json';
import * as rawExperiments from './experiments.json';
import * as rawScales from './scales.json';

// file settings
export const expirationFile = '.expiration';
export const encoding = 'utf8';
export const extension = '.json';

// directories
export const dataDirectory = resolve('data');
export const trainingDirectory = resolve('training');
export const templateDirectory = resolve('templates');

// generate models
export const models: Model[] = rawModels.map((model) => {
  const templatePath = join(templateDirectory, model.template);
  const hasTemplate = !!model.template?.length && existsSync(templatePath);
  return {
    id: model.id,
    description: model.description,
    name: model.name,
    resolution: model.resolution,
    fds: {
      version: model.fds,
      revision: rawFDS[model.fds],
    },
    experiments: model.experiments.map((experiment) => ({
      id: experiment.name,
      ...rawExperiments[experiment.name],
      scale: rawScales[rawExperiments[experiment.name].scale],
      conditions: experiment.conditions,
      conditionMU: rawExperiments[experiment.name].conditionMU
    })),
    hasTemplate,
    templatePath: hasTemplate ? templatePath : undefined,
    disabled: model.disabled,
  }
});