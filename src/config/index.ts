import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { Experiment, Model, Template } from '../model/model';
import * as rawModels from './models.json';
import * as rawFDS from './fds.json';
import * as rawExperiments from './experiments.json';
import * as rawScales from './scales.json';
import { ApiProperty } from '@nestjs/swagger';

export class Info {
  @ApiProperty({
    type: String,
    description: 'GitHub commit ID of current version',
  })
  commit: string;

  @ApiProperty({
    type: String,
    description: 'GitHub branch of current version',
  })
  branch: string;
}

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
  const experiments: Experiment[] = model.experiments.map((experiment) => ({
    id: experiment.id,
    ...rawExperiments[experiment.id],
    scale: rawScales[rawExperiments[experiment.id].scale],
    conditions: experiment.conditions,
  }));

  const hasTemplateCondition = (
    experimentId: string,
    templateConditions?: Record<string, number | number[]>,
    legacyCondition?: number
  ) => {
    const experiment = experiments.find((entry) => entry.id === experimentId);
    if (!experiment) {
      return false;
    }
    if (templateConditions && Object.keys(templateConditions).length) {
      return Object.entries(templateConditions).every(([conditionId, value]) => {
        const config = experiment.conditions.find((condition) => condition.id === conditionId);
        if (!config) {
          return false;
        }
        const requestedValues = Array.isArray(value) ? value : [value];
        return requestedValues.every((entry) => config.values.includes(entry));
      });
    }
    if (legacyCondition === undefined) {
      return false;
    }
    return !!experiment.conditions.find((conditionConfig) => conditionConfig.values.includes(legacyCondition));
  };

  return new Model({
    id: model.id,
    description: model.description,
    name: model.name,
    resolution: model.resolution,
    fds: {
      version: model.fds,
      revision: rawFDS[model.fds],
    },
    experiments,
    templates: model.templates
      .map((template) => {
        const templateConfig = template as any;
        const experiment = experiments.find((entry) => entry.id === template.experimentId);
        const fallbackConditionId = experiment?.conditions.at(0)?.id;
        const normalizedConditions =
          templateConfig.experimentConditions ||
          (templateConfig.experimentCondition !== undefined && fallbackConditionId
            ? { [fallbackConditionId]: templateConfig.experimentCondition }
            : undefined);
        return new Template({
          templatePath: join(templateDirectory, template.file),
          experimentId: template.experimentId,
          condition: templateConfig.experimentCondition,
          conditions: normalizedConditions,
        });
      })
      .filter(
        (template) =>
          existsSync(template.templatePath) && hasTemplateCondition(template.experimentId, template.conditions, template.condition)
      ),
    disabled: model.disabled,
  });
});
