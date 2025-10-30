const request = require('supertest');

describe('Basic API Test', () => {
  test('should connect to backend health endpoint', async () => {
    const response = await request('http://localhost:3001')
      .get('/health')
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});