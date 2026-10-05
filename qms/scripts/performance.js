import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = {
  stages: [{ duration: '10s', target: 5 }, { duration: '20s', target: 10 }, { duration: '10s', target: 0 }],
  thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<1000'], checks: ['rate==1'] },
};
const base = __ENV.QMS_API || 'http://127.0.0.1:5009';
export function setup() {
  if (!base.startsWith('http://127.0.0.1:') && !base.startsWith('http://localhost:')) throw new Error('Local test instance required');
  const response = http.post(`${base}/api/auth/login`, JSON.stringify({ email: 'coordinator@ercp.org', password: 'Coord@123' }), { headers: { 'Content-Type': 'application/json' } });
  if (response.status !== 200) throw new Error('Test login failed');
  return { token: response.json('token') };
}
export default function(data) {
  const params = { headers: { Authorization: `Bearer ${data.token}` } };
  for (const path of ['/api/incident', '/api/dispatches', '/api/volunteers']) {
    const response = http.get(base + path, params);
    check(response, { 'HTTP 200': r => r.status === 200, 'JSON response': r => (r.headers['Content-Type'] || '').includes('application/json') });
  }
  sleep(0.2);
}
export function handleSummary(data) {
  // setup_data contains the login token; it is not required in assessment evidence.
  const { setup_data, ...report } = data;
  return { [__ENV.QMS_PERF_OUTPUT || 'QMS/evidence/final/performance.json']: JSON.stringify(report, null, 2) };
}
