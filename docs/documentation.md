# Robo Advisor Application

## Project Overview

This is a school project for a **robo advisor web application** that provides personalized investment portfolio recommendations based on user input. The application is designed to work seamlessly on both **web and mobile devices**, offering a modern, responsive user experience with email-based authentication, risk assessment forms, and AI-powered portfolio interaction.

## Core Features

The application consists of three essential functionalities:

### 1. Authentication System
- **Password-Based Authentication**: Secure email and password authentication with bcrypt hashing
- **Password Security**: Implements industry-standard security with salt and pepper techniques
- **Session Management**: Persistent sessions using PostgreSQL session store with HTTP-only cookies
- **User Account Management**: Secure user sessions with sidebar navigation for account management
- **Optional Magic Link**: Legacy support for passwordless email authentication (alternative method)

### 2. Risk Assessment & User Input
- **Comprehensive Investment Questionnaire**:
  - **Risk Appetite Assessment**: Determines user's comfort with market volatility
  - **Geographic Preferences**: Options for US-only investments
  - **ESG Preferences**: Focus on Environmental, Social, and Governance criteria
  - **Life Stage Analysis**: Considers user's current financial life stage
- **Form-based Input**: Clean, mobile-friendly forms for data collection
- **Data Persistence**: User inputs are securely stored and retrievable via backend API

### 3. Portfolio Recommendations & AI Chat
- **Personalized Portfolio Generation**: Algorithmic ETF-based recommendations tailored to user risk profile
- **Performance Visualization**: 3-year historical performance charts with daily data and key metrics
- **Real-Time Market Data**: Integration with Yahoo Finance API for live ETF prices and historical data
- **Advanced Performance Metrics**: Total return, annualized volatility, Sharpe ratio, and year-by-year performance
- **AI-Powered Chat Interface**: "Talk to Your Portfolio" using **openai/gpt-oss-120b** on **Groq**
- **Interactive Portfolio Management**: Context-aware AI assistant that understands your specific portfolio allocation
- **Financial Safeguards**: AI is trained to only answer finance-related questions and includes appropriate disclaimers

## Application Architecture

### Frontend Structure
- **Landing Page**: Clean hero section with sign-in/sign-up buttons for email authentication
- **User Dashboard**: Left sidebar navigation for account management and page routing
- **Risk Assessment Form**: Multi-step questionnaire capturing user investment preferences
- **Portfolio Results Page**: Visual asset allocation charts with historical performance data
- **AI Chat Interface**: Real-time conversation component integrated with Groq API

### Backend Structure
- **Authentication Service**: Password-based authentication with Passport.js and bcrypt hashing (12 rounds + pepper)
- **Session Management**: PostgreSQL-backed sessions using connect-pg-simple for persistence
- **Email Service**: SendGrid integration for optional magic link authentication and notifications
- **User Data Management**: PostgreSQL database with Drizzle ORM for user profiles and preferences
- **Portfolio Recommendation Engine**: Risk-based ETF allocation algorithm supporting conservative, moderate, and aggressive strategies
- **Market Data Integration**: Yahoo Finance API for real-time and historical ETF performance data
- **AI Integration**: Groq API connection using openai/gpt-oss-120b model for portfolio discussions
- **API Endpoints**: RESTful routes for authentication, user data, portfolio generation, market data, and chat functionality

### Technology Stack
- **Frontend**: React 18 with TypeScript, Tailwind CSS, shadcn/ui component library
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state and caching
- **Backend**: Node.js with Express, TypeScript
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Passport.js with Local Strategy, bcrypt for password hashing
- **Session Storage**: PostgreSQL session store with connect-pg-simple
- **AI Services**: Groq API with openai/gpt-oss-120b model
- **Email Service**: SendGrid for optional magic link delivery
- **Market Data**: Yahoo Finance 2 API for ETF historical and real-time data
- **Data Visualization**: Recharts for portfolio performance charts (line charts, donut charts)
- **Build Tools**: Vite for frontend, esbuild for backend bundling

## API Endpoints

### Authentication Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user with email/password | No |
| POST | `/api/auth/login` | Login with email/password | No |
| POST | `/api/auth/logout` | Logout and destroy session | Yes |
| GET | `/api/auth/user` | Get current authenticated user | Yes |
| POST | `/api/auth/send` | Send magic link to email (legacy) | No |
| GET | `/api/auth/verify` | Verify magic link token (legacy) | No |

### Risk Assessment Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/risk-assessment` | Create or update risk assessment | Yes |
| GET | `/api/risk-assessment` | Get user's risk assessment | Yes |

### Portfolio Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/portfolio/generate` | Generate portfolio from risk assessment | Yes |
| GET | `/api/portfolio` | Get user's portfolio recommendations | Yes |
| GET | `/api/portfolio/performance` | Get combined 3-year portfolio performance | Yes |
| GET | `/api/etf/:ticker/history` | Get historical data for specific ETF | Yes |

