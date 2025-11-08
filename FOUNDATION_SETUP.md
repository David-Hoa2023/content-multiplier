# Content Multiplier - Foundation Setup Guide

**Goal**: Establish a rock-solid development foundation before implementing Phase 1

**Timeline**: 1-2 weeks

---

## Why Foundation First?

Before diving into Phase 1 (Publishing & Distribution), you need:
- ✅ Consistent development environment across all developers
- ✅ Automated testing to catch bugs early
- ✅ CI/CD pipeline for rapid deployment
- ✅ Code quality standards
- ✅ Easy onboarding for new developers

**ROI**: Every hour spent on foundation saves 10+ hours in debugging, deployment issues, and onboarding later.

---

## Step 1: Enhanced Docker Development Environment (2 days)

### Current State
You have a basic `docker-compose.yml` for PostgreSQL + pgvector.

### What to Build

**File: `infra/docker-compose.dev.yml`**
```yaml
version: '3.8'

services:
  postgres:
    image: ankane/pgvector:latest
    container_name: cm-postgres
    environment:
      POSTGRES_DB: cm
      POSTGRES_USER: cm
      POSTGRES_PASSWORD: cm
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-BASH", "pg_isready -U cm"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: cm-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile.dev
    container_name: cm-api
    volumes:
      - ./apps/api:/app/apps/api
      - ./packages:/app/packages
      - /app/node_modules
      - /app/apps/api/node_modules
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://cm:cm@postgres:5432/cm
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: pnpm dev

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile.dev
    container_name: cm-web
    volumes:
      - ./apps/web:/app/apps/web
      - ./packages:/app/packages
      - /app/node_modules
      - /app/apps/web/node_modules
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE=http://localhost:3001
    depends_on:
      - api
    command: pnpm dev

volumes:
  postgres_data:
  redis_data:
```

**File: `apps/api/Dockerfile.dev`**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

EXPOSE 3001

CMD ["pnpm", "--filter", "@cm/api", "dev"]
```

**File: `Makefile`** (for easy commands)
```makefile
.PHONY: dev stop clean seed test build

dev:
	docker-compose -f infra/docker-compose.dev.yml up --build

stop:
	docker-compose -f infra/docker-compose.dev.yml down

clean:
	docker-compose -f infra/docker-compose.dev.yml down -v
	rm -rf node_modules apps/*/node_modules packages/*/node_modules

seed:
	docker-compose -f infra/docker-compose.dev.yml exec api pnpm run seed

test:
	docker-compose -f infra/docker-compose.dev.yml exec api pnpm test

migrate:
	docker-compose -f infra/docker-compose.dev.yml exec api pnpm run migrate

lint:
	pnpm run lint

format:
	pnpm run format
