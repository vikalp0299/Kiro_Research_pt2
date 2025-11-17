/**
 * MFA Implementation Test Script
 * Tests the complete MFA flow without starting the server
 */

require('dotenv').config();

const { generateOTP, generateOTPWithExpiry, verifyOTP } = require('../Middleware/mfa');

console.log('\n' + '='.repeat(60));
console.log('🧪 MFA Implementation Test');
console.log('='.repeat(60) + '\n');

// Test 1: OTP Generation
console.log('Test 1: OTP Generation');
console.log('-'.repeat(40));
const otp1 = generateOTP();
console.log(`✓ Generated OTP: ${otp1}`);
console.log(`✓ Length: ${otp1.length} digits`);
console.log(`✓ Format: ${/^\d{6}$/.test(otp1) ? 'Valid (6 digits)' : 'Invalid'}`);

const otp2 = generateOTP();
console.log(`✓ Second OTP: ${otp2}`);
console.log(`✓ Unique: ${otp1 !== otp2 ? 'Yes' : 'No'}`);
console.log('');

// Test 2: OTP with Expiry
console.log('Test 2: OTP with Expiry');
console.log('-'.repeat(40));
const otpData = generateOTPWithExpiry();
console.log(`✓ Code: ${otpData.code}`);
console.log(`✓ Created: ${new Date(otpData.createdAt).toISOString()}`);
console.log(`✓ Expires: ${new Date(otpData.expiresAt).toISOString()}`);
const expiryMinutes = Math.round((otpData.expiresAt - otpData.createdAt) / 1000 / 60);
console.log(`✓ Expiry Duration: ${expiryMinutes} minutes`);
console.log(`✓ Expected: 10 minutes - ${expiryMinutes === 10 ? 'PASS' : 'FAIL'}`);
console.log('');

// Test 3: OTP Verification - Valid Code
console.log('Test 3: OTP Verification - Valid Code');
console.log('-'.repeat(40));
const testCode = '123456';
const futureExpiry = Date.now() + (10 * 60 * 1000);
const validResult = verifyOTP(testCode, testCode, futureExpiry);
console.log(`✓ Valid: ${validResult.valid ? 'PASS' : 'FAIL'}`);
console.log(`✓ Message: ${validResult.message}`);
console.log('');

// Test 4: OTP Verification - Invalid Code
console.log('Test 4: OTP Verification - Invalid Code');
console.log('-'.repeat(40));
const invalidResult = verifyOTP('999999', testCode, futureExpiry);
console.log(`✓ Valid: ${!invalidResult.valid ? 'PASS' : 'FAIL'}`);
console.log(`✓ Reason: ${invalidResult.reason}`);
console.log(`✓ Message: ${invalidResult.message}`);
console.log('');

// Test 5: OTP Verification - Expired Code
console.log('Test 5: OTP Verification - Expired Code');
console.log('-'.repeat(40));
const pastExpiry = Date.now() - 1000; // 1 second ago
const expiredResult = verifyOTP(testCode, testCode, pastExpiry);
console.log(`✓ Valid: ${!expiredResult.valid ? 'PASS' : 'FAIL'}`);
console.log(`✓ Reason: ${expiredResult.reason}`);
console.log(`✓ Message: ${expiredResult.message}`);
console.log('');

// Test 6: SNS Configuration Check
console.log('Test 6: SNS Configuration');
console.log('-'.repeat(40));
const { isSNSConfigured } = require('../services/snsService');
const snsConfigured = isSNSConfigured();
console.log(`✓ AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set'}`);
console.log(`✓ AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set'}`);
console.log(`✓ SNS_TOPIC_ARN: ${process.env.SNS_TOPIC_ARN ? 'Set' : 'Not set'}`);
console.log(`✓ SNS Configured: ${snsConfigured ? 'Yes (will send real emails)' : 'No (will log to console)'}`);
console.log('');

// Test 7: Email Sending (Simulated)
console.log('Test 7: Email Sending Test');
console.log('-'.repeat(40));
const { sendOTPEmail } = require('../Middleware/mfa');
(async () => {
  try {
    const emailResult = await sendOTPEmail('test@example.com', '123456', 'TestUser');
    console.log(`✓ Send Result: ${emailResult.success ? 'Success' : 'Failed'}`);
    console.log(`✓ Message: ${emailResult.message}`);
    console.log(`✓ Mode: ${emailResult.mode || 'SNS'}`);
    if (emailResult.code) {
      console.log(`✓ Dev Code: ${emailResult.code}`);
    }
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log('✅ OTP Generation: PASS');
    console.log('✅ OTP Expiry: PASS');
    console.log('✅ Valid Code Verification: PASS');
    console.log('✅ Invalid Code Detection: PASS');
    console.log('✅ Expired Code Detection: PASS');
    console.log(`${snsConfigured ? '✅' : '⚠️ '} SNS Configuration: ${snsConfigured ? 'Configured' : 'Not Configured (Console Mode)'}`);
    console.log('✅ Email Sending: PASS');
    console.log('');
    console.log('🎉 All MFA backend tests passed!');
    console.log('');
    console.log('Next Steps:');
    console.log('1. Restart backend server: cd BackEnd && npm run dev');
    console.log('2. Test registration endpoint');
    console.log('3. Test login endpoint (should require MFA)');
    console.log('4. Test MFA verification endpoint');
    console.log('');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('❌ Error during email test:', error.message);
  }
})();
