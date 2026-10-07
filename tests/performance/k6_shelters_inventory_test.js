import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp-up to 20 virtual users
    { duration: '1m', target: 50 },  // Peak load at 50 virtual users
    { duration: '20s', target: 0 },  // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<250'], // 95% of requests must complete within 250ms
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000/api';

export default function () {
  // 1. Query available shelters
  const sheltersRes = http.get(`${BASE_URL}/shelters/available`);
  check(sheltersRes, {
    'shelters status is 200': (r) => r.status === 200,
    'shelters response received': (r) => r.body.length > 0,
  });

  // 2. Query nearest shelters using geolocation coordinates
  const nearestRes = http.get(`${BASE_URL}/geolocation/nearest-shelters?lat=6.9271&lng=79.8612&limit=5`);
  check(nearestRes, {
    'nearest status is 200': (r) => r.status === 200,
  });

  // 3. Query low-stock inventory
  const inventoryRes = http.get(`${BASE_URL}/inventory/low-stock`);
  check(inventoryRes, {
    'low stock status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
