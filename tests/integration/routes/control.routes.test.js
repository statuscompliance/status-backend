import { expect, describe, it, beforeAll, afterAll, vi } from 'vitest';
import { request } from '../../setup/setup.js';
import jwt from 'jsonwebtoken';
import { sampleUser } from '../../utils/sampleUserData.js';
import { models } from '../../../src/models/models.js';
import { createControlExample } from '../../utils/sampleControlsData.js';
import { createComputationExample } from '../../utils/createComputationExample';
import { v4 as uuidv4 } from 'uuid';

// Helper to create auth header
const authHeader = (token) => ({ Cookie: `accessToken=${token}` });

const sampleToken = jwt.sign(
  {
    userId: sampleUser._id,
    username: sampleUser.username,
    authority: sampleUser.authority,
  },
  'test-secret-key'
);

let controlDraftStatus;
let controlFinalizedStatus;
let controlInvalidParam;
let controlPanel;

describe('Control API Routes', () => {
  // Helper to get via API
  const getResponse = (path, token, status) => {
    return request.get(path).set(authHeader(token)).query({ status: status });
  };
  afterAll(async () => {
    await models.Control.destroy({ where: { name: 'Test Control Name' } });
  });

  describe('GET /getControls', () => {
    beforeAll(async () => {
      [controlDraftStatus, controlFinalizedStatus, controlInvalidParam] =
        await models.Control.bulkCreate([
          createControlExample({ status: 'draft' }),
          createControlExample({ status: 'finalized' }),
          createControlExample({ param: 'invalidParam' }),
        ]);
    });

    const getPath = '/controls';

    it('Should return 400 with a specific error message for an invalid control status', async () => {
      const invalidStatus = 'invalidStatus';
      const res = await getResponse(getPath, sampleToken, invalidStatus);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        'error',
        `Invalid value for "status": "${invalidStatus}". Allowed values are draft or finalized.`
      );
    });

    it('should return 200 and only controls with status finalized', async () => {
      const res = await getResponse(getPath, sampleToken, 'finalized');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // check if all controls are in finalized status
      expect(res.body.every((ctrl) => ctrl.status === 'finalized')).toBe(true);
    });
    it('should return 200 and only controls with status draft', async () => {
      const res = await getResponse(getPath, sampleToken, 'draft');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // check if all controls are in draft status
      expect(res.body.every((ctrl) => ctrl.status === 'draft')).toBe(true);
    });

    it('should return 200 and only controls with period WEEKLY', async () => {
      const res = await getResponse(getPath, sampleToken, 'draft').query({
        period: 'WEEKLY',
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((ctrl) => ctrl.period === 'WEEKLY')).toBe(true);
    });
  });

  describe('GET with controlId /getControl/:id', async () => {
    const getPath = (controlId) => '/controls/' + controlId;

    it('should return 200 and the correct control by ID', async () => {
      const res = await getResponse(
        getPath(controlFinalizedStatus.id),
        sampleToken,
        null
      );
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Test Control Name');
      expect(res.body).toHaveProperty('status', 'finalized');
    });

    it('should return 500 for invalid control ID syntax', async () => {
      const invalidId = 'invalid-id';
      const res = await getResponse(getPath(invalidId), sampleToken, null);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Failed to retrieve control');
      expect(res.body).toHaveProperty(
        'error',
        expect.stringMatching(/^invalid input syntax for integer: invalid-id/)
      );
    });
    it('should return 404 when control with given ID does not exist', async () => {
      const notControlId = sampleUser._id;
      const res = await getResponse(getPath(notControlId), sampleToken, null);
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty(
        'message',
        `Control with ID ${sampleUser._id} not found.`
      );
    });
  });

  describe('POST /createControl', () => {
    // Helper to post via API
    const postResponse = (token, control) => {
      return request.post('/controls').set(authHeader(token)).send(control);
    };

    it('should return 201 and create a new control', async () => {
      const newControl = createControlExample({
        description: 'Test New Control with POST',
        period: 'WEEKLY',
        mashupId: 'abc123',
      });
      const res = await postResponse(sampleToken, newControl);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('name', 'Test Control Name');
      expect(res.body).toHaveProperty(
        'description',
        'Test New Control with POST'
      );
      expect(res.body).toHaveProperty('period', 'WEEKLY');
      expect(res.body).toHaveProperty('mashupId', 'abc123');
    });
    it('should return 400 when required fields are missing', async () => {
      const res = await request
        .post('/controls')
        .set(authHeader(sampleToken))
        .send(controlInvalidParam);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        'error',
        'Invalid parameters: Invalid object or missing required properties'
      );
    });
  });

  describe('PATCH /updateControl', () => {
    it('should return 400 when trying to change status from finalized to draft', async () => {
      const updatedFields = { status: 'draft' };

      const res = await request
        .patch(`/controls/${controlFinalizedStatus.id}`)
        .set(authHeader(sampleToken))
        .send(updatedFields);

      expect(res.status).toBe(400);
      expect(controlFinalizedStatus.status).toBe('finalized');
      expect(res.body).toHaveProperty(
        'message',
        'Cannot change status from finalized to draft'
      );
    });
    it('should return 200 and update control successfully', async () => {
      const updateControl = createControlExample({ status: 'draft' });
      const currentStatus = updateControl.status;
      const updatedFields = {
        description: 'Test update description successfully',
        status: 'finalized',
      };

      const res = await request
        .patch(`/controls/${controlDraftStatus.id}`)
        .set(authHeader(sampleToken))
        .send(updatedFields);

      expect(res.status).toBe(200);
      expect(currentStatus).toBe('draft');
      expect(res.body).toHaveProperty('status', 'finalized');
      expect(res.body).toHaveProperty(
        'description',
        'Test update description successfully'
      );
    });
  });

  describe('DELETE /deleteControl', () => {
    // Helper to delete via API
    let controlDelete;
    let idControlDelete;
    beforeAll(async () => {
      controlDelete = await models.Control.create(
        createControlExample({ description: 'To Be Deleted' })
      );
      idControlDelete = controlDelete.id;
    });
    const deleteResponse = (controlId, token) =>
      request.delete(`/controls/${controlId}`).set(authHeader(token));

    it('should return 204 and delete the control', async () => {
      const res = await deleteResponse(idControlDelete, sampleToken);

      expect(res.status).toBe(204);
      const check = await models.Control.findByPk(idControlDelete);
      expect(check).toBeNull();
    });
    it('should return 404 when trying to delete a non-existent control', async () => {
      const res = await deleteResponse(idControlDelete, sampleToken);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty(
        'message',
        `Control with ID ${idControlDelete} not found.`
      );
    });
    it('should return 500 when control ID is invalid', async () => {
      const invalidId = 'invalid-id';
      const res = await deleteResponse(invalidId, sampleToken);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Failed to delete control');
    });
  });

  describe('Control Panel API Routes', () => {
    const dashboardUid = 'dashboard_uid-test';

    beforeAll(async () => {
      controlPanel = await models.Control.create(createControlExample());
    });
    afterAll(async () => {
      await models.Control.destroy({ where: { name: 'Test Control Name' } });
      await models.Panel.destroy({
        where: { dashboardUid: dashboardUid },
      });
    });

    describe('POST, addPanelToControl', () => {
      // Helper to post panels via API
      const postPanel = (controlId, panelId, token, body) =>
        request
          .post(`/controls/${controlId}/panel/${panelId}`)
          .set(authHeader(token))
          .send(body);

      const testPanelId = uuidv4();
      const dashboard = { dashboardUid: dashboardUid };

      it('should successfully add a panel to a control and return status 201', async () => {
        const res = await postPanel(
          controlPanel.id,
          testPanelId,
          sampleToken,
          dashboard
        );

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty(
          'message',
          'Panel added to control successfully'
        );
        expect(res.body.data).toHaveProperty('id', testPanelId);
        expect(res.body.data).toHaveProperty('dashboardUid', dashboardUid);
      });

      it('should return 500 when given an invalid control ID format', async () => {
        const invalidId = 'invalid-id';
        const res = await postPanel(
          invalidId,
          testPanelId,
          sampleToken,
          dashboard
        );

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty(
          'message',
          'Failed to add panel to control'
        );
      });
      it('should return 404 when control with the given ID does not exist', async () => {
        const overControlId = 9999;
        const res = await postPanel(
          overControlId,
          testPanelId,
          sampleToken,
          dashboard
        );

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty(
          'message',
          `Control with ID ${overControlId} not found.`
        );
      });
    });

    describe('GET, getPanelsByControlId', () => {
      // Helper to get panel via API
      const getPanels = (controlId, token) =>
        request.get(`/controls/${controlId}/panels`).set(authHeader(token));
      it('should return status 200 when retrieving panels from a valid control', async () => {
        const control = await models.Control.create(createControlExample());

        const res = await getPanels(control.id, sampleToken);
        expect(res.status).toBe(200);
      });

      it('should return 500 when given an invalid control ID format', async () => {
        const invalidId = 'invalid-id';
        const res = await getPanels(invalidId, sampleToken);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty(
          'message',
          'Failed to get panels from control, error in Grafana API'
        );
      });
    });

    describe('DELETE /deletePanelFromControl', () => {
      const testPanelId = 'new_panel_id';

      // Helper to delete panel via API
      const deletePanel = (controlId, panelId, token) =>
        request
          .delete(`/controls/${controlId}/panels/${panelId}`)
          .set(authHeader(token));

      it('should return 404 when panel does not exist for the given control', async () => {
        const nonexistent = 'nonexistent';

        const res = await deletePanel(
          controlPanel.id,
          nonexistent,
          sampleToken
        );

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty(
          'message',
          `Panel with ID nonexistent not found for control ID ${controlPanel.id}.`
        );
      });
      it('should return 500 when given an invalid control ID for panel deletion', async () => {
        const invalidId = 'invalid-id';
        const res = await deletePanel(invalidId, testPanelId, sampleToken);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty(
          'message',
          'Failed to delete panel from control'
        );
      });
      it('should delete the panel from the control and return 204', async () => {
        await models.Panel.create({
          id: testPanelId,
          controlId: controlPanel.id,
          dashboardUid,
        });
        const res = await deletePanel(
          controlPanel.id,
          testPanelId,
          sampleToken
        );

        expect(res.status).toBe(204);
        const deleted = await models.Panel.findOne({
          where: { id: testPanelId, controlId: controlPanel.id },
        });
        expect(deleted).toBeNull();
      });
    });
  });
});
describe('Draft Controls', () => {
  let controlWithCatalog;
  beforeAll(async () => {
    [controlDraftStatus, controlFinalizedStatus, controlInvalidParam] =
      await models.Control.bulkCreate([
        createControlExample({ status: 'draft' }),
        createControlExample({ status: 'finalized' }),
        createControlExample({ param: 'invalidParam' }),
      ]);

    // catalog required any startDate
    const startFormatDate = new Date('2024-01-01T00:00:00.000Z');
    // create catalog by status
    await models.Catalog.create({
      id: 1,
      name: 'Test Catalog',
      status: 'draft',
      startDate: startFormatDate,
      dashboard_id: 'test dashboard',
    });
    await models.Catalog.create({
      id: 2,
      name: 'Test Catalog',
      status: 'finalized',
      startDate: startFormatDate,
      dashboard_id: 'test dashboard',
    });
    await models.Catalog.create({
      id: 3,
      name: 'Test Catalog',
      startDate: startFormatDate,
      dashboard_id: 'test dashboard',
    }); // without status
  });
  afterAll(async () => {
    await models.Catalog.destroy({
      where: { dashboard_id: 'test dashboard' },
    });

    await models.Control.destroy({ where: { name: 'Test Control Name' } });
  });
  // Helper to post via API
  const postResponse = (token, control) => {
    return request
      .post('/controls/drafts')
      .set(authHeader(token))
      .send(control);
  };
  it('should return 400 if catalog is not in draft status', async () => {
    const res = await postResponse(sampleToken, controlDraftStatus);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      'error',
      'Missing required fields for draft control: name and catalogId'
    );
  });

  it('should return 201 and the created draft control', async () => {
    controlWithCatalog = createControlExample({
      catalogId: 1,
      status: 'draft',
    });
    const res = await postResponse(sampleToken, controlWithCatalog);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name', 'Test Control Name');
    expect(res.body).toHaveProperty('catalogId', 1);
    expect(res.body).toHaveProperty('status', 'draft');
  });

  it('should return 404 if catalog does not exist', async () => {
    controlWithCatalog = createControlExample({
      catalogId: 999,
    });
    const res = await postResponse(sampleToken, controlWithCatalog);
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty(
      'message',
      'Catalog with ID 999 not found.'
    );
  });
  it('should return 400 if catalog is not in draft status', async () => {
    controlWithCatalog = createControlExample({
      catalogId: 3,
    });
    const res = await postResponse(sampleToken, controlWithCatalog);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      'error',
      'Draft controls can only be added to draft catalogs'
    );
  });

  describe('FinalizeControl, /:id/finalize', () => {
    const getPath = (controlId) => `/controls/${controlId}/finalize`;

    const finalizeResponse = (id, token) => {
      return request.patch(getPath(id)).set(authHeader(token));
    };

    it('should return 404 if control does not exist', async () => {
      controlWithCatalog = createControlExample({
        catalogId: 3,
      });
      const res = await finalizeResponse(
        controlDraftStatus.id,
        sampleToken,
        controlWithCatalog
      );
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty(
        'message',
        'Associated catalog with ID null not found.'
      );
    });
    it('should return 400 if control is not in draft status', async () => {
      const res = await finalizeResponse(
        controlFinalizedStatus.id,
        sampleToken
      );

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        'message',
        'Only draft controls can be finalized'
      );
    });
  });
});

