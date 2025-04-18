/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type {
  SavedObject,
  SavedObjectsExportTransformContext,
  SavedObjectsServiceSetup,
} from '@kbn/core/server';
import type { EncryptedSavedObjectsPluginSetup } from '@kbn/encrypted-saved-objects-plugin/server';
import { getOldestIdleActionTask } from '@kbn/task-manager-plugin/server';
import { ALERTING_CASES_SAVED_OBJECT_INDEX } from '@kbn/core-saved-objects-server';
import { actionMappings, actionTaskParamsMappings, connectorTokenMappings } from './mappings';
import { getActionsMigrations } from './actions_migrations';
import { getActionTaskParamsMigrations } from './action_task_params_migrations';
import type { InMemoryConnector, RawAction } from '../types';
import { getImportWarnings } from './get_import_warnings';
import { transformConnectorsForExport } from './transform_connectors_for_export';
import type { ActionTypeRegistry } from '../action_type_registry';
import {
  ACTION_SAVED_OBJECT_TYPE,
  ACTION_TASK_PARAMS_SAVED_OBJECT_TYPE,
  CONNECTOR_TOKEN_SAVED_OBJECT_TYPE,
} from '../constants/saved_objects';
import {
  actionTaskParamsModelVersions,
  connectorModelVersions,
  connectorTokenModelVersions,
} from './model_versions';

export function setupSavedObjects(
  savedObjects: SavedObjectsServiceSetup,
  encryptedSavedObjects: EncryptedSavedObjectsPluginSetup,
  actionTypeRegistry: ActionTypeRegistry,
  taskManagerIndex: string,
  inMemoryConnectors: InMemoryConnector[]
) {
  savedObjects.registerType({
    name: ACTION_SAVED_OBJECT_TYPE,
    indexPattern: ALERTING_CASES_SAVED_OBJECT_INDEX,
    hidden: true,
    namespaceType: 'multiple-isolated',
    convertToMultiNamespaceTypeVersion: '8.0.0',
    mappings: actionMappings,
    migrations: getActionsMigrations(encryptedSavedObjects),
    management: {
      displayName: 'connector',
      defaultSearchField: 'name',
      importableAndExportable: true,
      getTitle(savedObject: SavedObject<RawAction>) {
        return `Connector: [${savedObject.attributes.name}]`;
      },
      onExport(
        context: SavedObjectsExportTransformContext,
        objects: Array<SavedObject<RawAction>>
      ) {
        return transformConnectorsForExport(objects, actionTypeRegistry);
      },
      onImport(connectors) {
        return {
          warnings: getImportWarnings(connectors as Array<SavedObject<RawAction>>),
        };
      },
    },
    modelVersions: connectorModelVersions,
  });

  // Encrypted attributes
  // - `secrets` properties will be encrypted
  // - `config` will be included in AAD
  // - everything else excluded from AAD
  encryptedSavedObjects.registerType({
    type: ACTION_SAVED_OBJECT_TYPE,
    attributesToEncrypt: new Set(['secrets']),
    attributesToIncludeInAAD: new Set(['actionTypeId', 'isMissingSecrets', 'config']),
  });

  savedObjects.registerType({
    name: ACTION_TASK_PARAMS_SAVED_OBJECT_TYPE,
    indexPattern: ALERTING_CASES_SAVED_OBJECT_INDEX,
    hidden: true,
    namespaceType: 'multiple-isolated',
    convertToMultiNamespaceTypeVersion: '8.0.0',
    mappings: actionTaskParamsMappings,
    migrations: getActionTaskParamsMigrations(encryptedSavedObjects, inMemoryConnectors),
    excludeOnUpgrade: async ({ readonlyEsClient }) => {
      const oldestIdleActionTask = await getOldestIdleActionTask(
        readonlyEsClient,
        taskManagerIndex
      );
      return {
        bool: {
          must: [
            { term: { type: 'action_task_params' } },
            { range: { updated_at: { lt: oldestIdleActionTask } } },
          ],
        },
      };
    },
    modelVersions: actionTaskParamsModelVersions,
  });
  encryptedSavedObjects.registerType({
    type: ACTION_TASK_PARAMS_SAVED_OBJECT_TYPE,
    attributesToEncrypt: new Set(['apiKey']),
    attributesToIncludeInAAD: new Set([
      'actionId',
      'consumer',
      'params',
      'executionId',
      'relatedSavedObjects',
      'source',
    ]),
  });

  savedObjects.registerType({
    name: CONNECTOR_TOKEN_SAVED_OBJECT_TYPE,
    indexPattern: ALERTING_CASES_SAVED_OBJECT_INDEX,
    hidden: true,
    namespaceType: 'agnostic',
    mappings: connectorTokenMappings,
    management: {
      importableAndExportable: false,
    },
    modelVersions: connectorTokenModelVersions,
  });

  encryptedSavedObjects.registerType({
    type: CONNECTOR_TOKEN_SAVED_OBJECT_TYPE,
    attributesToEncrypt: new Set(['token']),
    attributesToIncludeInAAD: new Set([
      'connectorId',
      'tokenType',
      'expiresAt',
      'createdAt',
      'updatedAt',
    ]),
  });
}
