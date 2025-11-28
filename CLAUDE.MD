# CLAUDE.MD

This file provides context and guidelines for Claude when working on the agent-architect project.

## Project Overview

**agent-architect** is a project focused on architecting and building AI agent systems.

## Project Structure

```
agent-architect/
├── README.md           # Project documentation
├── CLAUDE.MD          # This file - guidelines for Claude
└── .gitignore         # Git ignore patterns
```

## Development Guidelines

### Code Style and Conventions

- Follow clean code principles
- Write self-documenting code with clear variable and function names
- Add comments only where the logic isn't self-evident
- Keep functions focused and single-purpose

### Git Workflow

- Work on feature branches with descriptive names
- Write clear, concise commit messages that explain the "why"
- Commits should be atomic and focused on a single change
- Branch naming convention: `claude/<description>-<session-id>`

### Testing

- Write tests for new features and bug fixes
- Ensure all tests pass before committing
- Include both unit tests and integration tests where appropriate

### Documentation

- Keep README.md up to date with project changes
- Document APIs and public interfaces
- Include setup and installation instructions
- Provide examples for key functionality

## Architecture Principles

### Agent Design

- Design agents to be modular and composable
- Implement clear separation of concerns
- Use dependency injection for better testability
- Follow SOLID principles

### Error Handling

- Validate inputs at system boundaries
- Use appropriate error types and messages
- Fail fast and provide clear error context
- Log errors with sufficient detail for debugging

### Performance

- Optimize for readability first, then performance
- Profile before optimizing
- Avoid premature optimization
- Document any performance-critical code

## Key Technologies

*To be updated as the project evolves*

## Common Tasks

### Setup Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd agent-architect

# Install dependencies (when applicable)
# Add specific setup instructions here
```

### Running Tests

```bash
# Add test commands here when test framework is added
```

### Building the Project

```bash
# Add build commands here when build process is established
```

## Code Review Checklist

When reviewing or writing code, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] No security vulnerabilities introduced
- [ ] Error handling is appropriate
- [ ] Documentation is updated
- [ ] No backwards-compatibility hacks
- [ ] No unused code or dead code paths
- [ ] No over-engineering or premature abstractions

## Security Considerations

- Never commit secrets, API keys, or credentials
- Validate and sanitize all external inputs
- Be aware of common vulnerabilities (OWASP Top 10)
- Use secure defaults
- Implement least privilege principles

## Future Enhancements

*Document planned features and improvements here*

## Notes for Claude

- Always read existing code before making modifications
- Use the TodoWrite tool to track multi-step tasks
- Prefer simple, focused solutions over complex ones
- Only make changes that are directly requested
- Avoid adding features beyond what was asked
- Remove unused code completely rather than commenting it out
- Don't add error handling for scenarios that can't happen

## Resources

- [Project Issues](../../issues)
- [Pull Requests](../../pulls)

---

Last updated: 2025-11-28
