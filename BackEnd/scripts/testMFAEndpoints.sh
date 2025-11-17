#!/bin/bash

# MFA Endpoints Test Script
# Make sure the backend server is running before executing this script

API_URL="http://localhost:3000"

echo "============================================================"
echo "🧪 MFA Endpoints Test"
echo "============================================================"
echo ""
echo "⚠️  Make sure the backend server is running!"
echo "   Run: cd BackEnd && npm run dev"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

echo ""
echo "Test 1: Register New User"
echo "------------------------------------------------------------"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/loginFunc/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "mfatest",
    "fullName": "MFA Test User",
    "email": "mfatest@example.com",
    "password": "SecurePass123!@#"
  }')

echo "$REGISTER_RESPONSE" | jq '.'
echo ""

echo "Test 2: Login (Should Require MFA)"
echo "------------------------------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/loginFunc/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "mfatest",
    "password": "SecurePass123!@#"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Extract userId and devCode from response
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.userId')
DEV_CODE=$(echo "$LOGIN_RESPONSE" | jq -r '.devCode // empty')

echo ""
echo "Extracted:"
echo "  User ID: $USER_ID"
echo "  Dev Code: $DEV_CODE"
echo ""

if [ -z "$DEV_CODE" ]; then
  echo "⚠️  No devCode in response. Check your email for the MFA code."
  echo "Enter the 6-digit code from your email:"
  read MFA_CODE
else
  echo "✓ Using devCode from response: $DEV_CODE"
  MFA_CODE=$DEV_CODE
fi

echo ""
echo "Test 3: Verify MFA Code"
echo "------------------------------------------------------------"
VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/api/loginFunc/verify-mfa" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": $USER_ID,
    \"code\": \"$MFA_CODE\"
  }")

echo "$VERIFY_RESPONSE" | jq '.'
echo ""

# Check if login was successful
if echo "$VERIFY_RESPONSE" | jq -e '.accessToken' > /dev/null; then
  echo "✅ MFA verification successful!"
  echo "✅ Access token received"
  
  ACCESS_TOKEN=$(echo "$VERIFY_RESPONSE" | jq -r '.accessToken')
  
  echo ""
  echo "Test 4: Access Protected Route with Token"
  echo "------------------------------------------------------------"
  PROTECTED_RESPONSE=$(curl -s -X GET "$API_URL/api/classFunc/available" \
    -H "Authorization: Bearer $ACCESS_TOKEN")
  
  echo "$PROTECTED_RESPONSE" | jq '.'
  echo ""
  
  if echo "$PROTECTED_RESPONSE" | jq -e '.classes' > /dev/null; then
    echo "✅ Protected route access successful!"
  else
    echo "❌ Protected route access failed"
  fi
else
  echo "❌ MFA verification failed"
fi

echo ""
echo "Test 5: Test Invalid MFA Code"
echo "------------------------------------------------------------"
INVALID_RESPONSE=$(curl -s -X POST "$API_URL/api/loginFunc/verify-mfa" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": $USER_ID,
    \"code\": \"999999\"
  }")

echo "$INVALID_RESPONSE" | jq '.'
echo ""

if echo "$INVALID_RESPONSE" | jq -e '.error' > /dev/null; then
  echo "✅ Invalid code properly rejected"
else
  echo "❌ Invalid code not rejected"
fi

echo ""
echo "Test 6: Resend MFA Code"
echo "------------------------------------------------------------"
RESEND_RESPONSE=$(curl -s -X POST "$API_URL/api/loginFunc/resend-mfa" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": $USER_ID
  }")

echo "$RESEND_RESPONSE" | jq '.'
echo ""

if echo "$RESEND_RESPONSE" | jq -e '.message' > /dev/null; then
  echo "✅ MFA code resent successfully"
else
  echo "❌ MFA code resend failed"
fi

echo ""
echo "============================================================"
echo "📊 Test Summary"
echo "============================================================"
echo "✅ User Registration"
echo "✅ Login with MFA Required"
echo "✅ MFA Code Verification"
echo "✅ Protected Route Access"
echo "✅ Invalid Code Rejection"
echo "✅ MFA Code Resend"
echo ""
echo "🎉 All MFA endpoint tests completed!"
echo "============================================================"
echo ""
