# Contributing to Feedub

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Python 3.12+
- Node.js 22+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

### Quick Start

```bash
git clone https://github.com/rukawa917/feedub.git
cd feedub

# Backend
cd backend
cp .env.example .env   # Edit with your Telegram API keys
uv sync --extra dev
uv run alembic upgrade head   # Run migrations (SQLite, no Docker needed)
cd ..

# Frontend
cd frontend
cp .env.example .env
npm install
cd ..
```

See [docs/self-hosting.md](./docs/self-hosting.md) for the self-hosting guide.

## Making Changes

### Branch Naming

- `feat/description` — New features
- `fix/description` — Bug fixes
- `refactor/description` — Code improvements
- `docs/description` — Documentation changes

### Code Style

**Backend (Python)**:
- `uv` only — never pip, poetry, or pip install
- 100% async — all DB operations use `async/await`
- Strict layered architecture: `api/ -> services/ -> repositories/ -> models/`
- Ruff for formatting and linting, ty for type checking

**Frontend (TypeScript)**:
- `npm` only — never yarn, pnpm, or bun
- TailwindCSS utility classes only — no CSS modules
- Zustand for client state, TanStack Query for server state
- shadcn/ui for components — no other UI libraries

See [AGENTS.md](./AGENTS.md) for full architecture conventions.

### Quality Gates

All checks must pass before submitting a PR:

```bash
# Backend
cd backend
uv run ruff format .
uv run ruff check . --fix
uv run ty check
uv run pytest tests/unit/ -v

# Frontend
cd frontend
npm run format
npm run lint:fix
npm run type-check
npx vitest run
```

### Testing

We follow TDD — write tests before (or alongside) implementation.

- **Backend**: pytest with `asyncio_mode = "auto"`. No `@pytest.mark.asyncio` needed.
- **Frontend**: Vitest with `@testing-library/react`.
- New features need unit tests. Bug fixes need regression tests.

### Database Changes

After modifying SQLAlchemy models:

```bash
cd backend
uv run alembic revision --autogenerate -m "describe the change"
```

Review the generated migration in `backend/alembic/versions/` before committing.

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with tests
3. Run linting and tests (see Quality Gates above)
4. Push and open a PR against `main`
5. Fill out the PR template — describe what changed and why
6. Wait for review

### PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Include tests for new functionality
- Update documentation if you change public APIs or configuration
- Don't mix refactoring with feature work

## Reporting Issues

- Use GitHub Issues for bugs and feature requests
- Include steps to reproduce for bugs
- Check existing issues before creating a new one

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
