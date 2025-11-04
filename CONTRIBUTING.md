# Contributing to Webhoxy

First off, thank you for considering contributing to Webhoxy! It's people like you that make Webhoxy such a great tool.

## 🌟 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

**Bug Report Template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
 - OS: [e.g., Windows, macOS, Linux]
 - Node Version: [e.g., 20.10.0]
 - Docker Version: [e.g., 24.0.0]
 - Browser: [e.g., Chrome, Firefox]

**Additional context**
Any other context about the problem.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to most Webhoxy users
- **List any alternatives** you've considered

### Pull Requests

Follow these steps to submit a pull request:

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Write a clear commit message**
6. **Submit the pull request**

---

## 💻 Development Setup

### Prerequisites

- Node.js 20+ and npm 10+
- Git
- Docker (optional, for testing containerization)

### Setting Up Local Environment

1. **Clone your fork:**

```bash
git clone https://github.com/YOUR_USERNAME/webhoxy.git
cd webhoxy
```

2. **Install dependencies:**

```bash
# Install API dependencies
cd api
npm install

# Install Web dependencies
cd ../web
npm install
```

3. **Set up environment variables:**

```bash
# API
cd api
cp env.example .env

# Edit .env with your local settings
```

4. **Start development servers:**

```bash
# Terminal 1 - API
cd api
npm run dev

# Terminal 2 - Web
cd web
npm run dev
```

5. **Access the application:**
   - Web UI: http://localhost:5173
   - API: http://localhost:8080

---

## 📝 Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
feat(api): add webhook signature verification
fix(web): resolve cursor jumping in JSON editor
docs(readme): update installation instructions
```

---

## 🧪 Testing

### Running Tests

```bash
# API tests
cd api
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Writing Tests

- Write tests for all new features
- Maintain or improve code coverage
- Use descriptive test names
- Follow existing test patterns

**Example Test:**

```typescript
import { describe, it, expect } from 'vitest';
import { extractFields } from './field-extractor';

describe('extractFields', () => {
  it('should extract nested object fields', () => {
    const data = { user: { name: 'John', email: 'john@example.com' } };
    const fields = extractFields(data);
    
    expect(fields).toContainEqual({
      path: 'user.name',
      type: 'string',
      sample: 'John'
    });
  });
});
```

---

## 📦 Project Structure

### Backend (API)

```
api/
├── src/
│   ├── config/           # Configuration
│   ├── db/               # Database & migrations
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   └── utils/            # Utility functions
├── data/                 # SQLite database
└── tests/                # Test files
```

### Frontend (Web)

```
web/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/            # Page components
│   ├── lib/              # API client & utilities
│   └── templates/        # Webhook templates
└── public/               # Static assets
```

---

## 🏗️ Development Guidelines

### Adding a New Feature

1. **Create an issue** describing the feature
2. **Discuss the approach** in the issue comments
3. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Implement the feature** with tests
5. **Update documentation**
6. **Submit a pull request**

### Adding a New API Endpoint

1. **Define the route** in `api/src/routes/`
2. **Add Zod schema** for request validation
3. **Implement business logic** in `api/src/services/` if complex
4. **Add tests** for the endpoint
5. **Update API documentation** in README

### Adding a New UI Component

1. **Create component** in `web/src/components/`
2. **Use TypeScript** for props and types
3. **Follow existing component patterns**
4. **Use Tailwind CSS** for styling
5. **Make it responsive**
6. **Add to appropriate page**

---

## 🔍 Code Review Process

All submissions require review. We use GitHub pull requests for this purpose.

### Review Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass and coverage is maintained
- [ ] Documentation is updated
- [ ] Commit messages follow conventions
- [ ] No unnecessary dependencies added
- [ ] Security considerations addressed
- [ ] Performance implications considered

---

## 📚 Documentation

When adding features:

1. **Update README.md** with user-facing changes
2. **Update API documentation** for new endpoints
3. **Add code comments** for complex logic
4. **Update CHANGELOG.md** (if exists)

---

## 🐛 Debugging Tips

### API Debugging

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Check database
sqlite3 api/data/webhoxy.db
.tables
SELECT * FROM webhooks;
```

### Web Debugging

- Use browser DevTools
- Check Network tab for API calls
- Use Solid DevTools extension
- Check console for errors

---

## 🔐 Security

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities. Instead:

1. Email security concerns to: [your-email@example.com]
2. Include detailed description
3. Wait for response before public disclosure

### Security Best Practices

- Validate all user input
- Use parameterized queries
- Sanitize output
- Follow OWASP guidelines
- Keep dependencies updated

---

## 📋 Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests
```

---

## 🎯 Areas for Contribution

### Good First Issues

- Documentation improvements
- UI/UX enhancements
- Bug fixes
- Test coverage improvements
- Performance optimizations

### Advanced Contributions

- Webhook signature verification
- Retry logic with backoff
- Rate limiting
- Multi-user authentication
- WebSocket support
- Database migrations

---

## 💬 Getting Help

- **Discord/Slack**: [Join our community]
- **GitHub Discussions**: Ask questions
- **Documentation**: Check existing docs
- **Issues**: Search for similar problems

---

## 🎉 Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Acknowledged in release notes
- Mentioned in relevant documentation

---

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

**Positive behavior:**
- Using welcoming language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable behavior:**
- Trolling, insulting comments, personal attacks
- Public or private harassment
- Publishing others' private information
- Other unethical or unprofessional conduct

### Enforcement

Violations may result in:
1. Warning
2. Temporary ban
3. Permanent ban

Report issues to: [your-email@example.com]

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 Thank You!

Your contributions make Webhoxy better for everyone. We appreciate your time and effort!

---

**Questions?** Open an issue or reach out to the maintainers.

**Happy Coding!** 🚀

