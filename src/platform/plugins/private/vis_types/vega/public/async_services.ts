/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

// re-export async parts from a single file to not create separate async bundles
export { createVegaRequestHandler } from './vega_request_handler';
export { VegaVisComponent } from './components/vega_vis_component';
export { VegaParser } from './data_model/vega_parser';
export { getServiceSettings } from './vega_view/vega_map_view/service_settings/get_service_settings';
export { VegaView } from './vega_view/vega_view';
