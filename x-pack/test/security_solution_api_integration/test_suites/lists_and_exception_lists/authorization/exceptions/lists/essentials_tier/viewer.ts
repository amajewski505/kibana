/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from 'expect';
import TestAgent from 'supertest/lib/agent';
import { EXCEPTION_LIST_URL } from '@kbn/securitysolution-list-constants';
import { getCreateExceptionListMinimalSchemaMock } from '@kbn/lists-plugin/common/schemas/request/create_exception_list_schema.mock';
import { getUpdateMinimalExceptionListSchemaMock } from '@kbn/lists-plugin/common/schemas/request/update_exception_list_schema.mock';
import { UpdateExceptionListSchema } from '@kbn/securitysolution-io-ts-list-types';
import { FtrProviderContext } from '../../../../../../ftr_provider_context';
import { deleteAllExceptions } from '../../../../utils';

export default ({ getService }: FtrProviderContext): void => {
  const log = getService('log');
  const utils = getService('securitySolutionUtils');

  let admin: TestAgent;
  let viewer: TestAgent;

  describe('@serverless @serverlessQA viewer exception list API behaviors', () => {
    before(async () => {
      admin = await utils.createSuperTest('admin');
      viewer = await utils.createSuperTest('viewer');
      await deleteAllExceptions(admin, log);
    });

    afterEach(async () => {
      await deleteAllExceptions(admin, log);
    });

    describe('create exception list', () => {
      it('should return 403 for viewer', async () => {
        await viewer
          .post(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListMinimalSchemaMock())
          .expect(403);
      });
    });

    describe('delete exception list', () => {
      it('should return 403 for viewer', async () => {
        // create an exception list
        await admin
          .post(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListMinimalSchemaMock())
          .expect(200);

        await viewer
          .delete(
            `${EXCEPTION_LIST_URL}?list_id=${getCreateExceptionListMinimalSchemaMock().list_id}`
          )
          .set('kbn-xsrf', 'true')
          .expect(403);
      });
    });

    describe('find exception list', () => {
      it('should return 200 for viewer', async () => {
        // add a single exception list
        await admin
          .post(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListMinimalSchemaMock())
          .expect(200);

        // query the single exception list from _find
        const { body } = await viewer
          .get(`${EXCEPTION_LIST_URL}/_find`)
          .set('kbn-xsrf', 'true')
          .send()
          .expect(200);

        expect(body.total).toEqual(1);
      });
    });

    describe('read exception list', () => {
      it('should return 200 for viewer', async () => {
        // create a simple exception list to read
        await admin
          .post(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListMinimalSchemaMock())
          .expect(200);

        await viewer
          .get(`${EXCEPTION_LIST_URL}?list_id=${getCreateExceptionListMinimalSchemaMock().list_id}`)
          .set('kbn-xsrf', 'true')
          .expect(200);
      });
    });

    describe('update exception list', () => {
      it('should return 403 for viewer', async () => {
        // create a simple exception list
        await admin
          .post(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListMinimalSchemaMock())
          .expect(200);

        // update a exception list's name
        const updatedList: UpdateExceptionListSchema = {
          ...getUpdateMinimalExceptionListSchemaMock(),
          name: 'some other name',
        };

        await viewer.put(EXCEPTION_LIST_URL).set('kbn-xsrf', 'true').send(updatedList).expect(403);
      });
    });
  });
};
