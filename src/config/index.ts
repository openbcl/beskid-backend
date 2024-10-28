import { resolve } from 'path';
import * as rawModels from './models.json';
import * as rawFDS from './fds.json';
import * as rawExperiments from './experiments.json';
import * as rawScales from './scales.json';
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
}));

export const redisConnection = () => ({
  host: process.env['redisHost'],
  port: parseInt(process.env['redisPort']) || undefined,
  password: process.env['redisPW'],
})

export const redisPrefix = () => process.env['redisConfigKey'] || 'beskid'