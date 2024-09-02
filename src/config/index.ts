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
  resolutions: model.resolutions,
  fds: model.versions.map((version) => ({
    version,
    revision: rawFDS[version],
  })),
  experiments: model.experiments.map((id) => ({
    id,
    ...rawExperiments[id],
    scale: rawScales[rawExperiments[id].scale],
  })),
}));

export const redisConnection = () => ({
  host: process.env['redisHost'],
  port: parseInt(process.env['redisPort']) || undefined,
  password: process.env['redisPW'],
})