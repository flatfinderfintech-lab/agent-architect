# CLAUDE.md - AI Assistant Guide for agent-architect

This document provides comprehensive guidance for AI assistants working on the agent-architect codebase.

## Project Overview

**Project Name:** agent-architect
**Language:** Python
**Status:** Initial setup / Early development
**Purpose:** AI agent development and architecture framework

This is a Python-based project focused on agent architecture and development. The repository is currently in its initial setup phase with foundational structure in place.

## Repository Structure

```
agent-architect/
├── .gitignore          # Python-focused gitignore with comprehensive exclusions
├── README.md           # Project documentation (minimal currently)
└── CLAUDE.md          # This file - AI assistant guide
```

### Expected Future Structure

As the project develops, expect the following typical Python project structure:

```
agent-architect/
├── src/               # Source code directory
│   └── agent_architect/  # Main package
├── tests/             # Test files
├── docs/              # Documentation
├── examples/          # Example implementations
├── requirements.txt   # Python dependencies (or pyproject.toml)
├── setup.py          # Package setup (or pyproject.toml)
└── .venv/            # Virtual environment (gitignored)
```

## Development Environment

### Python Version
- The project uses Python 3.x (specific version TBD)
- Check for `.python-version` or `pyproject.toml` for specific version requirements

### Dependency Management
The project may use one of the following (check for presence):
- **pip** - `requirements.txt` or `requirements-dev.txt`
- **poetry** - `pyproject.toml` + `poetry.lock`
- **pipenv** - `Pipfile` + `Pipfile.lock`
- **uv** - Modern Python package manager
- **pdm** - Python Development Master

### Virtual Environment Setup
```bash
# Using venv
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Using poetry
poetry install
poetry shell

# Using pipenv
pipenv install
pipenv shell
```

## Development Workflows

### Initial Setup
1. Clone the repository
2. Create and activate a virtual environment
3. Install dependencies (when requirements file exists)
4. Run tests to verify setup (when tests exist)

### Making Changes
1. **Always** work on the designated feature branch
2. **Never** push directly to main/master branch
3. Create descriptive commit messages
4. Test changes before committing

### Testing
When tests are added, use:
```bash
# pytest (most common)
pytest

# With coverage
pytest --cov=agent_architect --cov-report=html

# Run specific test file
pytest tests/test_specific.py

# Run with verbose output
pytest -v
```

### Code Quality
Expected tools (check for configuration files):
- **ruff** - Fast Python linter and formatter (`.ruff_cache/` in gitignore)
- **black** - Code formatter
- **mypy** - Type checking
- **pylint** or **flake8** - Linting

### Git Workflow
```bash
# Current branch: claude/claude-md-miq8h9fp3bxsej1c-01EnnmFpDQxuALTS7ya7decD

# Check status
git status

# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature"

# Push to feature branch
git push -u origin claude/claude-md-miq8h9fp3bxsej1c-01EnnmFpDQxuALTS7ya7decD
```

## Code Conventions

### File Naming
- **Modules:** Use lowercase with underscores (`my_module.py`)
- **Classes:** Use PascalCase (`MyClass`)
- **Functions/Variables:** Use lowercase with underscores (`my_function`, `my_variable`)
- **Constants:** Use UPPERCASE with underscores (`MY_CONSTANT`)

### Code Style
- Follow PEP 8 guidelines
- Use type hints where appropriate
- Write docstrings for public functions and classes (Google or NumPy style)
- Keep functions focused and single-purpose
- Avoid overly complex nested logic

### Documentation
- Use clear, descriptive docstrings
- Include type annotations for function parameters and returns
- Document complex algorithms or business logic
- Keep README.md updated with project changes

### Testing
- Write tests for new features
- Aim for high test coverage (>80%)
- Use descriptive test names: `test_<function>_<scenario>_<expected_result>`
- Follow AAA pattern: Arrange, Act, Assert

## Key Directories (When Created)

### `/src/agent_architect/`
Main application code. Organize by feature or component:
- `core/` - Core functionality
- `agents/` - Agent implementations
- `utils/` - Utility functions
- `models/` - Data models
- `config/` - Configuration management

### `/tests/`
Test files mirroring the src structure:
- Use `test_` prefix for test files
- Mirror directory structure of src/
- Include fixtures in `conftest.py`

### `/docs/`
Documentation files:
- API documentation
- Architecture diagrams
- User guides
- Development guides

### `/examples/`
Example usage and demonstrations:
- Simple use cases
- Complex workflows
- Integration examples

## Common Tasks for AI Assistants

### Adding a New Feature
1. Create or modify files in `src/agent_architect/`
2. Add corresponding tests in `tests/`
3. Update documentation if needed
4. Run tests to ensure nothing breaks
5. Commit with descriptive message

### Fixing a Bug
1. Identify the bug location
2. Write a failing test that reproduces the bug
3. Fix the bug
4. Verify the test passes
5. Check for similar issues in codebase
6. Commit with "fix:" prefix

### Refactoring
1. Ensure tests exist and pass
2. Make incremental changes
3. Run tests after each change
4. Keep commits small and focused
5. Update documentation if interfaces change

### Adding Tests
1. Mirror the source file structure
2. Test both happy paths and edge cases
3. Use fixtures for common setup
4. Mock external dependencies
5. Aim for clear, maintainable test code

## Important Notes for AI Assistants

### Security Considerations
- Never commit secrets, API keys, or credentials
- The `.env` file is gitignored - use for local secrets
- Review `.gitignore` before committing sensitive data
- Be cautious with user input - validate and sanitize

### Performance
- Profile before optimizing
- Use appropriate data structures
- Consider async/await for I/O operations
- Cache expensive computations when appropriate

### Dependencies
- Minimize external dependencies
- Prefer standard library when possible
- Pin versions in requirements files
- Document why dependencies are needed

### Error Handling
- Use specific exceptions over generic ones
- Provide helpful error messages
- Log errors appropriately
- Fail fast for unrecoverable errors
- Handle expected errors gracefully

### Git Operations
- **ALWAYS** push to branches starting with `claude/` and ending with session ID
- Use exponential backoff for network retries (2s, 4s, 8s, 16s)
- Never force push to main/master
- Keep commits atomic and focused

## Project-Specific Patterns

As patterns emerge in the codebase, document them here:

### Agent Pattern
(To be documented when implemented)

### Configuration Management
(To be documented when implemented)

### Error Handling Strategy
(To be documented when implemented)

### Logging Strategy
(To be documented when implemented)

## Troubleshooting

### Common Issues
(To be documented as issues arise)

### Dependencies Not Installing
1. Check Python version compatibility
2. Verify virtual environment is activated
3. Try upgrading pip: `pip install --upgrade pip`
4. Check for platform-specific issues

### Tests Failing
1. Ensure dependencies are installed
2. Check for missing test fixtures
3. Verify environment variables are set
4. Review recent changes for breaking modifications

## Resources

### Documentation
- Project README: `/README.md`
- Python Docs: https://docs.python.org/3/

### Tools
- pytest: https://docs.pytest.org/
- ruff: https://docs.astral.sh/ruff/
- mypy: https://mypy.readthedocs.io/

## Changelog

### 2025-12-03
- Initial CLAUDE.md created
- Repository structure documented
- Development workflows established
- Code conventions defined

---

**Last Updated:** 2025-12-03
**Maintained By:** AI Assistants working on this project

This document should be updated as the project evolves and new patterns emerge.
