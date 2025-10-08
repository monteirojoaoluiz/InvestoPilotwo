<!--
Sync Impact Report:
- Modified Principles: All principles rewritten for POC/learning focus
  - Removed: Testing & Quality Assurance principle (tests optional)
  - Downgraded: Security (basic only), Performance (best-effort)
  - Elevated: Learning & Experimentation, Speed of Development
- Added Sections: POC Scope & Limitations
- Removed Sections: Compliance Considerations (too formal for POC)
- Templates Requiring Updates:
  ✅ plan-template.md - Constitution Check now POC-focused
  ✅ spec-template.md - Requirements relaxed for experimentation
  ✅ tasks-template.md - Tests marked optional by default
- Follow-up TODOs: None
- Rationale: Complete rewrite of principles for rapid POC/educational context without versioning
-->

# Stack16 (InvestoPilot) Constitution

**Project Type**: Proof-of-Concept / Educational Demo
**Primary Goal**: Learning and experimentation with AI-powered financial applications
**Target Audience**: Personal portfolio project, not production users

## Core Principles

### I. Speed Over Perfection
Rapid iteration and experimentation take priority over production quality. Development SHOULD:
- Ship features quickly to test concepts and learn
- Use existing design patterns from design_guidelines.md where convenient, but don't let perfect design block progress
- Responsive design is nice-to-have, not mandatory - desktop-first is acceptable
- Prioritize "good enough" over "perfect" - this is a learning project

**Rationale**: This is a POC for learning AI integration and financial app concepts. Speed and experimentation enable faster learning cycles. Production-grade polish isn't necessary for personal portfolio demonstrations.

### II. Basic Security (Not Production-Grade)
Implement basic security practices, but don't over-engineer for a POC:
- Password hashing with bcrypt is already in place - keep it
- Environment variables for API keys (DATABASE_URL, SESSION_SECRET, GROQ_API_KEY)
- Don't store real financial data or PII - this is demo/test data only
- Basic input validation to prevent obvious issues, but comprehensive validation is overkill
- No need for rate limiting, advanced threat protection, or security audits

**Rationale**: This POC will never handle real user data or real money. Basic security prevents obvious mistakes, but production-grade security is unnecessary overhead for a learning project.

### III. AI Experimentation & Learning
AI is the core learning objective - experiment freely:
- Try different prompts and approaches to see what works
- AI recommendations can be experimental - this is for learning, not real advice
- Basic error handling for API failures is sufficient (show friendly error message)
- Logging AI interactions is optional - implement only if useful for debugging
- Focus on making AI features interesting and functional, not necessarily optimal

**Rationale**: The primary goal is learning how to integrate AI into financial applications. Experimentation reveals what works and what doesn't. Perfect AI outputs aren't required for a POC demonstration.

### IV. Pragmatic Data Handling
Use TypeScript and basic validation, but don't over-engineer:
- TypeScript types help catch obvious bugs - keep using them
- Basic client-side validation for UX (required fields, format checks)
- Server-side validation for database constraints - keep it simple
- Database schema via Drizzle ORM - already set up, no need to change
- If something breaks, fix it when noticed - don't preemptively validate everything

**Rationale**: TypeScript and Drizzle provide good baseline safety with minimal effort. This POC uses test data only, so data integrity issues won't cause real harm. Focus validation effort on actually broken things.

### V. Manual Testing is Sufficient
Automated testing is NOT required for this POC:
- Manual testing by clicking through features is good enough
- No unit tests, integration tests, or contract tests needed
- If it works when you test it manually, ship it
- Tests add development time without proportional value for a personal POC
- Focus time on building features, not test infrastructure

**Rationale**: This is a learning project and portfolio piece, not a production application. Manual testing catches obvious issues. Time spent writing tests could be spent building more features or learning new concepts.

### VI. "Good Enough" Performance
Optimize only if performance becomes obviously problematic:
- If pages load reasonably fast (within a few seconds), that's fine
- Loading states are nice UX - add spinners for long operations
- Don't prematurely optimize database queries or bundle sizes
- AI generation might be slow (Groq API dependent) - that's acceptable
- Code splitting and advanced optimizations are unnecessary for POC scale

**Rationale**: This POC will handle one user (you) doing demos. Premature optimization wastes time. If something feels slow while using it, optimize that specific thing. Otherwise, ship features.

## POC Scope & Limitations

### What This Project IS
- A learning exercise for AI integration in financial apps
- A portfolio demonstration piece showing technical capabilities
- An experimental playground for trying new technologies and approaches
- Educational/demo purposes only - never for real financial advice or transactions

### What This Project IS NOT
- A production-ready application
- Suitable for real users or real financial decisions
- Subject to financial regulations or compliance requirements
- Tested, secure, or reliable enough for actual use

### Acceptable Shortcuts
- Hardcoded test data instead of comprehensive data management
- Simplified error handling (generic error messages are fine)
- Skipping edge cases that are unlikely in demo scenarios
- Copy-pasting code if it's faster than abstracting
- Using AI-generated code without extensive review
- Leaving TODOs and known issues unfixed if they don't block demos

## Development Workflow

### Code Review & Version Control
- Work on whatever branch is currently active
- Commit directly to current branch for rapid POC development
- Commit messages should be descriptive but don't need to be perfect
- Git history helps track changes but doesn't need to be pristine

### Environment Management
- Local development uses Docker Compose for PostgreSQL (docker-compose.yml)
- Development environment variables in .env (gitignored)
- Production environment variables configured in deployment platform (Render, Neon, Supabase)
- Never commit .env files or API keys to version control

### Technology Stack Consistency
- **Frontend**: React 18+, TypeScript, Tailwind CSS, Tanstack Router, Tanstack Query
- **Backend**: Node.js 18+, Express, Drizzle ORM
- **Database**: PostgreSQL (local via Docker, production via Neon/Supabase)
- **AI**: Groq API for portfolio recommendations and chat
- **Deployment**: Render or similar Node.js hosting platform

### Database Migrations
- Schema changes MUST use Drizzle migrations (`npm run db:push` for development)
- Production migrations must be reviewed and tested before deployment
- Rollback plan required for destructive schema changes

### Design System Adherence
- UI components MUST follow design_guidelines.md specifications
- Color palette, typography, spacing, and component standards are mandatory
- Design deviations require explicit justification and documentation update

## Governance

### Constitution Authority
This constitution supersedes all other development practices and guidelines. In cases of conflict between this document and other artifacts (README, documentation.md, design_guidelines.md), this constitution takes precedence for governance matters. Other documents provide implementation guidance within constitutional constraints.

### Amendment Process
- Update constitution as needed for rapid POC development
- No formal versioning required - just edit and commit
- Note major changes in commit messages for context
- Update dependent templates if changes affect them significantly

### Lightweight Review Process
- Feature specs can skip Constitution Check if feature is straightforward
- Implementation plans should note any major architectural changes, but detailed justification is optional
- Code reviews are optional - self-review by building and manually testing is sufficient
- Complexity is acceptable if it enables faster development or more interesting demos

### Keep It Simple (When Convenient)
- Prefer simple solutions over complex architectures when effort is similar
- Don't add abstraction layers or patterns "for future scalability"
- Use libraries and frameworks that speed up development
- Copy existing patterns from the codebase instead of inventing new ones
- Document complex parts only if you'll forget how they work later

### Evolution & Learning
This constitution is a living document reflecting project needs:
- Update principles based on what works in practice
- Adjust guidelines as the POC evolves
- Keep it practical and relevant to current development
- No formal review cycles - just iterate as needed

**Last Updated**: 2025-10-08
