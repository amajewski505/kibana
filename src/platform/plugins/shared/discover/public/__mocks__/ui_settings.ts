/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { IUiSettingsClient } from '@kbn/core/public';
import {
  CONTEXT_TIE_BREAKER_FIELDS_SETTING,
  DEFAULT_COLUMNS_SETTING,
  SAMPLE_SIZE_SETTING,
  SAMPLE_ROWS_PER_PAGE_SETTING,
  SHOW_MULTIFIELDS,
  ROW_HEIGHT_OPTION,
} from '@kbn/discover-utils';

export const uiSettingsMock = {
  get: (key: string) => {
    if (key === SAMPLE_SIZE_SETTING) {
      return 10;
    } else if (key === SAMPLE_ROWS_PER_PAGE_SETTING) {
      return 100;
    } else if (key === DEFAULT_COLUMNS_SETTING) {
      return ['default_column'];
    } else if (key === CONTEXT_TIE_BREAKER_FIELDS_SETTING) {
      return ['_doc'];
    } else if (key === SHOW_MULTIFIELDS) {
      return false;
    } else if (key === ROW_HEIGHT_OPTION) {
      return 3;
    }
  },
} as unknown as IUiSettingsClient;
