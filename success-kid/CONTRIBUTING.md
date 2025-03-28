# Contributing to Success Kid Community Platform

Thank you for your interest in contributing to the Success Kid Community Platform! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

- Before submitting a bug report, check if the issue has already been reported
- Use the bug report template when creating an issue
- Include detailed steps to reproduce the bug
- Provide specific examples if possible
- Include any relevant screenshots or logs

### Suggesting Enhancements

- Use the feature request template when creating an issue
- Clearly describe the feature and its value
- Include any design ideas or implementation thoughts
- Link to examples of similar features in other projects if relevant

### Pull Requests

1. Fork the repository
2. Create a new branch from `develop`
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Run tests locally
   ```bash
   pnpm test
   ```
5. Ensure your code adheres to the linting standards
   ```bash
   pnpm lint
   ```
6. Commit your changes using [conventional commits](https://www.conventionalcommits.org/)
   ```bash
   git commit -m "feat: add new feature"
   ```
7. Push your branch to your fork
   ```bash
   git push origin feature/your-feature-name
   ```
8. Create a pull request against the `develop` branch

## Development Workflow

### Setting Up Your Development Environment

Follow the instructions in the [README.md](./README.md) to set up your development environment.

### Understanding the Project Structure

The project uses a monorepo structure. See the [Monorepo Guide](./docs/monorepo-guide.md) for more details.

### Coding Standards

- Follow the TypeScript style guide in the codebase
- Write self-documenting code with meaningful variable and function names
- Add comments for complex logic
- Write tests for all new features and bug fixes
- Ensure accessibility for all UI components
- Follow the [conventional commits](https://www.conventionalcommits.org/) specification for commit messages

### Testing

See the [Testing Strategy](./docs/testing-strategy.md) for details on our testing approach.

### Documentation

- Update documentation for any changes you make
- Document new features or changes to existing features
- Keep code examples in documentation up-to-date
- Document APIs using OpenAPI/Swagger annotations

## Pull Request Process

1. Update the README.md or documentation with details of changes if appropriate
2. Update the CHANGELOG.md with details of changes
3. The version numbers are updated automatically using semantic release
4. Your PR will be reviewed by at least one maintainer
5. Once approved, your PR will be merged by a maintainer

## Git Branching Strategy

We use a simplified Git Flow approach:

- `main` - Production-ready code that has been released
- `develop` - Integration branch for new features
- `feature/*` - Feature branches for new development
- `fix/*` - Bugfix branches
- `release/*` - Release preparation branches
- `hotfix/*` - Hotfix branches for critical production issues

## Release Process

1. Changes accumulate in the `develop` branch
2. When ready for release, a release branch is created
3. Testing and final adjustments are performed on the release branch
4. The release branch is merged to `main` and tagged with a version number
5. `main` is then merged back to `develop`

## Questions?

If you have any questions about contributing, please reach out to the project maintainers or open an issue with your question.

Thank you for contributing to the Success Kid Community Platform!