```

**Usage**:
```bash
make dev      # Start everything
make stop     # Stop all services
make clean    # Clean everything (nuclear option)
make seed     # Seed database with test data
make test     # Run tests
make migrate  # Run database migrations
```

---

## Step 2: Database Migration System (1 day)

### Current State
You have SQL files in `infra/migrations/` but no automated migration runner.

### What to Build

**File: `apps/api/src/db/migrator.ts`**
```typescript
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export class Migrator {
  constructor(private pool: Pool) {}

  async runMigrations() {
    // Create migrations table if not exists
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get applied migrations
    const { rows } = await this.pool.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    const applied = new Set(rows.map(r => r.version));

    // Get migration files
    const migrationsDir = path.join(__dirname, '../../../infra/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    // Run pending migrations
    for (const file of files) {
      const version = file.replace('.sql', '');

      if (applied.has(version)) {
        console.log(`✓ Migration ${version} already applied`);
        continue;
      }

      console.log(`⏳ Running migration ${version}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      try {
        await this.pool.query('BEGIN');
        await this.pool.query(sql);
        await this.pool.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version]
        );
        await this.pool.query('COMMIT');
        console.log(`✅ Migration ${version} applied successfully`);
      } catch (error) {
        await this.pool.query('ROLLBACK');
        console.error(`❌ Migration ${version} failed:`, error);
        throw error;
      }
    }
  }
}
```

**File: `apps/api/src/scripts/migrate.ts`**
```typescript
import { pool } from '../db';
import { Migrator } from '../db/migrator';

async function main() {
  const migrator = new Migrator(pool);
  await migrator.runMigrations();
  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
```

**Add to `apps/api/package.json`**:
```json
{
  "scripts": {
    "migrate": "tsx src/scripts/migrate.ts",
    "migrate:create": "tsx src/scripts/create-migration.ts"
  }
}
```

---

## Step 3: Database Seed Data (1 day)

### What to Build

**File: `apps/api/src/scripts/seed.ts`**
```typescript
import { pool, query } from '../db';

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data (dev only!)
  if (process.env.NODE_ENV !== 'production') {
    await query('TRUNCATE ideas, briefs, content_packs, documents, doc_chunks, events RESTART IDENTITY CASCADE');
  }

  // Seed sample ideas
  const ideas = [
    {
      idea_id: 'idea-001',
      one_liner: 'How AI is Transforming Content Marketing in 2025',
      angle: 'Practical guide with real-world examples',
      personas: ['marketing-manager', 'content-creator'],
      why_now: ['AI adoption is accelerating', 'New tools launching monthly'],
      evidence: [
        { title: 'McKinsey AI Report 2024', url: 'https://example.com/report', quote: 'AI adoption in marketing up 300%' }
      ],
      scores: { novelty: 4, demand: 5, fit: 5, white_space: 3 },
      status: 'selected'
    },
    {
      idea_id: 'idea-002',
      one_liner: '10 Content Distribution Mistakes That Are Killing Your ROI',
      angle: 'Common mistakes with actionable fixes',
      personas: ['marketing-ops', 'growth-marketer'],
      why_now: ['Distribution is becoming more important than creation'],
      evidence: [],
      scores: { novelty: 3, demand: 5, fit: 4, white_space: 2 },
      status: 'proposed'
    },
    // Add more sample ideas...
  ];

  for (const idea of ideas) {
    await query(
      `INSERT INTO ideas (idea_id, one_liner, angle, personas, why_now, evidence, scores, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        idea.idea_id,
        idea.one_liner,
        idea.angle,
        idea.personas,
        idea.why_now,
        JSON.stringify(idea.evidence),
        JSON.stringify(idea.scores),
        idea.status
      ]
    );
  }

  // Seed sample briefs
  const briefs = [
    {
      brief_id: 'brief-001',
      idea_id: 'idea-001',
      key_points: [
        'AI tools are now accessible to small teams',
        'Content quality and speed both improve with AI',
        'Human oversight is still critical'
      ],
      counterpoints: [
        'Some worry AI content lacks authenticity',
        'Not all AI tools produce quality output'
      ],
      outline: [
        { h2: 'Introduction: The AI Revolution', bullets: ['Current state', 'Why now', 'What to expect'] },
        { h2: 'Top AI Tools for Content Marketing', bullets: ['Writing assistants', 'Image generation', 'Video creation'] },
        { h2: 'Best Practices', bullets: ['Human + AI collaboration', 'Quality control', 'Brand voice'] },
        { h2: 'Conclusion', bullets: ['Key takeaways', 'Next steps'] }
      ],
      claims_ledger: [
        { claim: 'AI adoption in marketing up 300%', sources: [{ url: 'https://example.com/report' }], confidence: 'high' }
      ]
    }
  ];

  for (const brief of briefs) {
    await query(
      `INSERT INTO briefs (brief_id, idea_id, key_points, counterpoints, outline, claims_ledger)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        brief.brief_id,
        brief.idea_id,
        JSON.stringify(brief.key_points),
        JSON.stringify(brief.counterpoints),
        JSON.stringify(brief.outline),
        JSON.stringify(brief.claims_ledger)
      ]
    );
  }

  console.log('✅ Database seeded successfully!');
  console.log(`   - ${ideas.length} ideas`);
  console.log(`   - ${briefs.length} briefs`);
}

seed()
  .then(() => pool.end())
  .catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
```

**Add to package.json**:
```json
{
  "scripts": {
    "seed": "tsx src/scripts/seed.ts"
  }
}
```

---

## Step 4: CI/CD Pipeline with GitHub Actions (1 day)

**File: `.github/workflows/ci.yml`**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: ankane/pgvector:latest
        env:
          POSTGRES_USER: cm
          POSTGRES_PASSWORD: cm
          POSTGRES_DB: cm_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 3s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm run lint

      - name: Type check
        run: pnpm run type-check

      - name: Run migrations
        env:
          DATABASE_URL: postgres://cm:cm@localhost:5432/cm_test
        run: pnpm --filter @cm/api run migrate

      - name: Run tests
        env:
          DATABASE_URL: postgres://cm:cm@localhost:5432/cm_test
          REDIS_URL: redis://localhost:6379
          NODE_ENV: test
        run: pnpm run test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm run build

      - name: Build Docker images
        run: |
          docker build -f apps/api/Dockerfile -t cm-api:${{ github.sha }} .
          docker build -f apps/web/Dockerfile -t cm-web:${{ github.sha }} .
```

**File: `.github/workflows/deploy.yml`**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      # Add deployment steps here (AWS, Vercel, Railway, etc.)
      # This depends on your hosting choice
```

---

## Step 5: Testing Infrastructure (1 day)

### Current State
Minimal or no tests.

### What to Build

**File: `apps/api/jest.config.js`**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

**File: `apps/api/src/__tests__/setup.ts`** (test setup)
```typescript
import { pool } from '../db';

beforeAll(async () => {
  // Run migrations
  const { Migrator } = await import('../db/migrator');
  const migrator = new Migrator(pool);
  await migrator.runMigrations();
});

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  // Clean database between tests
  await pool.query('TRUNCATE ideas, briefs, content_packs RESTART IDENTITY CASCADE');
});
```

**File: `apps/api/src/__tests__/ideas.test.ts`** (example test)
```typescript
import { describe, test, expect } from '@jest/globals';
import { query } from '../db';

describe('Ideas', () => {
  test('should create an idea', async () => {
    const result = await query(
      `INSERT INTO ideas (idea_id, one_liner, angle, personas, why_now, evidence, scores, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        'test-idea',
        'Test Idea',
        'Test angle',
        ['persona1'],
        ['reason1'],
        JSON.stringify([]),
        JSON.stringify({ novelty: 5, demand: 4, fit: 5, white_space: 3 }),
        'proposed'
      ]
    );

    expect(result.rows[0].idea_id).toBe('test-idea');
  });
});
```

---

## Step 6: Code Quality Standards (1 day)

**File: `.eslintrc.js`**
```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }]
  }
};
```

**File: `.prettierrc.js`**
```javascript
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  arrowParens: 'avoid'
};
```

**File: `.husky/pre-commit`** (Git hook)
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm run lint
pnpm run type-check
```