describe('GET /controls/:controlId/computations', () => {
  const FIXED_TS = new Date('2024-10-10T09:00:00.000Z');

  let mockComputationDraft1;
  let mockComputationDraft2;
  let mockComputationFinalized;
  let sampleComputations;

  beforeAll(async () => {
    [controlDraftStatus, controlFinalizedStatus] =
      await models.Control.bulkCreate([
        createControlExample({ status: 'draft' }),
        createControlExample({ status: 'finalized' }),
      ]);

    mockComputationDraft1 = {
      ...createComputationExample({ controlId: controlDraftStatus.id }),
      createdAt: FIXED_TS,
      updatedAt: FIXED_TS,
    };
    mockComputationDraft2 = createComputationExample({
      controlId: controlDraftStatus.id,
    });
    //mockComputationFinalized = createComputationExample({ controlId: controlTestFinalized.id });
    mockComputationFinalized = {
      ...createComputationExample({ controlId: controlFinalizedStatus.id }),
      createdAt: FIXED_TS,
      updatedAt: FIXED_TS,
    };
    sampleComputations = [
      mockComputationDraft1,
      mockComputationDraft2,
      mockComputationFinalized,
    ];
    await models.Computation.bulkCreate(sampleComputations);
  });
  afterAll(async () => {
    await models.Control.destroy({ where: { name: 'Test Control Name' } });
  });
  const getComputations = (path, token) => {
    return request.get(path).set(authHeader(token));
  };
  const getPath = (controlId) => `/controls/controls/${controlId}/computations`;
  const getPathWithDate = (controlId, date) =>
    `/controls/controls/${controlId}/computations/${date}`;

  const getComputationWithQuery = (path, token, from, to) => {
    return request
      .get(path)
      .set(authHeader(token))
      .query({ from: from, to: to });
  };

  describe('GET /controls/:controlId/computations/', () => {
    it('should return computations for a given controlId', async () => {
      const res = await getComputations(
        getPath(controlDraftStatus.id),
        sampleToken
      );

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);

      expect(res.body[0]).toHaveProperty('createdAt', FIXED_TS.toISOString());
    });
    it('should handle errors when retrieving computations by controlId', async () => {
      vi.spyOn(models.Computation, 'findAll').mockRejectedValue(
        new Error('DB error')
      );

      const res = await getComputations(
        getPath(controlDraftStatus.id),
        sampleToken
      );

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty(
        'message',
        'Failed to get computations by control ID'
      );
      vi.restoreAllMocks();
    });
    it('should return 500 on internal error', async () => {
      vi.spyOn(models.Computation, 'findAll').mockRejectedValue(
        new Error('DB error')
      );
      const date = new Date().toISOString().split('T')[0];

      const res = await getComputationWithQuery(
        getPathWithDate(controlDraftStatus.id, date),
        sampleToken
      );

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty(
        'message',
        'Failed to get computation by control ID and creation date'
      );
      vi.restoreAllMocks();
    });
  });

  describe('PATCH /controls/:controlId/computations', () => {
    const putResponse = (path, token, from, to) => {
      return request
        .put(path)
        .set(authHeader(token))
        .send({ from: from, to: to });
    };

    const from = new Date('2024-04-06T08:00:00.000Z').toISOString();
    const to = new Date('2024-06-08T10:00:00.000Z').toISOString();

    it('should update computations in interval', async () => {
      const res = await putResponse(
        getPath(controlDraftStatus.id),
        sampleToken,
        from,
        to
      );
      expect(res.status).toBe(204);
    });

    it('should return 400 if query params are missing', async () => {
      const res = await putResponse(
        getPath(controlDraftStatus.id),
        sampleToken,
        null,
        null
      );
      expect(res.status).toBe(400);

      expect(res.body).toHaveProperty(
        'error',
        '"from" and "to" are required in body'
      );
    });

    it('should return 404 if no computations were updated', async () => {
      const to = new Date(Date.now() + 1000 * 60 * 5).toISOString();
      const from = new Date(Date.now() - 1000 * 60 * 5).toISOString();

      const res = await putResponse(
        getPath(controlDraftStatus.id),
        sampleToken,
        from,
        to
      );
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty(
        'message',
        'No computations found for the given controlId'
      );
    });
  });

  describe('DELETE /controls/:controlId/computations', () => {
    const getDeleteComputationsPath = (controlId) =>
      `/controls/controls/${controlId}/computations`;

    it('should return 204 and delete all computations for a given controlId', async () => {
      const res = await request
        .delete(getDeleteComputationsPath(controlDraftStatus.id))
        .set(authHeader(sampleToken));

      expect(res.status).toBe(204);

      // Verify that the computations for the controlId have been deleted
      const remainingComputations = await models.Computation.findAll({
        where: { controlId: controlDraftStatus.id },
      });
      expect(remainingComputations.length).toBe(0);

      // Verify that computations for other controlIds are not deleted
      const otherComputations = await models.Computation.findAll({
        where: { controlId: controlFinalizedStatus.id },
      });
      expect(otherComputations.length).toBe(1);
    });

    it('should return 204 even if no computations exist for the given controlId', async () => {
      const nonExistentControlId = 999;
      const res = await request
        .delete(getDeleteComputationsPath(nonExistentControlId))
        .set(authHeader(sampleToken));

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty(
        'message',
        'No computations found to delete'
      );
    });

    it('should return 500 for an invalid controlId format', async () => {
      const invalidControlId = 'invalid-id';
      const res = await request
        .delete(getDeleteComputationsPath(invalidControlId))
        .set(authHeader(sampleToken));

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/Failed to delete computation/);
    });
  });
});
