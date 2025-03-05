# Contributing to Success Kid Community Platform

Thank you for considering contributing to the Success Kid Community Platform! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Exercise consideration and empathy
- Focus on the community's best interest
- Be collaborative and constructive
- Gracefully accept constructive feedback

## How Can I Contribute?

### Reporting Bugs

Before submitting a bug report:
1. Check the issue tracker to see if the bug has already been reported
2. Ensure you're using the latest version
3. Determine which repository the problem belongs to

When submitting a bug report, include:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (OS, browser, etc.)

### Suggesting Features

Feature suggestions are tracked as GitHub issues. When submitting a feature request:
1. Use a clear, descriptive title
2. Provide a detailed description of the proposed functionality
3. Explain why this feature would be useful for most users

### Pull Requests

1. Fork the repository
2. Create a new branch from `main`
3. Make your changes
4. Run tests and ensure they pass
5. Update documentation if needed
6. Submit a pull request to the `main` branch

### Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters
- Reference issues and pull requests liberally after the first line

Example: `feat: add wallet authentication system (#42)`

### Branch Naming

Use the following format for branch names:
- `feature/short-description` - For new features
- `fix/short-description` - For bug fixes
- `docs/short-description` - For documentation updates
- `refactor/short-description` - For code refactoring

## Development Setup

Please refer to the [README.md](../README.md) for detailed development setup instructions.

## Project Structure

Please familiarize yourself with our monorepo structure as described in the main README.

## Testing

- Write tests for new code contributions
- Run `npm run test` before submitting a PR

## Style Guides

### TypeScript

We use ESLint with our custom configuration. Run `npm run lint` to check your code.

### CSS/Tailwind

- Follow the design system's color palette and spacing
- Use descriptive class names
- Leverage Tailwind's utility classes when possible

## License

By contributing to Success Kid Community Platform, you agree that your contributions will be licensed under the project's [MIT License](../LICENSE).