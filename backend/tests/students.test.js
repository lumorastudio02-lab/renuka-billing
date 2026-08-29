import test from 'node:test';
import assert from 'node:assert/strict';
import supertest from 'supertest';
import app from '../src/app.js';

let authToken = '';

test('Setup authentication token', async () => {
  const res = await supertest(app)
    .post('/api/v1/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  authToken = res.body.data.tokens.accessToken;
});

test('GET /api/v1/students - require auth header', async () => {
  const res = await supertest(app).get('/api/v1/students');
  assert.equal(res.status, 401);
});

test('GET /api/v1/students - with valid bearer token', async () => {
  const res = await supertest(app)
    .get('/api/v1/students')
    .set('Authorization', `Bearer ${authToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
});
