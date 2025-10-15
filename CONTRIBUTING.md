# Contributing to Personal Expense Tracker

Thank you for considering contributing to the Personal Expense Tracker! 🎉

## 📋 Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🏗️ Project Structure

```
personal-expense-tracker/
├── src/                    # Frontend React code
│   ├── components/         # Reusable components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   └── contexts/          # React contexts
├── netlify/functions/     # Serverless backend functions
├── database/              # Database schema and migrations
└── public/                # Static assets
```

## 🛠️ Development Setup

1. Clone the repository:
```bash
git clone https://github.com/jamesdunnington/personal-expense-tracker.git
cd personal-expense-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your Neon database credentials
```

4. Run the development server:
```bash
npm run dev
```

## ✅ Code Standards

- Use ES6+ syntax
- Follow React best practices
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes before submitting

## 🧪 Testing

Before submitting a PR, please ensure:
- [ ] The app builds without errors (`npm run build`)
- [ ] All features work as expected
- [ ] Mobile responsiveness is maintained
- [ ] Dark mode works correctly
- [ ] No console errors

## 📝 Commit Message Guidelines

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests when relevant

Examples:
```
feat: Add recurring transactions support
fix: Resolve dark mode contrast issue in Settings
docs: Update installation instructions
style: Format code with Prettier
```

## 🎯 Feature Implementation Phases

Check the [PRD.md](PRD.md) for detailed feature roadmap:
- **Phase 1 (MVP)**: ✅ Complete
- **Phase 2**: CSV Import, Recurring Transactions, Budgets
- **Phase 3**: AI Integration

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details (device, browser, OS)

## 💬 Questions?

Feel free to open an issue for any questions or discussions about the project!

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.
