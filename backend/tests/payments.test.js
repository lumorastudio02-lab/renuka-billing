import test from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import app from '../src/app.js';
import { env } from '../src/config/env.js';

let authToken = '';

test('Setup authentication token', async () => {
  const res = await supertest(app)
    .post('/api/v1/auth/login')
    .send({ username: env.DEFAULT_ADMIN_USERNAME, password: env.DEFAULT_ADMIN_PASSWORD });
  authToken = res.body.data.tokens.accessToken;
});

test('GET /api/v1/payments - fetch history list', async () => {
  const res = await supertest(app)
    .get('/api/v1/payments')
    .set('Authorization', `Bearer ${authToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
});
