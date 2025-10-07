# Stack16 🤖

A modern AI-powered robo advisor web application that provides personalized investment portfolio recommendations based on user risk assessment and preferences.

## 🚀 Features

- **Password-based Authentication** with secure bcrypt hashing
- **Risk Assessment Questionnaire** for personalized investment profiles
- **AI-Powered Portfolio Recommendations** using Groq API
- **Real-time Portfolio Performance** with 3-year historical data
- **Interactive AI Chat** for investment guidance
- **Responsive Design** for web and mobile
- **Dark/Light Mode** support

## 🛡️ Security

This application implements industry-standard security practices:

- **Password Security**: bcrypt hashing with salting and peppering
- **Session Management**: Secure HTTP-only cookies with proper expiration
- **Input Validation**: Comprehensive client and server-side validation
- **Environment Variables**: Sensitive data stored securely in environment variables

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database (Neon, Supabase, or similar)
- Render account for deployment

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/monteirojoaoluiz/Stack16.git
   cd Stack16
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the root directory with the following variables:
   ```bash
   NODE_ENV=development
   PORT=5000
   DATABASE_URL=your_postgres_connection_string
   SESSION_SECRET=your_random_secret_string
   PASSWORD_PEPPER=your_random_pepper_string
   SENDGRID_API_KEY=your_sendgrid_api_key
   FRONTEND_URL=http://localhost:5000
   GROQ_API_KEY=your_groq_api_key
   LOG_LEVEL=info
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Development**
   ```bash
   npm run dev
   ```

6. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `SESSION_SECRET` | Random string for session encryption | ✅ |
| `PASSWORD_PEPPER` | Random string for password peppering | ✅ |
| `GROQ_API_KEY` | API key for Groq AI services | ❌ |
| `SENDGRID_API_KEY` | API key for SendGrid email | ❌ |
| `FRONTEND_URL` | Your deployed app URL | ❌ |
| `NODE_ENV` | Environment (production/development) | ❌ |

## 🗄️ Database Schema

The application uses Drizzle ORM with PostgreSQL. Key tables:

- **users**: User accounts with secure password storage
- **risk_assessments**: Investment risk profile data
- **portfolio_recommendations**: AI-generated portfolio allocations
- **portfolio_messages**: Chat history with AI assistant
- **sessions**: Secure session storage

## 🚀 Deployment

### Render Deployment

1. **Connect Repository**
   - Connect your GitHub repository to Render
   - Set build command: `npm run build`
   - Set start command: `npm start`

2. **Environment Variables**
   - Add all required environment variables in Render dashboard
   - Ensure `NODE_ENV=production`

3. **Database**
   - Use Neon, Supabase, or any PostgreSQL provider
   - Run database migrations after deployment

## 🧪 Development

```bash
# Install dependencies
npm install

# Database setup
npm run db:push

# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

## 🔍 Code Quality

This project uses the following tools to ensure code quality:

- **TypeScript** - Static type checking
- **ESLint** - Code linting with TypeScript, React, and React Hooks plugins
- **Prettier** - Code formatting
- **GitHub Actions CI** - Automated checks on push and PR

The CI pipeline runs:
1. Linting checks
2. Type checking
3. Production build validation

## 📁 Project Structure

```
InvestoPilotwo/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and API clients
│   │   └── pages/          # Page components
├── server/                 # Backend Node.js application
│   ├── config.ts          # Environment configuration & validation
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API routes and authentication
│   ├── storage.ts         # Database operations
│   ├── errorHandler.ts    # Centralized error handling
│   ├── logger.ts          # Winston logging setup
│   └── index.ts           # Server entry point
├── shared/                 # Shared types and schemas
├── migrations/             # Database migrations
├── .github/workflows/      # CI/CD workflows
└── docs/                   # Documentation
```

## 🔐 Security Best Practices

- **Never commit .env files** - They are ignored by .gitignore
- **Rotate API keys regularly** - Especially after any suspected exposure
- **Use strong passwords** - Minimum 8 characters with mixed case, numbers, and symbols
- **Keep dependencies updated** - Regularly update npm packages for security patches
- **Monitor logs** - Check application logs for suspicious activity

## 📚 Documentation

- [Design Guidelines](./design_guidelines.md)
- [API Documentation](./documentation.md)
- [Future Improvements](./todo.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational purposes. See individual component licenses for details.

## ⚠️ Disclaimer

This application is for educational and demonstration purposes only. It does not provide actual financial advice. Always consult with qualified financial professionals before making investment decisions.

---

Built with ❤️ using React, TypeScript, Node.js, and PostgreSQL