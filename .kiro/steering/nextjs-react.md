---
inclusion: always
---

# Next.js and React Development Guidelines

## Project Structure
```
/FrontEnd
  /js         - JavaScript/React components
  /CSS        - Stylesheets
  /HTML       - HTML templates (if needed)
```

## Component Patterns
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types or TypeScript

## State Management
- Use useState for local component state
- Use useReducer for complex state logic
- Lift state up when needed by multiple components
- Consider Context API for global state

## Form Handling
```javascript
const [formData, setFormData] = useState({
  username: '',
  email: '',
  password: ''
});

const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value
  });
};

const handleSubmit = async (e) => {
  e.preventDefault();
  // Validate and submit
};
```

## API Integration
- Use fetch() for API calls
- Implement proper error handling
- Show loading states during requests
- Handle different response status codes
- Store tokens securely (httpOnly cookies preferred)

## API Call Pattern
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

## Next.js Routing
- Use file-based routing in pages/ or app/ directory
- Create dynamic routes with [param] syntax
- Use Link component for client-side navigation
- Implement proper 404 and error pages

## Next.js API Routes (Pages Router)
```javascript
// pages/api/endpoint.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Handle POST
    res.status(200).json({ success: true });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
```

## Next.js App Router
- Use Server Components by default
- Add 'use client' for client-side interactivity
- Use route.ts for API routes
- Implement proper loading and error states

## Form Validation
- Validate on both client and server
- Show real-time validation feedback
- Implement password strength indicator
- Validate email format with regex
- Check password policy compliance

## Password Validation Pattern
```javascript
const validatePassword = (password) => {
  const minLength = password.length >= 10;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  return {
    isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
    strength: calculateStrength(password),
    feedback: generateFeedback(password)
  };
};
```

## Authentication Flow
1. User submits credentials
2. Client validates input
3. Client sends request to API
4. Server validates and returns JWT
5. Client stores token securely
6. Client includes token in subsequent requests
7. Server verifies token on protected routes

## Error Handling
- Display user-friendly error messages
- Handle network errors gracefully
- Implement retry logic for failed requests
- Show appropriate feedback for different error types

## Loading States
- Show loading indicators during async operations
- Disable form inputs while submitting
- Provide visual feedback for user actions
- Implement skeleton screens for better UX

## Accessibility
- Use semantic HTML elements
- Add proper ARIA labels
- Ensure keyboard navigation works
- Provide alt text for images
- Maintain proper heading hierarchy
- Ensure sufficient color contrast

## Security
- Never store sensitive data in localStorage without encryption
- Implement CSRF protection
- Sanitize user inputs before rendering
- Use Content Security Policy
- Implement proper CORS configuration
- Validate all data on server-side

## Performance
- Implement code splitting
- Lazy load components when appropriate
- Optimize images with Next.js Image component
- Minimize bundle size
- Use React.memo for expensive components
- Implement proper caching strategies
