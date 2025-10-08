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
- Docker & Docker Compose (for local development)
- PostgreSQL database (Neon, Supabase, or similar for production)
- Render account for deployment (optional)

## 🚀 Quick Start

### Local Development with Docker

1. **Clone the repository**

   ```bash
   git clone https://github.com/monteirojoaoluiz/Stack16.git
   cd Stack16
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start PostgreSQL with Docker Compose**

   ```bash
   docker-compose up -d
   ```

4. **Environment Setup**

   ```bash
   cp .env.local.example .env
   # Edit .env with your API keys if needed
   ```

5. **Database Setup**

   ```bash
   npm run db:push
   ```

6. **Start Development Server**

   ```bash
   npm run dev
   ```

7. **Stop the database when done**
   ```bash
   docker-compose down
   ```

### Production Setup

1. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

2. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## 🔧 Environment Variables

| Variable           | Description                          | Required |
| ------------------ | ------------------------------------ | -------- |
| `DATABASE_URL`     | PostgreSQL connection string         | ✅       |
| `SESSION_SECRET`   | Random string for session encryption | ✅       |
| `PASSWORD_PEPPER`  | Random string for password peppering | ✅       |
| `GROQ_API_KEY`     | API key for Groq AI services         | ❌       |
| `SENDGRID_API_KEY` | API key for SendGrid email           | ❌       |
| `FRONTEND_URL`     | Your deployed app URL                | ❌       |
| `NODE_ENV`         | Environment (production/development) | ❌       |

## 🗄️ Database Schema

The application uses Drizzle ORM with PostgreSQL. Key tables:

- **users**: User accounts with secure password storage
- **risk_assessments**: Investment risk profile data
- **portfolio_recommendations**: AI-generated portfolio allocations
- **portfolio_messages**: Chat history with AI assistant
- **sessions**: Secure session storage

### Local Database Setup

For local development, use the included Docker Compose configuration:

```bash
# Start PostgreSQL container
docker-compose up -d

# Check database status
docker-compose ps

# View database logs
docker-compose logs postgres

# Connect to database (optional)
docker exec -it investopilotwo-db psql -U investopilot -d investopilotwo

# Stop and remove containers
docker-compose down

# Remove containers and volumes (reset database)
docker-compose down -v
```

The local database credentials are:

- **Host**: localhost
- **Port**: 5432
- **Database**: investopilotwo
- **User**: investopilot
- **Password**: investopilot_dev_password

Connection string: `postgresql://investopilot:investopilot_dev_password@localhost:5432/investopilotwo`

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

### Docker Compose Commands

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# View logs
docker-compose logs -f postgres

# Reset database (removes all data)
docker-compose down -v
```

### Development Workflow

```bash
# Install dependencies
npm install

# Start local PostgreSQL
docker-compose up -d

# Setup/update database schema
npm run db:push

# Development server (with hot reload)
npm run dev

# Build for production
npm run build

# Type checking
npm run check
```

## 📁 Project Structure

```
Stack16/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and API clients
│   │   └── pages/          # Page components
├── server/                 # Backend Node.js application
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API routes and authentication
│   ├── storage.ts         # Database operations
│   └── index.ts           # Server entry point
├── shared/                 # Shared types and schemas
├── migrations/            # Database migrations
├── docker-compose.yml     # Local PostgreSQL setup
├── .env.example           # Production environment template
└── .env.local.example     # Local development template
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
