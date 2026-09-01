import test from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import app from '../src/app.js';
import { env } from '../src/config/env.js';

let authToken = '';

test('Setup authentication token for pagination tests', async () => {
  const res = await supertest(app)
    .post('/api/v1/auth/login')
    .send({ username: env.DEFAULT_ADMIN_USERNAME, password: env.DEFAULT_ADMIN_PASSWORD });
  authToken = res.body.data.tokens.accessToken;
});

test('GET /api/v1/students - page and limit parameters', async () => {
  const res = await supertest(app)
    .get('/api/v1/students?page=1&limit=5')
    .set('Authorization', `Bearer ${authToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data.data));
  assert.ok(res.body.data.pagination);
  assert.equal(res.body.data.pagination.page, 1);
  assert.equal(res.body.data.pagination.limit, 5);
});

test('GET /api/v1/payments - page and limit parameters', async () => {
  const res = await supertest(app)
    .get('/api/v1/payments?page=1&limit=5')
    .set('Authorization', `Bearer ${authToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data.data));
  assert.ok(res.body.data.pagination);
  assert.equal(res.body.data.pagination.page, 1);
  assert.equal(res.body.data.pagination.limit, 5);
});

test('GET /api/v1/expenses - page and limit parameters', async () => {
  const res = await supertest(app)
    .get('/api/v1/expenses?page=1&limit=5')
    .set('Authorization', `Bearer ${authToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data.data));
  assert.ok(res.body.data.pagination);
  assert.equal(res.body.data.pagination.page, 1);
  assert.equal(res.body.data.pagination.limit, 5);
});