### Chat Endpoints
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/portfolio/:portfolioId/messages` | Get all chat messages for portfolio | Yes |
| POST | `/api/portfolio/:portfolioId/messages` | Send message and get AI response | Yes |
| DELETE | `/api/portfolio/:portfolioId/messages` | Clear all chat history for portfolio | Yes |

## Database Schema

### Users Table
Stores user account information with secure password hashing.
- `id` (UUID, Primary Key)
- `email` (Text, Unique)
- `password` (Text, Hashed with bcrypt)
- `firstName` (Text)
- `lastName` (Text)
- `profileImageUrl` (Text)
- `createdAt` (Timestamp)

### Risk Assessments Table
Stores user investment preferences and risk tolerance.
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → users.id)
- `riskTolerance` (Text: 'conservative' | 'moderate' | 'aggressive')
- `timeHorizon` (Text: 'short-term' | 'medium-term' | 'long-term')
- `lifeStage` (Text: 'early-career' | 'mid-career' | 'pre-retirement' | 'retirement')
- `geographicFocus` (JSONB: array of geographic investment focuses - ['netherlands', 'europe-ex-nl', 'united-states', 'developed-ex-us-europe', 'emerging-markets'])
- `esgOnly` (Boolean: ESG investment preference)
- `dividendVsGrowth` (Text: investment style preference - 'dividend-focus' | 'balanced' | 'growth-focus')
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### Portfolio Recommendations Table
Stores generated portfolio allocations and metadata.
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → users.id)
- `riskAssessmentId` (UUID, Foreign Key → risk_assessments.id)
- `allocations` (JSONB: array of ETF allocation objects)
- `totalValue` (Numeric: for future use)
- `totalReturn` (Numeric: for future use)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### Portfolio Messages Table
Stores chat conversation history between user and AI.
- `id` (UUID, Primary Key)
- `portfolioId` (UUID, Foreign Key → portfolio_recommendations.id)
- `userId` (UUID, Foreign Key → users.id)
- `content` (Text: message content)
- `sender` (Text: 'user' | 'ai')
- `createdAt` (Timestamp)

### Sessions Table
PostgreSQL-backed session storage (automatically managed by connect-pg-simple).
- `sid` (Text, Primary Key)
- `sess` (JSON: session data)
- `expire` (Timestamp: session expiration)

### Auth Tokens Table (Legacy)
Stores magic link tokens for passwordless authentication.
- `id` (UUID, Primary Key)
- `email` (Text)
- `token` (UUID)
- `expiresAt` (Timestamp)
- `used` (Boolean)
- `createdAt` (Timestamp)

## Portfolio Allocation Algorithm

The application uses a risk-based ETF allocation strategy:

### Conservative Portfolio (60% Bonds, 40% Equity)
- **BND** (60%): Vanguard Total Bond Market ETF
- **VTI** (25%): Vanguard Total Stock Market ETF
- **VXUS** (10%): Vanguard Total International Stock ETF
- **VNQ** (5%): Vanguard Real Estate ETF

### Moderate Portfolio (20% Bonds, 80% Equity)
- **VTI** (55%): Vanguard Total Stock Market ETF
- **VXUS** (20%): Vanguard Total International Stock ETF
- **BND** (20%): Vanguard Total Bond Market ETF
- **VNQ** (5%): Vanguard Real Estate ETF

### Aggressive Portfolio (0% Bonds, 100% Equity)
- **VTI** (70%): Vanguard Total Stock Market ETF
- **VXUS** (20%): Vanguard Total International Stock ETF
- **QQQ** (10%): Invesco QQQ Trust (Growth)

### Preference Adjustments
- **ESG Preference**: Swaps standard ETFs for ESG alternatives (ESGV, ESGD, SUSB)
- **US-Only Preference**: Removes international exposure and reallocates to US equities
- **Automatic Normalization**: Ensures allocations always sum to exactly 100%

## Performance Metrics

The application calculates and displays the following portfolio metrics:

- **Total Return**: 3-year cumulative return percentage
- **Annualized Return**: Average yearly return over the period
- **Annualized Volatility**: Standard deviation of daily returns (annualized)
- **Sharpe Ratio**: Risk-adjusted return metric
- **Year-by-Year Performance**: Individual calendar year returns with visual progress bars

Performance data is calculated using:
- Daily adjusted close prices from Yahoo Finance
- Weighted portfolio returns based on allocation percentages
- Forward-filling for missing data points
- Normalization to index base 100

## Environment Variables

Required environment variables for deployment:

```
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-random-session-secret-min-32-chars
PASSWORD_PEPPER=your-random-pepper-string-for-extra-security
GROQ_API_KEY=your-groq-api-key (optional for chat feature)
SENDGRID_API_KEY=your-sendgrid-api-key (optional for magic links)
FRONTEND_URL=https://your-app-url.com (for production)
NODE_ENV=production (for production deployment)
```

## Security Best Practices

### Password Security
- **Bcrypt Hashing**: 12 rounds of salting for strong password protection
- **Peppering**: Additional secret pepper added before hashing for enhanced security
- **Password Requirements**: Minimum 8 characters with uppercase, lowercase, number, and special character

### Session Security
- **HTTP-Only Cookies**: Prevents XSS attacks by making cookies inaccessible to JavaScript
- **Secure Cookies**: HTTPS-only in production
- **SameSite Protection**: Lax setting for CSRF protection
- **Session Expiration**: 7-day automatic expiration
- **PostgreSQL Persistence**: Sessions survive server restarts

### API Security
- **Authentication Middleware**: All protected routes require valid session
- **User Ownership Verification**: Portfolio and chat operations verify user ownership
- **Input Validation**: Zod schema validation for all user inputs
- **SQL Injection Protection**: Drizzle ORM provides parameterized queries

### AI Safety
- **Scope Limitation**: AI only responds to finance-related questions
- **Disclaimer Injection**: AI responses include appropriate legal disclaimers
- **Context Isolation**: Each user's portfolio context is isolated
- **Temperature Control**: Lower temperature (0.5) for more consistent, conservative responses
