# Robo Advisor Application

## Project Overview

This is a school project for a **robo advisor web application** that provides personalized investment portfolio recommendations based on user input. The application is designed to work seamlessly on both **web and mobile devices**, offering a modern, responsive user experience with email-based authentication, risk assessment forms, and AI-powered portfolio interaction.

## Core Features

The application consists of three essential functionalities:

### 1. Authentication System
- **Passwordless Email Authentication**: Users sign in using their email address
- **Magic Link System**: A secure login link is sent via email for passwordless access
- **User Account Management**: Secure user sessions with sidebar navigation for account management

### 2. Risk Assessment & User Input
- **Comprehensive Investment Questionnaire**:
  - **Risk Appetite Assessment**: Determines user's comfort with market volatility
  - **Geographic Preferences**: Options for US-only investments
  - **ESG Preferences**: Focus on Environmental, Social, and Governance criteria
  - **Life Stage Analysis**: Considers user's current financial life stage
- **Form-based Input**: Clean, mobile-friendly forms for data collection
- **Data Persistence**: User inputs are securely stored and retrievable via backend API

### 3. Portfolio Recommendations & AI Chat
- **Personalized Portfolio Generation**: Algorithmic recommendations based on user profile
- **Performance Visualization**: 3-year historical performance charts and metrics
- **AI-Powered Chat Interface**: "Talk to Your Portfolio" using **Kimi-k2-instruct** on **Groq**
- **Interactive Portfolio Management**: Users can discuss their investments with AI through a dedicated chat interface

## Application Architecture

### Frontend Structure
- **Landing Page**: Clean hero section with sign-in/sign-up buttons for email authentication
- **User Dashboard**: Left sidebar navigation for account management and page routing
- **Risk Assessment Form**: Multi-step questionnaire capturing user investment preferences
- **Portfolio Results Page**: Visual asset allocation charts with historical performance data
- **AI Chat Interface**: Real-time conversation component integrated with Groq API

### Backend Structure
- **Email Authentication Service**: SendGrid integration for passwordless login links
- **User Data Management**: PostgreSQL database with Drizzle ORM for user profiles and preferences
- **Portfolio Recommendation Engine**: Algorithmic logic generating personalized investment allocations
- **AI Integration**: Groq API connection for kimi-k2-instruct model portfolio discussions
- **API Endpoints**: RESTful routes for authentication, user data, portfolio generation, and chat functionality

### Technology Stack
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js with Express, Drizzle ORM for PostgreSQL
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Custom email-based system with session management
- **AI Services**: Groq API with kimi-k2-instruct model
- **Email Service**: SendGrid for magic link delivery
- **Data Visualization**: Chart components for portfolio performance metrics