**Setup Husky**:
```bash
pnpm add -D husky lint-staged
npx husky install
npx husky add .husky/pre-commit "pnpm run lint-staged"
```

**File: `package.json`** (add to root)
```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## Step 7: Comprehensive Documentation (1 day)

**Update: `README.md`**
```markdown
# Content Multiplier

AI-powered content creation and distribution platform.

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- pnpm

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/content-multiplier.git
cd content-multiplier
```

2. Copy environment variables
```bash
cp .env.example .env
```

3. Add your API keys to `.env`:
```bash
OPENAI_API_KEY=sk-xxx
```

4. Start the development environment
```bash
make dev
```

5. Run migrations
```bash
make migrate
```

6. Seed the database
```bash
make seed
```

7. Open http://localhost:3000

That's it! 🎉

## Development

### Running Tests
```bash
make test
```

### Code Quality
```bash
pnpm run lint        # Check linting
pnpm run format      # Format code
pnpm run type-check  # TypeScript check
```

### Database
```bash
make migrate         # Run migrations
make seed           # Seed data
```

### Stopping
```bash
make stop           # Stop all services
make clean          # Nuclear option - delete everything
```

## Project Structure
```
content-multiplier/
├── apps/
│   ├── api/         # Fastify backend
│   └── web/         # Next.js frontend
├── packages/
│   ├── schemas/     # JSON schemas
│   ├── types/       # Shared TypeScript types
│   └── utils/       # Shared utilities
├── infra/
│   ├── migrations/  # Database migrations
│   └── docker-compose.dev.yml
└── docs/            # Documentation
```

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License
MIT
```

