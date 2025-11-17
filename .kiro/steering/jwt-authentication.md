---
inclusion: always
---

# JWT Authentication Guidelines

## Token Generation
- Use strong, randomly generated secrets (minimum 256 bits)
- Store JWT_SECRET in environment variables, NEVER hardcode
- Set appropriate expiration times:
  - Access tokens: 15-30 minutes
  - Refresh tokens: 7-30 days
- Include essential claims: userId, username, email
- Add issuer and audience for additional validation

## Signing Algorithms
- **HS256/HS384/HS512**: Symmetric (same key for sign/verify) - Use for internal services
- **RS256/RS384/RS512**: Asymmetric (private/public key) - Use when verifier shouldn't sign
- **ES256/ES384/ES512**: ECDSA (smaller keys, equivalent security) - Best performance

## Token Structure
```javascript
const payload = {
  userId: user.id,
  username: user.username,
  email: user.email,
  type: 'access' // or 'refresh'
};

const options = {
  expiresIn: '30m',
  issuer: 'your-app-name',
  audience: 'your-app-users'
};

const token = jwt.sign(payload, JWT_SECRET, options);
```

## Token Verification
- Verify on EVERY protected route
- Validate signature, expiration, issuer, and audience
- Use algorithms whitelist to prevent algorithm confusion attacks
- Handle verification errors gracefully
- Check token against blacklist for logout functionality

## Verification Pattern
```javascript
try {
  const decoded = jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256'],
    issuer: 'your-app-name',
    audience: 'your-app-users'
  });
  // Token is valid, use decoded payload
} catch (err) {
  // Token is invalid or expired
  // Return 401 Unauthorized
}
```

## Token Storage
- **Server-side**: Store refresh tokens in httpOnly cookies (preferred)
- **Client-side**: Avoid localStorage if possible (XSS vulnerable)
- If using localStorage, implement additional security measures
- Never expose tokens in URL parameters or logs

## Security Best Practices
- Implement token rotation on refresh
- Use HTTPS only for token transmission
- Implement token blacklisting for logout
- Set short expiration times for access tokens
- Use refresh tokens for long-lived sessions
- Validate token claims (exp, nbf, aud, iss)
- Implement rate limiting on token endpoints
- Monitor for suspicious token usage patterns

## Refresh Token Flow
1. Client sends expired access token + valid refresh token
2. Server validates refresh token
3. Server generates new access token (and optionally new refresh token)
4. Server returns new tokens
5. Client updates stored tokens

## Error Handling
- Return 401 for invalid/expired tokens
- Return 403 for valid tokens with insufficient permissions
- Don't expose token details in error messages
- Log authentication failures for security monitoring
- Implement exponential backoff for repeated failures

## Claims to Include
- **iat**: Issued at timestamp
- **exp**: Expiration timestamp
- **nbf**: Not before timestamp (optional)
- **iss**: Issuer identifier
- **aud**: Audience identifier
- **sub**: Subject (user identifier)
- **jti**: JWT ID for tracking (optional)
- Custom claims: userId, username, email, roles, permissions
