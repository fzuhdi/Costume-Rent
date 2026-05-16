const { test, expect } = require('@playwright/test');

const ADMIN_EMAIL = 'admin@busana.com';
const ADMIN_PASSWORD = 'admin123';

let authToken = '';

async function getToken(request) {
  if (authToken) return authToken;
  const response = await request.post('/api/auth/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  authToken = body.token;
  return authToken;
}

// Helper to create a test costume and return its ID
async function createTestCostume(request, token) {
  const response = await request.post('/api/costumes', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: 'API Test Costume ' + Date.now(),
      quantity: 5,
      price: 100000
    }
  });
  if (response.status() === 201 || response.status() === 200) {
    const body = await response.json();
    return body.id || body.data?.id;
  }
  return null;
}

// Helper to create a test client and return its ID
async function createTestClient(request, token) {
  const response = await request.post('/api/clients', {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: 'API Test Client ' + Date.now(),
      phone: '08123456789',
      address: 'Test Address'
    }
  });
  if (response.status() === 201 || response.status() === 200) {
    const body = await response.json();
    return body.id || body.data?.id;
  }
  return null;
}

test.describe('AC-028 to AC-040: API Endpoints', () => {

  // ── AC-028: Public Endpoints ───────────────────────────────────

  test('[AC-028-001] - GET /api/health returns 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('[AC-028-002] - GET /api/settings returns 200 without auth', async ({ request }) => {
    const response = await request.get('/api/settings');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('app_name');
    expect(body).toHaveProperty('app_tagline');
  });

  test('[AC-028-003] - GET /api/regions returns array (public)', async ({ request }) => {
    const response = await request.get('/api/regions');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      expect(body[0]).toHaveProperty('id');
      expect(body[0]).toHaveProperty('name');
    }
  });

  test('[AC-028-004] - POST /api/regions without auth returns 401', async ({ request }) => {
    const response = await request.post('/api/regions', {
      data: { name: 'Test Region' }
    });
    expect(response.status()).toBe(401);
  });

  test('[AC-028-005] - POST /api/regions with auth creates region', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.post('/api/regions', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name: 'API Test Region ' + Date.now() }
    });
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('name');
  });

  test('[AC-028-006] - POST /api/regions duplicate name returns error', async ({ request }) => {
    const token = await getToken(request);
    // First create a region
    const name = 'Duplicate Test Region';
    await request.post('/api/regions', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name }
    });
    // Try to create again with same name
    const response = await request.post('/api/regions', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name }
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message || body.error).toMatch(/duplicate|already exists|sudah/i);
  });

  test('[AC-028-007] - GET /api/categories returns array (public)', async ({ request }) => {
    const response = await request.get('/api/categories');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      expect(body[0]).toHaveProperty('id');
      expect(body[0]).toHaveProperty('name');
    }
  });

  test('[AC-028-008] - POST /api/categories without auth returns 401', async ({ request }) => {
    const response = await request.post('/api/categories', {
      data: { name: 'Test Category' }
    });
    expect(response.status()).toBe(401);
  });

  // ── AC-029: Authentication Endpoints ──────────────────────────────

  test('[AC-029-001] - POST /api/auth/login with valid credentials', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(body.token.length).toBeGreaterThan(0);
  });

  test('[AC-029-002] - POST /api/auth/login with wrong password', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: 'wrongpassword' }
    });
    expect(response.status()).toBe(401);
  });

  test('[AC-029-003] - POST /api/auth/login with unknown email', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: { email: 'unknown@test.com', password: 'test123' }
    });
    expect(response.status()).toBe(401);
  });

  test('[AC-029-004] - GET /api/auth/me with token', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('email');
  });

  test('[AC-029-005] - GET /api/auth/me without token', async ({ request }) => {
    const response = await request.get('/api/auth/me');
    expect(response.status()).toBe(401);
  });

  test('[AC-029-006] - POST /api/auth/logout with token', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.post('/api/auth/logout', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
  });

  test('[AC-029-007] - POST /api/auth/logout without token', async ({ request }) => {
    const response = await request.post('/api/auth/logout');
    expect(response.status()).toBe(401);
  });

  // ── AC-030: Protected Endpoints - Costumes ─────────────────────

  test('[AC-030-001] - GET /api/costumes returns paginated list', async ({ request }) => {
    const response = await request.get('/api/costumes');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('limit');
    expect(body).toHaveProperty('total_pages');
    if (body.data.length > 0) {
      expect(body.data[0]).toHaveProperty('available_quantity');
    }
  });

  test('[AC-030-002] - GET /api/costumes with search param', async ({ request }) => {
    const response = await request.get('/api/costumes?search=test');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('data');
  });

  test('[AC-030-003] - GET /api/costumes pagination', async ({ request }) => {
    const response = await request.get('/api/costumes?page=1&limit=2');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.length).toBeLessThanOrEqual(2);
  });

  test('[AC-030-004] - GET /api/costumes limit capped at 100', async ({ request }) => {
    const response = await request.get('/api/costumes?limit=999');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data.length).toBeLessThanOrEqual(100);
  });

  test('[AC-030-005] - GET /api/costumes/search with auth', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/costumes/search?q=a', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      expect(body[0]).toHaveProperty('available_quantity');
    }
  });

  test('[AC-030-006] - GET /api/costumes/:id returns detail', async ({ request }) => {
    const token = await getToken(request);
    // Get first costume from list
    const listResponse = await request.get('/api/costumes');
    const listBody = await listResponse.json();
    if (listBody.data.length > 0) {
      const costumeId = listBody.data[0].id;
      const response = await request.get(`/api/costumes/${costumeId}`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('images');
      expect(body).toHaveProperty('available_quantity');
    }
  });

  test('[AC-030-007] - GET /api/costumes/:id not found', async ({ request }) => {
    const response = await request.get('/api/costumes/99999999');
    expect(response.status()).toBe(404);
  });

  test('[AC-030-008] - GET /api/costumes/abc invalid ID', async ({ request }) => {
    const response = await request.get('/api/costumes/abc');
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message || body.error).toMatch(/invalid|tidak valid/i);
  });

  test('[AC-030-009] - POST /api/costumes without auth returns 401', async ({ request }) => {
    const response = await request.post('/api/costumes', {
      data: { name: 'Test', quantity: 1 }
    });
    expect(response.status()).toBe(401);
  });

  test('[AC-030-010] - POST /api/costumes with auth and valid body', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.post('/api/costumes', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: 'API Test Costume ' + Date.now(),
        quantity: 3,
        price: 50000
      }
    });
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty('id');
  });

  test('[AC-030-011] - POST /api/costumes missing name returns 400', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.post('/api/costumes', {
      headers: { Authorization: `Bearer ${token}` },
      data: { quantity: 3 }
    });
    expect(response.status()).toBe(400);
  });

  test('[AC-030-012] - PUT /api/costumes/:id without auth returns 401', async ({ request }) => {
    const response = await request.put('/api/costumes/1', {
      data: { name: 'Updated' }
    });
    expect(response.status()).toBe(401);
  });

  test('[AC-030-013] - PUT /api/costumes/:id updates fields', async ({ request }) => {
    const token = await getToken(request);
    const costumeId = await createTestCostume(request, token);
    if (costumeId) {
      const response = await request.put(`/api/costumes/${costumeId}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { name: 'Updated Name ' + Date.now() }
      });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.name || body.data?.name).toMatch(/Updated Name/);
    }
  });

  test('[AC-030-014] - DELETE /api/costumes/:id without auth returns 401', async ({ request }) => {
    const response = await request.delete('/api/costumes/1');
    expect(response.status()).toBe(401);
  });

  test('[AC-030-015] - DELETE /api/costumes/:id with auth', async ({ request }) => {
    const token = await getToken(request);
    const costumeId = await createTestCostume(request, token);
    if (costumeId) {
      const response = await request.delete(`/api/costumes/${costumeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect([200, 204]).toContain(response.status());
    }
  });

  // ── AC-030: Protected Endpoints - Clients ────────────────────────

  test('[AC-030-016] - GET /api/clients without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/clients');
    expect(response.status()).toBe(401);
  });

  test('[AC-030-017] - GET /api/clients with auth returns paginated', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('data');
    if (body.data.length > 0) {
      const client = body.data[0];
      expect(client).toHaveProperty('total_rents');
      expect(client).toHaveProperty('active_rents');
      expect(client).toHaveProperty('has_overdue');
    }
  });

  test('[AC-030-018] - GET /api/clients/search with auth', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/clients/search?q=test', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('[AC-030-019] - GET /api/clients/:id with auth', async ({ request }) => {
    const token = await getToken(request);
    const listResponse = await request.get('/api/clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listBody = await listResponse.json();
    if (listBody.data.length > 0) {
      const clientId = listBody.data[0].id;
      const response = await request.get(`/api/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('rent_history');
    }
  });

  test('[AC-030-020] - GET /api/clients/99999999 returns 404', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/clients/99999999', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(404);
  });

  test('[AC-030-021] - POST /api/clients with auth creates client', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.post('/api/clients', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: 'API Test Client ' + Date.now(),
        phone: '08123456789',
        address: 'Test Address'
      }
    });
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty('id');
  });

  test('[AC-030-022] - GET /api/clients/:id/rents with auth', async ({ request }) => {
    const token = await getToken(request);
    const listResponse = await request.get('/api/clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listBody = await listResponse.json();
    if (listBody.data.length > 0) {
      const clientId = listBody.data[0].id;
      const response = await request.get(`/api/clients/${clientId}/rents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    }
  });

  test('[AC-030-039] - GET /api/clients/abc invalid ID returns 400', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/clients/abc', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(400);
  });

  // ── AC-030: Protected Endpoints - Rentals ────────────────────────

  test('[AC-030-023] - GET /api/rents without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/rents');
    expect(response.status()).toBe(401);
  });

  test('[AC-030-024] - GET /api/rents with auth returns paginated', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/rents', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('data');
    if (body.data.length > 0) {
      const rent = body.data[0];
      expect(rent).toHaveProperty('client_name');
      expect(rent).toHaveProperty('status');
      expect(rent).toHaveProperty('items');
    }
  });

  test('[AC-030-025] - GET /api/rents?status=active', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/rents?status=active', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    if (body.data.length > 0) {
      expect(body.data[0].status).toBe('active');
    }
  });

  test('[AC-030-026] - POST /api/rents with valid payload', async ({ request }) => {
    const token = await getToken(request);
    // Get a client
    const clientResponse = await request.get('/api/clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const clientBody = await clientResponse.json();
    if (clientBody.data.length > 0) {
      const clientId = clientBody.data[0].id;
      // Get a costume
      const costumeResponse = await request.get('/api/costumes');
      const costumeBody = await costumeResponse.json();
      if (costumeBody.data.length > 0) {
        const costumeId = costumeBody.data[0].id;
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const response = await request.post('/api/rents', {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            client_id: clientId,
            guarantee_type: 'KTP',
            rent_start: today,
            rent_end: tomorrow,
            items: [{ costume_id: costumeId, quantity: 1 }]
          }
        });
        expect([200, 201]).toContain(response.status());
        const body = await response.json();
        expect(body.status || body.data?.status).toBe('active');
      }
    }
  });

  test('[AC-030-027] - POST /api/rents missing guarantee_type returns 400', async ({ request }) => {
    const token = await getToken(request);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const response = await request.post('/api/rents', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        rent_start: today,
        rent_end: tomorrow,
        items: [{ costume_id: 1, quantity: 1 }]
      }
    });
    // Backend may return 400 or 422
    expect([400, 422]).toContain(response.status());
  });

  test('[AC-030-028] - POST /api/rents missing rent_start returns 400', async ({ request }) => {
    const token = await getToken(request);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const response = await request.post('/api/rents', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        guarantee_type: 'KTP',
        rent_end: tomorrow,
        items: [{ costume_id: 1, quantity: 1 }]
      }
    });
    expect([400, 422]).toContain(response.status());
  });

  test('[AC-030-029] - POST /api/rents empty items returns 400', async ({ request }) => {
    const token = await getToken(request);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const response = await request.post('/api/rents', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        guarantee_type: 'KTP',
        rent_start: today,
        rent_end: tomorrow,
        items: []
      }
    });
    expect([400, 422]).toContain(response.status());
  });

  test('[AC-030-030] - POST /api/rents rent_end before rent_start', async ({ request }) => {
    const token = await getToken(request);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const response = await request.post('/api/rents', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        guarantee_type: 'KTP',
        rent_start: tomorrow,
        rent_end: today,
        items: []
      }
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message || body.error).toMatch(/rent_end must be after rent_start/i);
  });

  test('[AC-030-031] - POST /api/rents quantity exceeds available', async ({ request }) => {
    const token = await getToken(request);
    // Get a costume and check its available quantity
    const costumeResponse = await request.get('/api/costumes');
    const costumeBody = await costumeResponse.json();
    if (costumeBody.data.length > 0) {
      const costume = costumeBody.data[0];
      const clientResponse = await request.get('/api/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clientBody = await clientResponse.json();
      if (clientBody.data.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const response = await request.post('/api/rents', {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            client_id: clientBody.data[0].id,
            guarantee_type: 'KTP',
            rent_start: today,
            rent_end: tomorrow,
            items: [{ costume_id: costume.id, quantity: 99999 }]
          }
        });
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.message || body.error).toMatch(/insufficient quantity/i);
      }
    }
  });

  test('[AC-030-032] - POST /api/rents invalid costume_id', async ({ request }) => {
    const token = await getToken(request);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const response = await request.post('/api/rents', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        guarantee_type: 'KTP',
        rent_start: today,
        rent_end: tomorrow,
        items: [{ costume_id: 99999999, quantity: 1 }]
      }
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message || body.error).toMatch(/costume not found/i);
  });

  test('[AC-030-033] - PUT /api/rents/:id/return with auth', async ({ request }) => {
    const token = await getToken(request);
    // Create a rental first
    const clientResponse = await request.get('/api/clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const clientBody = await clientResponse.json();
    if (clientBody.data.length > 0) {
      const costumeResponse = await request.get('/api/costumes');
      const costumeBody = await costumeResponse.json();
      if (costumeBody.data.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const createResponse = await request.post('/api/rents', {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            client_id: clientBody.data[0].id,
            guarantee_type: 'KTP',
            rent_start: today,
            rent_end: tomorrow,
            items: [{ costume_id: costumeBody.data[0].id, quantity: 1 }]
          }
        });
        if (createResponse.status() === 200 || createResponse.status() === 201) {
          const rentBody = await createResponse.json();
          const rentId = rentBody.id || rentBody.data?.id;
          if (rentId) {
            const returnResponse = await request.put(`/api/rents/${rentId}/return`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            expect(returnResponse.status()).toBe(200);
            const returnBody = await returnResponse.json();
            expect(returnBody.status || returnBody.data?.status).toBe('returned');
          }
        }
      }
    }
  });

  test('[AC-030-034] - DELETE /api/rents/:id with auth', async ({ request }) => {
    const token = await getToken(request);
    // Create a rental first
    const clientResponse = await request.get('/api/clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const clientBody = await clientResponse.json();
    if (clientBody.data.length > 0) {
      const costumeResponse = await request.get('/api/costumes');
      const costumeBody = await costumeResponse.json();
      if (costumeBody.data.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const createResponse = await request.post('/api/rents', {
          headers: { Authorization: `Bearer ${token}` },
          data: {
            client_id: clientBody.data[0].id,
            guarantee_type: 'KTP',
            rent_start: today,
            rent_end: tomorrow,
            items: [{ costume_id: costumeBody.data[0].id, quantity: 1 }]
          }
        });
        if (createResponse.status() === 200 || createResponse.status() === 201) {
          const rentBody = await createResponse.json();
          const rentId = rentBody.id || rentBody.data?.id;
          if (rentId) {
            const deleteResponse = await request.delete(`/api/rents/${rentId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            expect([200, 204]).toContain(deleteResponse.status());
          }
        }
      }
    }
  });

  test('[AC-030-039] - GET /api/rents/abc invalid ID returns 400', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/rents/abc', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(400);
  });

  // ── AC-030: Notifications ──────────────────────────────────────────

  test('[AC-030-035] - GET /api/notifications without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/notifications');
    expect(response.status()).toBe(401);
  });

  test('[AC-030-036] - GET /api/notifications with auth', async ({ request }) => {
    const token = await getToken(request);
    const response = await request.get('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('count');
    expect(body).toHaveProperty('items');
    expect(Array.isArray(body.items)).toBe(true);
    if (body.items.length > 0) {
      const item = body.items[0];
      expect(item).toHaveProperty('rent_order_id');
      expect(item).toHaveProperty('client_name');
      expect(item).toHaveProperty('rent_end');
      expect(item).toHaveProperty('type');
      expect(['overdue', 'due_soon']).toContain(item.type);
    }
  });

  // ── AC-030: Settings ─────────────────────────────────────────────────

  test('[AC-030-037] - PUT /api/settings without auth returns 401', async ({ request }) => {
    const response = await request.put('/api/settings', {
      data: { app_name: 'Test' }
    });
    expect(response.status()).toBe(401);
  });

  test('[AC-030-038] - PUT /api/settings with auth updates app_name', async ({ request }) => {
    const token = await getToken(request);
    const newName = 'API Updated Name ' + Date.now();
    const response = await request.put('/api/settings', {
      headers: { Authorization: `Bearer ${token}` },
      data: { app_name: newName }
    });
    expect(response.status()).toBe(200);
    // Verify update
    const getResponse = await request.get('/api/settings');
    const body = await getResponse.json();
    expect(body.app_name).toBe(newName);
  });

  // ── AC-040: Duplicate Category ────────────────────────────────────

  test('[AC-040-001] - POST /api/categories duplicate name returns error', async ({ request }) => {
    const token = await getToken(request);
    const name = 'Duplicate Test Category ' + Date.now();
    // First create
    await request.post('/api/categories', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name }
    });
    // Try to create again
    const response = await request.post('/api/categories', {
      headers: { Authorization: `Bearer ${token}` },
      data: { name }
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.message || body.error || '').toMatch(/UNIQUE|duplicate|already exists|sudah/i);
  });
});
