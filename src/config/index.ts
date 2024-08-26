import { resolve } from 'path';
import * as rawModels from './models.json'
import * as rawFDS from './fds.json'
import * as rawExperiments from './experiments.json'
import * as rawScales from './scales.json'
import { Model } from '../model/model';

// file settings
export const expirationFile = '.expiration';
export const encoding = 'utf8';
export const extension = '.json';

// directories
export const dataDirectory = resolve('data');
export const trainingDirectory = resolve('training');

// generate models
export const models: Model[] = rawModels.map((model, key) => ({
  id: key + 1,
  ...model,
  fds: model.versions.map(version => ({
    revision: rawFDS[version],
    version
  })),
  experiments: model.experiments.map(id => ({
    ...rawExperiments[id],
    scale: rawScales[rawExperiments[id].scale]
  }))
}));
