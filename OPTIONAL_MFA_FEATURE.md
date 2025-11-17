# Optional MFA Feature - User Guide

## Overview

Users can now **enable or disable MFA** (Multi-Factor Authentication) for their accounts after logging in. By default, MFA is **enabled** for all users for maximum security, but users have the option to disable it if needed.

---

## Features

### ✅ Default Behavior
- **New users**: MFA is **enabled by default** when they register
- **Existing users**: MFA is **enabled by default** (can be disabled)
- **Security**: Users must confirm password to disable MFA

### ✅ User Control
- View MFA status
- Enable MFA
- Disable MFA (requires password confirmation)
- Re-enable MFA at any time

---

## API Endpoints

### 1. Get MFA Status

**Endpoint**: `GET /api/loginFunc/mfa-status`  
**Authentication**: Required (JWT token)

**Response**:
```json
{
  "mfaEnabled": true,
  "email": "user@example.com",
  "emailMasked": "us***@example.com"
}
```

**Example**:
```bash
curl -X GET http://localhost:3000/api/loginFunc/mfa-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Enable MFA

**Endpoint**: `POST /api/loginFunc/enable-mfa`  
**Authentication**: Required (JWT token)

**Response**:
```json
{
  "message": "MFA enabled successfully",
  "mfaEnabled": true,
  "snsSubscription": "Please check your email to confirm SNS subscription"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/loginFunc/enable-mfa \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**What happens**:
1. MFA is enabled for the user
2. User's email is subscribed to SNS (if configured)
3. User receives SNS confirmation email
4. User must confirm subscription to receive MFA codes

---

### 3. Disable MFA

**Endpoint**: `POST /api/loginFunc/disable-mfa`  
**Authentication**: Required (JWT token)  
**Body**: Password confirmation required

**Request**:
```json
{
  "password": "user-current-password"
}
```

**Response**:
```json
{
  "message": "MFA disabled successfully",
  "mfaEnabled": false,
  "warning": "Your account is now less secure. We recommend keeping MFA enabled."
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/loginFunc/disable-mfa \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "SecurePass123!@#"}'
```

**Security**:
- Requires password confirmation to prevent unauthorized disabling
- Returns security warning
- Logs the action for audit purposes

---

## Login Flow

### With MFA Enabled (Default)

```
1. User enters username/password
   ↓
2. Password verified ✓
   ↓
3. MFA code sent to email
   ↓
4. User enters 6-digit code
   ↓
5. Code verified ✓
   ↓
6. Login successful - JWT tokens issued
```

### With MFA Disabled

```
1. User enters username/password
   ↓
2. Password verified ✓
   ↓
3. Login successful - JWT tokens issued immediately
   (No MFA code required)
```

---

## User Experience

### Dashboard Settings (Frontend - To Be Implemented)

```
┌─────────────────────────────────────┐
│  Security Settings                  │
├─────────────────────────────────────┤
│                                     │
│  Two-Factor Authentication          │
│  ○ Enabled  ○ Disabled              │
│                                     │
│  Status: ✓ Active                   │
│  Email: us***@example.com           │
│                                     │
│  [Enable MFA]  [Disable MFA]        │
│                                     │
│  ⚠️  Disabling MFA reduces your     │
│     account security                │
│                                     │
└─────────────────────────────────────┘
```

---

## Database Schema

### User Table Updates

The `studentUserDB` table now includes:

```javascript
{
  userId: 1234567890,
  username: "john",
  fullName: "John Doe",
  email: "john@example.com",
  password: "$2b$14$...",
  mfaEnabled: true,           // NEW: MFA preference
  mfaUpdatedAt: 1699876543210 // NEW: Last update timestamp
}
```

**Default Values**:
- `mfaEnabled`: `true` (if not set, defaults to true)
- `mfaUpdatedAt`: Timestamp of last MFA preference change

---

## Security Considerations

### ✅ Why MFA is Enabled by Default

1. **Best Practice**: Industry standard for account security
2. **Protection**: Prevents unauthorized access even if password is compromised
3. **Compliance**: Many regulations require MFA for sensitive data
4. **User Safety**: Protects users from account takeover attacks

### ⚠️ Risks of Disabling MFA

1. **Reduced Security**: Account protected only by password
2. **Vulnerability**: Susceptible to password breaches
3. **No Second Factor**: No additional verification layer
4. **Audit Trail**: All MFA changes are logged

### 🔒 Security Measures

1. **Password Required**: Must confirm password to disable MFA
2. **Audit Logging**: All MFA changes are logged
3. **Warning Messages**: Users warned about security implications
4. **Easy Re-enable**: Users can re-enable MFA anytime
5. **Default Enabled**: New users start with MFA enabled

---

## Implementation Details

### Backend Functions

**File**: `BackEnd/database/userOperations.js`
- `updateMFAPreference(userId, mfaEnabled)` - Update MFA setting
- `getMFAPreference(userId)` - Get current MFA setting

**File**: `BackEnd/Controller/loginController.js`
- `getMFAStatus(req, res)` - Get MFA status
- `enableMFA(req, res)` - Enable MFA
- `disableMFA(req, res)` - Disable MFA (requires password)

**File**: `BackEnd/Router/loginRoutes.js`
- `GET /api/loginFunc/mfa-status` - Get status
- `POST /api/loginFunc/enable-mfa` - Enable
- `POST /api/loginFunc/disable-mfa` - Disable

---

## Testing

### Test MFA Status

```bash
# 1. Login to get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/loginFunc/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"testuser","password":"SecurePass123!@#"}' \
  | jq -r '.accessToken')

# 2. Check MFA status
curl -X GET http://localhost:3000/api/loginFunc/mfa-status \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Test Enable MFA

```bash
curl -X POST http://localhost:3000/api/loginFunc/enable-mfa \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Test Disable MFA

```bash
curl -X POST http://localhost:3000/api/loginFunc/disable-mfa \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password":"SecurePass123!@#"}' | jq '.'
```

---

## Frontend Integration (Next Steps)

### 1. Add MFA Settings Page

Create: `FrontEnd/app/settings/page.jsx`

```jsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  // Fetch MFA status
  useEffect(() => {
    fetchMFAStatus();
  }, []);

  const fetchMFAStatus = async () => {
    // Call GET /api/loginFunc/mfa-status
  };

  const handleEnableMFA = async () => {
    // Call POST /api/loginFunc/enable-mfa
  };

  const handleDisableMFA = async () => {
    // Call POST /api/loginFunc/disable-mfa
  };

  return (
    <div>
      <h1>Security Settings</h1>
      {/* MFA toggle UI */}
    </div>
  );
}
```

### 2. Update API Client

Add to `FrontEnd/lib/api.js`:

```javascript
export const mfa = {
  async getStatus() {
    return apiRequest('/api/loginFunc/mfa-status', {
      method: 'GET'
    });
  },
  
  async enable() {
    return apiRequest('/api/loginFunc/enable-mfa', {
      method: 'POST'
    });
  },
  
  async disable(password) {
    return apiRequest('/api/loginFunc/disable-mfa', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
  }
};
```

### 3. Add Settings Link to Dashboard

Update navigation to include "Settings" link.

---

## Benefits

### For Users
- ✅ **Control**: Choose their own security level
- ✅ **Flexibility**: Can disable MFA if needed
- ✅ **Transparency**: Clear status and warnings
- ✅ **Easy Management**: Simple enable/disable process

### For Administrators
- ✅ **Default Security**: MFA enabled by default
- ✅ **Audit Trail**: All changes logged
- ✅ **User Choice**: Respects user preferences
- ✅ **Compliance**: Meets security requirements

---

## Summary

The optional MFA feature provides:

1. **Default Security**: MFA enabled for all users by default
2. **User Control**: Users can disable MFA if needed
3. **Password Protection**: Requires password to disable
4. **Easy Re-enable**: Can turn MFA back on anytime
5. **Clear Status**: Users always know their MFA status
6. **Security Warnings**: Users informed of risks

**Recommendation**: Keep MFA enabled for maximum account security! 🔒
