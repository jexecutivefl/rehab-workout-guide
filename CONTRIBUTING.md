# Contributing to Universal Starter Template

First off, thank you for considering contributing to Universal Starter Template! It's people like you that make this template a great starting point for Next.js + AWS Amplify projects.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title** for the issue to identify the problem.
- **Describe the exact steps which reproduce the problem** in as many details as possible.
- **Provide specific examples to demonstrate the steps**.
- **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
- **Explain which behavior you expected to see instead and why.**
- **Include screenshots and animated GIFs** if possible.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title** for the issue to identify the suggestion.
- **Provide a step-by-step description of the suggested enhancement** in as many details as possible.
- **Provide specific examples to demonstrate the steps** or provide mockups.
- **Describe the current behavior** and **explain which behavior you expected to see instead** and why.
- **Explain why this enhancement would be useful** to most users.

### Pull Requests

- Fill in the pull request template
- Follow the TypeScript and React coding style
- Include thoughtfully-worded, well-structured tests
- Document new code
- End all files with a newline
- Avoid platform-dependent code

## Development Process

### Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/universal-starter-template.git
cd universal-starter-template
```

2. **Install dependencies**

```bash
npm install
```

3. **Start Amplify sandbox**

```bash
npx ampx sandbox
```

4. **Start development server**

```bash
npm run dev
```

### Making Changes

1. **Create a new branch** from `main`:

```bash
git checkout -b feature/my-new-feature
```

2. **Make your changes** following our coding standards

3. **Write or update tests** as needed

4. **Run the test suite** to ensure everything passes:

```bash
npm test
```

5. **Run linting and formatting**:

```bash
npm run lint
npm run format
```

6. **Commit your changes** using a descriptive commit message:

```bash
git commit -m "Add feature: description of what you added"
```

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `perf:` A code change that improves performance
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools

Examples:

```
feat: add dark mode toggle component
fix: resolve authentication redirect loop
docs: update deployment guide with custom domain setup
```

### Testing

- Write tests for new features and bug fixes
- Ensure all tests pass before submitting a PR
- Aim for high test coverage on critical paths

### Code Style

We use ESLint and Prettier to maintain code quality and consistency:

- Run `npm run lint` to check for issues
- Run `npm run format` to auto-format code
- The pre-commit hook will automatically run these checks

**TypeScript Guidelines:**

- Use TypeScript for all new code
- Leverage type inference when possible
- Avoid `any` - use `unknown` or proper types
- Use `interface` for object shapes, `type` for unions/intersections

**React Guidelines:**

- Use functional components with hooks
- Follow the existing component structure
- Use forwardRef for components that expose DOM refs
- Extract reusable logic into custom hooks

**Component Guidelines:**

- Create reusable UI components in `components/ui/`
- Follow the pattern established by the Button component
- Use the `cn()` utility for className management
- Support dark mode with Tailwind's `dark:` prefix

### Amplify Gen2 Guidelines

Before modifying Amplify backend code, read `/AMPLIFY_GEN2_GUIDELINES.md`. Key points:

- Never chain `.required()` on enums
- Avoid GraphQL reserved names (Subscription, Query, Mutation, Type)
- Convert Amplify's `undefined` to `null` when needed
- Test schema changes locally before pushing

## Pull Request Process

1. **Update documentation** - Update the README.md and other docs with details of changes if needed
2. **Update tests** - Add or update tests to cover your changes
3. **Follow code style** - Ensure your code follows the project's code style
4. **Describe your changes** - Fill out the PR template completely
5. **Link issues** - Reference any related issues in your PR description
6. **Wait for review** - A maintainer will review your PR

### PR Checklist

Before submitting, ensure:

- [ ] Code follows the project's style guidelines
- [ ] Self-review of my own code completed
- [ ] Comments added for hard-to-understand areas
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added that prove the fix/feature works
- [ ] All new and existing tests pass locally
- [ ] Dependent changes have been merged

## Project Structure

```
.
├── app/                      # Next.js App Router pages
├── amplify/                  # AWS Amplify backend (auth, data, etc.)
├── components/               # React components
│   └── ui/                   # Reusable UI components
├── lib/                      # Utility functions and helpers
├── types/                    # TypeScript type definitions
├── docs/                     # Documentation
├── .github/                  # GitHub configuration
│   └── workflows/            # CI/CD workflows
├── CLAUDE.md                 # AI development guidelines
└── AMPLIFY_GEN2_GUIDELINES.md # Amplify-specific rules
```

## Component Development

When creating new UI components:

1. Place in `components/ui/`
2. Export from the component file
3. Use TypeScript with proper prop types
4. Support ref forwarding when applicable
5. Include variants/sizes using the `cn()` utility
6. Support dark mode
7. Follow accessibility best practices

Example component structure:

```typescript
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface MyComponentProps extends HTMLAttributes<HTMLElement> {
  variant?: "default" | "primary";
}

const MyComponent = forwardRef<HTMLElement, MyComponentProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "base-styles",
          variant === "primary" && "primary-styles",
          className
        )}
        {...props}
      />
    );
  }
);

MyComponent.displayName = "MyComponent";

export { MyComponent };
```

## Getting Help

- Check the [documentation](./docs/)
- Review existing [issues](https://github.com/YOUR_USERNAME/universal-starter-template/issues)
- Ask questions in [discussions](https://github.com/YOUR_USERNAME/universal-starter-template/discussions)

## Recognition

Contributors will be recognized in our README.md. Thank you for your contributions!

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.
