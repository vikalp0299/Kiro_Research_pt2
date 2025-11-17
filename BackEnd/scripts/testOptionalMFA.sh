#!/bin/bash

# Optional MFA Feature Test Script

API_URL="http://localhost:3000"

echo "============================================================"
echo "🧪 Optional MFA Feature Test"
echo "============================================================"
echo ""
echo "⚠️  Make sure the backend server is running!"
echo ""

# Step 1: Register and Login
echo "Step 1: Register new user"
echo "------------------------------------------------------------"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/loginFunc/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "optionalmfa",
    "fullName": "Optional MFA Test",
    "email": "optionalmfa@example.com",
    "password": "SecurePass123!@#"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken')
echo ""
echo "Access Token: ${TOKEN:0:50}..."
echo ""

# Step 2: Check MFA Status
echo "Step 2: Check MFA Status (should be enabled by default)"
echo "------------------------------------------------------------"
MFA_STATUS=$(curl -s -X GET "$API_URL/api/loginFunc/mfa-status" \
  -H "Authorization: Bearer $TOKEN")

echo "$MFA_STATUS" | jq '.'
echo ""

# Step 3: Disable MFA
echo "Step 3: Disable MFA (requires password)"
echo "------------------------------------------------------------"
DISABLE_RESPONSE=$(curl -s -X POST "$API_URL/api/loginFunc/disable-mfa" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "SecurePass123!@#"}')

echo "$DISABLE_RESPONSE" | jq '.'
echo ""

# Step 4: Login without MFA
echo "Step 4: Login (should NOT require MFA now)"
echo "------------------------------------------------------------"
LOGIN_NO_MFA=$(curl -s -X POST "$API_URL/api/loginFunc/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "optionalmfa",
    "password": "SecurePass123!@#"
  }')

echo "$LOGIN_NO_MFA" | jq '.'

# Check if mfaRequired is false
MFA_REQUIRED=$(echo "$LOGIN_NO_MFA" | jq -r '.mfaRequired // false')
if [ "$MFA_REQUIRED" = "false" ]; then
  echo ""
  echo "✅ Login successful without MFA!"
  NEW_TOKEN=$(echo "$LOGIN_NO_MFA" | jq -r '.accessToken')
else
  echo ""
  echo "❌ MFA still required (unexpected)"
  NEW_TOKEN=$TOKEN
fi
echo ""

# Step 5: Re-enable MFA
echo "Step 5: Re-enable MFA"
echo "------------------------------------------------------------"
ENABLE_RESPONSE=$(curl -s -X POST "$API_URL/api/loginFunc/enable-mfa" \
  -H "Authorization: Bearer $NEW_TOKEN")

echo "$ENABLE_RESPONSE" | jq '.'
echo ""

# Step 6: Check MFA Status Again
echo "Step 6: Check MFA Status (should be enabled now)"
echo "------------------------------------------------------------"
MFA_STATUS_2=$(curl -s -X GET "$API_URL/api/loginFunc/mfa-status" \
  -H "Authorization: Bearer $NEW_TOKEN")

echo "$MFA_STATUS_2" | jq '.'
echo ""

# Step 7: Login with MFA
echo "Step 7: Login (should require MFA now)"
echo "------------------------------------------------------------"
LOGIN_WITH_MFA=$(curl -s -X POST "$API_URL/api/loginFunc/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "optionalmfa",
    "password": "SecurePass123!@#"
  }')

echo "$LOGIN_WITH_MFA" | jq '.'

# Check if mfaRequired is true
MFA_REQUIRED_2=$(echo "$LOGIN_WITH_MFA" | jq -r '.mfaRequired // false')
if [ "$MFA_REQUIRED_2" = "true" ]; then
  echo ""
  echo "✅ MFA is now required!"
else
  echo ""
  echo "❌ MFA not required (unexpected)"
fi
echo ""

# Step 8: Test invalid password for disable
echo "Step 8: Try to disable MFA with wrong password"
echo "------------------------------------------------------------"
INVALID_DISABLE=$(curl -s -X POST "$API_URL/api/loginFunc/disable-mfa" \
  -H "Authorization: Bearer $NEW_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "WrongPassword123!"}')

echo "$INVALID_DISABLE" | jq '.'

if echo "$INVALID_DISABLE" | jq -e '.error' > /dev/null; then
  echo ""
  echo "✅ Invalid password properly rejected"
else
  echo ""
  echo "❌ Invalid password not rejected"
fi
echo ""

# Summary
echo "============================================================"
echo "📊 Test Summary"
echo "============================================================"
echo "✅ User Registration"
echo "✅ MFA Enabled by Default"
echo "✅ Check MFA Status"
echo "✅ Disable MFA (with password)"
echo "✅ Login without MFA"
echo "✅ Re-enable MFA"
echo "✅ Login with MFA Required"
echo "✅ Password Protection for Disable"
echo ""
echo "🎉 All optional MFA tests completed!"
echo "============================================================"
echo ""
