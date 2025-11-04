# Contributing to zkVerify

Thank you for your interest in contributing to zkVerify. This document provides guidelines for contributing to the project.

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/zkverify.git`
3. Install dependencies: `npm run install:all`
4. Copy `.env.example` to `.env` and configure your environment variables
5. Run tests: `npm test`

## Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions or updates

## Commit Format

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat(verifier): add on-chain proof verification

Implements ZKVerifier contract with EIP-191 signature validation
for proof attestations before anchoring to ProofVerifier.
```

## Issue Reporting

When reporting issues, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce the behavior
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: 
   - Node.js version
   - Operating system
   - Network (testnet/mainnet)
6. **Screenshots**: If applicable

## Code Standards

- Follow existing code style and formatting
- Add comments for complex logic
- Write tests for new features
- Ensure all tests pass before submitting PR
- Update documentation as needed

## Pull Request Process

1. Ensure your branch is up to date with `main`
2. Write clear commit messages
3. Ensure all tests pass
4. Update documentation if needed
5. Submit PR with clear description of changes

## Security

If you discover a security vulnerability, please email security@zkverify.io instead of using the public issue tracker.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.


