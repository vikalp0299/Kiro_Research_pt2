---
inclusion: always
---

# Bcrypt Password Security Guidelines

## Salt Rounds Configuration
- Use minimum 12 salt rounds (recommended: 14 for production)
- Higher rounds = more secure but slower
- Balance security with performance based on your use case
- Store salt rounds in environment variables for easy adjustment

## Password Hashing
- Always hash passwords before storing in database
- Use async methods (hash, genSalt) in production for non-blocking operations
- Use sync methods (hashSync, genSaltSync) only in scripts or initialization
- Never store plain text passwords

## Password Comparison
- Use bcrypt.compare() for async comparison
- Use bcrypt.compareSync() only when necessary
- Always compare against stored hash, never decrypt
- Return boolean result, don't expose hash details

## Implementation Patterns

### Async Pattern (Recommended)
```javascript
const bcrypt = require('bcrypt');
const saltRounds = 14;

// Hashing
const hash = await bcrypt.hash(password, saltRounds);

// Comparing
const match = await bcrypt.compare(password, hash);
```

### With Separate Salt Generation
```javascript
const salt = await bcrypt.genSalt(saltRounds);
const hash = await bcrypt.hash(password, salt);
```

## Security Best Practices
- Never log passwords or hashes
- Implement rate limiting on authentication endpoints
- Use HTTPS for all password transmissions
- Implement account lockout after failed attempts
- Consider adding pepper (server-side secret) for additional security
- Regularly update bcrypt library for security patches

## Password Policy
- Minimum 12 characters
- Require uppercase, lowercase, numbers, special characters
- Check against common password dictionaries
- Implement password history to prevent reuse
- Force password changes on security events

## Error Handling
- Don't reveal whether username or password was incorrect
- Use generic error messages: "Invalid credentials"
- Log failed attempts for security monitoring
- Implement exponential backoff for repeated failures
