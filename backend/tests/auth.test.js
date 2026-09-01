import test from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import app from '../src/app.js';
import { env } from '../src/config/env.js';

test('POST /api/v1/auth/login - valid credentials', async () => {
  const res = await supertest(app)
    .post('/api/v1/auth/login')
    .send({ username: env.DEFAULT_ADMIN_USERNAME, password: env.DEFAULT_ADMIN_PASSWORD });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.tokens.accessToken);
});

test('POST /api/v1/auth/login - invalid credentials', async () => {
  const res = await supertest(app)
    .post('/api/v1/auth/login')
    .send({ username: 'admin', password: 'wrongpassword' });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});
