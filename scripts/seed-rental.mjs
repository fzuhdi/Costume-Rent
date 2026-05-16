// Seed script: Create a sample client and rental for AC-009-001 test
// Usage: node scripts/seed-rental.mjs
// Uses backend API at http://localhost:8081

const BACKEND = 'http://localhost:8081';

async function main() {
  // 1. Login as admin
  console.log('Logging in as admin...');
  const loginRes = await fetch(`${BACKEND}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@busana.com', password: 'admin123' }),
  });
  if (!loginRes.ok) {
    const err = await loginRes.text();
    throw new Error(`Login failed: ${loginRes.status} ${err}`);
  }
  const { token } = await loginRes.json();
  console.log('Login successful, got token.');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Check if clients already exist
  const clientsRes = await fetch(`${BACKEND}/api/clients`, {
    headers: authHeaders,
  });
  const clientsData = await clientsRes.json();

  let clientId;
  if (clientsData.data && clientsData.data.length > 0) {
    clientId = clientsData.data[0].id;
    console.log(`Client already exists: ID=${clientId}, Name=${clientsData.data[0].name}`);
  } else {
    // Create a client
    console.log('Creating client...');
    const createClientRes = await fetch(`${BACKEND}/api/clients`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Budi Santoso',
        phone: '08123456789',
        address: 'Jl. Merdeka No. 1, Jakarta',
      }),
    });
    if (!createClientRes.ok) {
      const err = await createClientRes.text();
      throw new Error(`Create client failed: ${createClientRes.status} ${err}`);
    }
    const newClient = await createClientRes.json();
    clientId = newClient.id;
    console.log(`Client created: ID=${clientId}`);
  }

  // 3. Check if rentals already exist
  const rentsRes = await fetch(`${BACKEND}/api/rents`, {
    headers: authHeaders,
  });
  const rentsData = await rentsRes.json();

  if (rentsData.data && rentsData.data.length > 0) {
    console.log(`Rentals already exist: ${rentsData.data.length} rental(s). No need to seed.`);
    return;
  }

  // 4. Get first costume for rental items
  const costumesRes = await fetch(`${BACKEND}/api/costumes`);
  const costumesData = await costumesRes.json();
  if (!costumesData.data || costumesData.data.length === 0) {
    throw new Error('No costumes found to create rental');
  }
  const costume = costumesData.data[0];
  console.log(`Using costume: ID=${costume.id}, Name=${costume.name}, Available=${costume.available_quantity}`);

  // 5. Create the rental
  const today = new Date();
  const rentStart = today.toISOString().split('T')[0];
  const rentEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  console.log(`Creating rental: start=${rentStart}, end=${rentEnd}, clientId=${clientId}...`);
  const createRentRes = await fetch(`${BACKEND}/api/rents`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      client_id: clientId,
      guarantee_type: 'KTP',
      rent_start: rentStart,
      rent_end: rentEnd,
      items: [{ costume_id: costume.id, quantity: 1 }],
      notes: 'Penyewaan untuk acara adat',
    }),
  });

  if (!createRentRes.ok) {
    const errText = await createRentRes.text();
    throw new Error(`Create rental failed: ${createRentRes.status} ${errText}`);
  }

  const newRent = await createRentRes.json();
  console.log(`Rental created successfully: ID=${newRent.id}, Status=${newRent.status}`);
  console.log('\nSeed data is ready for AC-009-001 test.');
}

main().catch((err) => {
  console.error('SEED FAILED:', err.message);
  process.exit(1);
});
