/**
 * End-to-End User Flow Tests for Class Registration System
 */

const request = require('supertest');

// Test configuration
const BACKEND_URL = 'http://localhost:3001';

// Test data
const testUser = {
  username: `testuser_${Date.now()}`,
  fullName: 'Test User',
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!'
};

let userToken = '';
let testClassId = '';

describe('Class Registration System - User Flow Tests', () => {
  
  beforeAll(async () => {
    console.log('🔧 Starting user flow tests...');
    console.log(`Backend URL: ${BACKEND_URL}`);
  });

  describe('User Registration and Authentication', () => {
    
    test('should successfully register a new user', async () => {
      const response = await request(BACKEND_URL)
        .post('/api/loginFunc/register')
        .send(testUser)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.userID).toBeDefined();
      expect(response.body.data.username).toBe(testUser.username);
      
      userToken = response.body.token;
      console.log(`✅ User registered with ID: ${response.body.data.userID}`);
    });

    test('should successfully login with username', async () => {
      const response = await request(BACKEND_URL)
        .post('/api/loginFunc/login')
        .send({
          usernameOrEmail: testUser.username,
          password: testUser.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.data.username).toBe(testUser.username);
      
      userToken = response.body.token;
      console.log('✅ User logged in successfully');
    });
  });

  describe('Class Management', () => {
    
    test('should retrieve available classes', async () => {
      const response = await request(BACKEND_URL)
        .get('/api/classFunc/available')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const firstClass = response.body.data[0];
      expect(firstClass.classId).toBeDefined();
      expect(firstClass.className).toBeDefined();
      
      testClassId = firstClass.classId;
      console.log(`✅ Retrieved ${response.body.data.length} available classes`);
      console.log(`📚 Test class: ${testClassId} - ${firstClass.className}`);
    });

    test('should successfully register for a class', async () => {
      const response = await request(BACKEND_URL)
        .post('/api/classFunc/register')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ classId: testClassId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('registered');
      
      console.log(`✅ Successfully registered for class: ${testClassId}`);
    });

    test('should retrieve enrolled classes', async () => {
      const response = await request(BACKEND_URL)
        .get('/api/classFunc/enrolled')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const enrolledClass = response.body.data.find(c => c.classId === testClassId);
      expect(enrolledClass).toBeDefined();
      expect(enrolledClass.registrationStatus).toBe('enrolled');
      
      console.log(`✅ Retrieved ${response.body.data.length} enrolled classes`);
    });

    test('should successfully drop a class', async () => {
      const response = await request(BACKEND_URL)
        .post('/api/classFunc/deregister')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ classId: testClassId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('dropped');
      
      console.log(`✅ Successfully dropped class: ${testClassId}`);
    });

    test('should retrieve dropped classes', async () => {
      const response = await request(BACKEND_URL)
        .get('/api/classFunc/dropped')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const droppedClass = response.body.data.find(c => c.classId === testClassId);
      expect(droppedClass).toBeDefined();
      expect(droppedClass.registrationStatus).toBe('dropped');
      
      console.log(`✅ Retrieved ${response.body.data.length} dropped classes`);
    });
  });

  describe('User Logout', () => {
    
    test('should successfully logout user', async () => {
      const response = await request(BACKEND_URL)
        .post('/api/loginFunc/logout')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out');
      
      console.log('✅ User logged out successfully');
    });
  });

  afterAll(async () => {
    console.log('🏁 User flow tests completed successfully!');
    console.log('📋 Test Summary:');
    console.log('   ✅ User registration and authentication');
    console.log('   ✅ Class viewing and management');
    console.log('   ✅ Enrollment and unenrollment flows');
    console.log('   ✅ Complete user journey validation');
  });
});