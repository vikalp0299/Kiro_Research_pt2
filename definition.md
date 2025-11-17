Before Explicit definition  of Security.

1. WHEN the System handles passwords, THE System SHALL use bcrypt with minimum 12 salt rounds for hashing
2. WHEN the System generates JWT tokens, THE System SHALL use a 256-bit secret stored in environment variables
3. WHEN the System receives API requests to protected endpoints, THE System SHALL verify the JWT token signature and expiration
4. WHEN the System detects invalid or expired tokens, THE System SHALL return HTTP 401 Unauthorized
5. WHEN the System receives user input, THE System SHALL validate and sanitize all inputs on both client and server sides
6. WHEN the System communicates between frontend and backend, THE System SHALL use HTTPS for all data transmission
7. WHEN the System stores sensitive configuration, THE System SHALL use environment variables and never hardcode secrets
8. WHEN the System implements authentication endpoints, THE System SHALL apply rate limiting of 5 attempts per 15 minutes
9. WHEN the System handles errors, THE System SHALL not expose sensitive information in error messages
10. WHEN the System logs events, THE System SHALL not log passwords, tokens, or other sensitive data