# Stack16 API Documentation

## Overview

Stack16's API is organized into modular endpoints for authentication, portfolio management, risk assessment, market data, and AI chat functionality.

## Base URL

```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

All endpoints (except auth endpoints) require authentication via session cookies.

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Logout
```http
POST /api/auth/logout
```

### Get Current User
```http
GET /api/auth/user
```

### Password Reset
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123!"
}
```

### Change Password
```http
POST /api/auth/change-password
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!",
  "confirmPassword": "NewPass123!"
}
```

### Account Management
```http
# Change Email
POST /api/auth/change-email
Content-Type: application/json

{
  "newEmail": "newemail@example.com"
}

# Delete Account (GDPR Right to be Forgotten)
POST /api/auth/delete-account
Content-Type: application/json

{
  "currentPassword": "SecurePass123!"
}

# Download Data (GDPR Data Portability)
GET /api/auth/download-data
```

## Risk Assessment

### Create/Update Risk Assessment
```http
POST /api/risk-assessment
Content-Type: application/json

{
  "lifeStage": "mid-career",
  "riskTolerance": "moderate",
  "timeHorizon": "long-term",
  "geographicFocus": ["united-states", "developed-markets"],
  "esgExclusions": ["tobacco", "weapons"],
  "investmentExperience": "some-experience",
  "investmentKnowledge": "good",
  "dividendVsGrowth": "balanced",
  ... (other questionnaire fields)
}
```

### Get Current Assessment
```http
GET /api/risk-assessment
```

## Portfolio Management

### Generate Portfolio
```http
POST /api/portfolio/generate
```

Generates a personalized portfolio based on the user's risk assessment.

### Get Current Portfolio
```http
GET /api/portfolio
```

Returns the user's most recent portfolio with allocations.

### Get Portfolio Performance
```http
GET /api/portfolio/performance
```

Returns 3-year historical performance data normalized to index 100.

## Market Data

### Get ETF History
```http
GET /api/etf/:ticker/history?range=1y&interval=1wk

Parameters:
- ticker: ETF ticker symbol (e.g., VTI, BND)
- range: 6m, 1y, 3y, 5y (default: 1y)
- interval: 1d, 1wk, 1mo (default: 1wk)
```

### Get ETF Information
```http
GET /api/etf/:ticker/info

Returns:
- Current price
- Dividend yield
- 52-week high/low
- Expense ratio
- Year-over-year return
```

## AI Chat

### Get Chat Messages
```http
GET /api/portfolio/:portfolioId/messages
```

### Send Chat Message (Streaming)
```http
POST /api/portfolio/:portfolioId/messages
Content-Type: application/json

{
  "content": "What's my portfolio allocation strategy?"
}

Response: Server-Sent Events (SSE) stream
- type: 'userMessage' - Echoes user message
- type: 'chunk' - AI response chunks
- type: 'complete' - Final AI message
- type: 'error' - Error occurred
```

### Delete Chat History
```http
DELETE /api/portfolio/:portfolioId/messages
```

## Rate Limiting

- **Login**: 5 attempts per 15 minutes
- **Registration**: 3 attempts per hour
- **Password Reset**: 3 requests per hour
- **Email Change**: 3 requests per hour

## Error Responses

All endpoints return standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

Error response format:
```json
{
  "message": "Error description",
  "errors": [] // Optional validation errors array
}
```

## Data Models

### Portfolio Allocation
```typescript
{
  ticker: string;      // ETF ticker
  name: string;        // Full name
  percentage: number;  // Allocation percentage
  color: string;       // Chart color
  assetType: string;   // Asset category
}
```

### Investor Profile
```typescript
{
  risk_tolerance: number;      // 0-100
  risk_capacity: number;       // 0-100
  investment_horizon: number;  // 0-100
  investor_experience: number; // 0-100
  regions_selected: string[];
  industry_exclusions: string[];
}
```

## Caching

Market data endpoints implement caching:
- Historical data: 5 minutes
- ETF info: 10 minutes

Clients can set `Cache-Control` headers for additional browser caching.