**File: `CONTRIBUTING.md`**
```markdown
# Contributing to Content Multiplier

## Development Workflow

1. Create a feature branch
```bash
git checkout -b feature/your-feature
```

2. Make your changes

3. Run tests and linting
```bash
pnpm run lint
pnpm run type-check
pnpm run test
```

4. Commit your changes
```bash
git commit -m "feat: add amazing feature"
```

5. Push and create a pull request
```bash
git push origin feature/your-feature
```

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Code Standards

- Write tests for new features
- Maintain > 70% code coverage
- Follow TypeScript best practices
- Use meaningful variable names
- Add comments for complex logic

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Request review from maintainers
5. Address review feedback
6. Merge after approval
```

---

## Step 8: Environment Configuration (Half day)

**File: `.env.example`**
```bash
# Database
DATABASE_URL=postgres://cm:cm@localhost:5432/cm

# Redis
REDIS_URL=redis://localhost:6379

# API
PORT=3001
NODE_ENV=development

# LLM API Keys (at least one required)
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
GROK_API_KEY=

# Default Models
LLM_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small

# Frontend
NEXT_PUBLIC_API_BASE=http://localhost:3001

# Optional: RAG Configuration
RAG_SIMILARITY_THRESHOLD=0.7
RAG_TOP_K=8

# Optional: Telemetry
DEBUG=false
LOG_LEVEL=info
```

**File: `apps/api/src/env.ts`** (environment validation)
```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  LLM_MODEL: z.string().default('gpt-4o-mini'),
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
});

export const env = envSchema.parse(process.env);
```

---

## Success Checklist

After completing the foundation setup, you should be able to:

- [ ] Run `make dev` and have everything start in < 30 seconds
- [ ] Run `make seed` and have sample data in database
- [ ] Run `make test` and have all tests pass
- [ ] Push code and have CI automatically run tests
- [ ] Onboard a new developer in < 15 minutes
- [ ] Make a code change and see it hot-reload
- [ ] Have consistent code formatting across team
- [ ] Know database schema is in sync via migrations
- [ ] Debug issues with proper logging
- [ ] Deploy to production with confidence

---

## Timeline Summary

| Day | Task | Hours |
|-----|------|-------|
| 1 | Docker Compose setup | 8 |
| 2 | Migration system + seed data | 8 |
| 3 | CI/CD pipeline setup | 6 |
| 4 | Testing infrastructure | 8 |
| 5 | Code quality standards | 6 |
| 6 | Documentation | 6 |
| 7 | Buffer for issues | 4 |

**Total: ~46 hours (1-1.5 weeks with 1-2 developers)**

---

## What Comes After?

Once foundation is solid, you can start **Phase 1: Publishing & Distribution** with confidence, knowing:

1. **Tests catch bugs** before they reach production
2. **CI/CD deploys** automatically when you push
3. **New developers** can onboard in minutes
4. **Code quality** is enforced automatically
5. **Database** is always in a known state

---

## Priority Order

If time is limited, do in this order:

1. **Critical**: Docker Compose + Migration system (Days 1-2)
2. **Very Important**: CI/CD + Testing (Days 3-4)
3. **Important**: Code quality + Documentation (Days 5-6)

**Minimum viable foundation**: Days 1-2 (Docker + Migrations)
**Production-ready foundation**: All 6 days

---

## Need Help?

- Check existing issues on GitHub
- Review the documentation in `/docs`
- Join our Discord community (coming soon)
- Email support@contentmultiplier.com

---

**Next Step**: Once foundation is complete → Start [PHASE1_BREAKDOWN.md](./PHASE1_BREAKDOWN.md)
