const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

let authToken = '';

/**
 * AC-044: GET /api/settings (public)
 * AC-045: GET /api/costumes (public catalogue)
 * AC-046: POST /api/auth/login
 * AC-047: POST /api/auth/register
 * AC-048: CRUD /api/costumes (auth required)
 * AC-049: CRUD /api/rents (auth required)
 * AC-050: CRUD /api/clients (auth required)
 * AC-051: GET /api/notifications (auth required)
 * AC-052: PUT /api/settings (auth required)
 */
test.describe('AC-044 to AC-052: API Endpoints', () => {

  test('AC-044: GET /api/settings returns app settings', async ({ request }) => {
    const response = await request.get('/api/settings');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('app_name');
  });

  test('AC-045: GET /api/costumes returns costume list', async ({ request }) => {
    const response = await request.get('/api/costumes');
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('data');
  });

  test('AC-046: POST /api/auth/login with valid credentials', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      }
    });
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('token');
    authToken = body.token;
  });

  test('AC-046: POST /api/auth/login with invalid credentials', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: 'wrong@test.com',
        password: 'wrongpass'
      }
    });
    expect(response.status()).toBe(401);
  });

  test('AC-051: GET /api/notifications requires auth', async ({ request }) => {
    const response = await request.get('/api/notifications');
    expect(response.status()).toBe(401);
  });

  test('AC-051: GET /api/notifications with auth', async ({ request }) => {
    // First login to get token
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    });
    const body = await loginResponse.json();
    const token = body.token;
    
    const response = await request.get('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    
    const notifBody = await response.json();
    expect(notifBody).toHaveProperty('count');
  });

  test('AC-048: GET /api/costumes with auth', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    });
    const body = await loginResponse.json();
    const token = body.token;
    
    const response = await request.get('/api/costumes', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
  });

  test('AC-048: POST /api/costumes creates new costume', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    });
    const body = await loginResponse.json();
    const token = body.token;
    
    const response = await request.post('/api/costumes', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: 'Test Costume API ' + Date.now(),
        quantity: 5,
        condition: 'good'
      }
    });
    expect(response.status()).toBe(200);
  });

  test('AC-049: GET /api/rents with auth', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    });
    const body = await loginResponse.json();
    const token = body.token;
    
    const response = await request.get('/api/rents', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
  });

  test('AC-050: GET /api/clients with auth', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    });
    const body = await loginResponse.json();
    const token = body.token;
    
    const response = await request.get('/api/clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
  });

  test('AC-052: PUT /api/settings updates settings', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    });
    const body = await loginResponse.json();
    const token = body.token;
    
    const response = await request.put('/api/settings', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        app_name: 'Updated via API ' + Date.now()
      }
    });
    expect(response.status()).toBe(200);
  });

  test('AC-047: POST /api/auth/register creates new user (optional)', async ({ request }) => {
    // This is optional - depends on if registration is enabled
    const response = await request.post('/api/auth/register', {
      data: {
        name: 'Test User',
        email: 'test' + Date.now() + '@test.com',
        password: 'testpass123'
      }
    });
    
    // Should return either 200 (success) or 400 (already exists) or 403 (disabled)
    expect([200, 400, 403]).toContain(response.status());
  });
});