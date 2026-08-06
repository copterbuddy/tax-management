# 🏦 Tax Manager — Thai Tax Tracker

> **ระบบคำนวณภาษีสำหรับนักลงทุนรายบุคคล**  
> A modern web application to track, calculate, and manage capital gains tax for foreign stocks and cryptocurrency investments in Thailand.

---

## ✨ Features

### 📊 Core Functionality
- **Trade Recording**: Log buy/sell transactions for foreign stocks and cryptocurrencies
- **FIFO Engine**: Automatic capital gain/loss calculation using First-In-First-Out method
- **Provider Isolation**: Track investments by symbol and provider separately for tax efficiency
- **Dividend Tracking**: Record and calculate tax on dividend income
- **Tax Remittance**: Track tax remittance with THB currency conversion
- **Annual Summary**: Generate year-by-year tax reports

### 🎨 User Experience
- **Responsive Design**: Mobile-friendly interface for on-the-go tracking
- **Dark/Light Theme**: Toggle between theme modes
- **Multi-language Support**: Thai and English language support (i18n)
- **Form Validation**: Built-in validation with helpful error messages
- **Real-time Calculations**: Instant FIFO calculations as you enter data

### ⚙️ Technical Highlights
- **Type-Safe**: Full TypeScript support with strict type checking
- **Performance**: Modern React 19 with Vite for fast development and builds
- **State Management**: Redux Toolkit for predictable state management
- **Form Handling**: React Hook Form with Zod validation
- **Testing**: Jest test suite with coverage tracking

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16.x or higher
- **npm** 7.x or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/copterbuddy/tax-manager.git
   cd tax-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:5173` with hot module reloading (HMR).

### Build for Production

```bash
npm run build
```

Outputs optimized production build to `dist/` folder.

### Preview Production Build

```bash
npm preview
```

---

## 📖 Usage Guide

### 📝 Recording a Trade

1. **Navigate to Trade Tab**
   - Click on "Trade" tab in the main navigation
   - You'll see a form to record buy/sell transactions

2. **Add a Buy Transaction**
   - Select transaction type: **BUY**
   - Enter stock symbol (e.g., `AAPL`, `BTC`)
   - Enter quantity of shares
   - Enter purchase price per unit
   - Select provider (e.g., `Interactive Brokers`, `Kraken`)
   - Click **Add Trade**

3. **Add a Sell Transaction**
   - Select transaction type: **SELL**
   - Enter the same stock symbol
   - Enter quantity to sell
   - Enter sale price per unit
   - The app automatically calculates:
     - Cost basis using FIFO method
     - Capital gain/loss in USD
     - Taxable gain in THB (if remitted)

### 💰 Recording Dividends

1. Navigate to **Dividend Tab**
2. Enter:
   - Stock symbol
   - Dividend amount (USD)
   - Withholding tax (%)
   - Provider
3. Click **Add Dividend**
4. Dividends are automatically added to your tax liability

### 🏦 Tax Remittance

1. Go to **Remit Tab**
2. Enter:
   - Remittance date
   - USD amount remitted to Thailand
   - Exchange rate used (THB/USD)
3. Click **Remit Funds**
4. The system matches remitted funds to your taxable gains (FIFO order)

### 📊 View Tax Summary

- The **Dashboard** tab shows:
  - Total unrealized gains/losses
  - Total realized taxable gains
  - Tax paid this year
  - Remaining tax liability
  - Annual summary by year

---

## 🏗️ Project Structure

```
tax-manager/
├── src/
│   ├── components/          # React components (Forms, Tables, etc.)
│   ├── pages/               # Page components
│   ├── store/               # Redux slices & store configuration
│   ├── types/               # TypeScript type definitions
│   ├── validation/          # Form validation schemas (Zod)
│   ├── i18n/                # Internationalization (Thai, English)
│   ├── engine/              # FIFO calculation engine
│   ├── context/             # React Context (Theme, etc.)
│   ├── App.tsx              # Main app component
│   └── main.tsx             # React entry point
├── docs/
│   ├── specs/               # Feature specifications
│   ├── ux/                  # UI/UX design documents
│   ├── tasks.md             # Development task backlog
│   └── test-cases.md        # QA test cases
├── public/                  # Static assets
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite bundler configuration
└── jest.config.ts           # Jest test configuration
```

---

## 🛠️ Development

### Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build production-ready bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run Oxlint code quality checks |
| `npm run test` | Run Jest test suite |
| `npm run test:coverage` | Generate code coverage report |

### Code Quality

The project uses:
- **Oxlint**: Fast, modern linter with React plugin enabled
- **TypeScript**: Strict type checking (`tsc --noEmit`)
- **Jest**: Unit and integration testing framework

### Type Checking

Before committing, ensure TypeScript passes:

```bash
npx tsc --noEmit
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Generate coverage report
npm run test:coverage
```

---

## 💡 How the Tax Calculation Works

### FIFO Method
The app uses the **First-In-First-Out (FIFO)** method to calculate capital gains:

1. **Separate Pools**: Each combination of symbol + provider maintains its own FIFO queue
   - Example: `AAPL` from Interactive Brokers is separate from `AAPL` from another broker

2. **Buy Recording**: New purchases are added to the end of the queue

3. **Sell Calculation**: When you sell:
   - The oldest (first) purchase is matched with the sale
   - Cost basis is calculated as: `quantity × first_purchase_price`
   - Capital gain/loss = `sale_price - cost_basis`
   - Gain is taxable when remitted to Thailand

### Tax Remittance
- Taxable gains are tracked separately from unrealized gains
- Only gains from **sold positions** that have been **remitted to Thailand** are taxable
- The system tracks which remittances cover which gains (FIFO order)

---

## 🌐 Language Support

The app supports multiple languages:

- 🇹🇭 **Thai** (ไทย)
- 🇬🇧 **English**

Switch languages in the app settings or check `src/i18n/` for translation files.

---

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Latest 2 versions |
| Firefox | ✅ Latest 2 versions |
| Safari | ✅ Latest 2 versions |
| Edge | ✅ Latest 2 versions |
| Mobile | ✅ iOS Safari, Chrome Android |

---

## 🔗 Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.7 | UI library |
| TypeScript | 6.0.2 | Type safety |
| Vite | 8.1.1 | Build tool & dev server |
| Redux Toolkit | 2.12.0 | State management |
| React Hook Form | 7.83.0 | Form handling |
| Zod | 4.4.3 | Schema validation |
| i18next | 26.3.6 | Internationalization |
| Jest | 30.4.2 | Testing framework |
| Oxlint | 1.71.0 | Code linting |

---

## 📚 Documentation

Detailed documentation available in:

- **📋 [Architecture & Design](./docs/ux/design-system.md)** — Design system and UI conventions
- **🎯 [Feature Specifications](./docs/specs/)** — Detailed feature specs
- **🧪 [Test Cases](./docs/test-cases.md)** — QA test scenarios
- **📝 [Task Backlog](./docs/tasks.md)** — Development tasks and progress
- **👥 [Team Workflow](./docs/team-workflow.md)** — Development process

---

## 🤝 Contributing

### Development Workflow

1. **Read Documentation**: Check `docs/specs/` for feature requirements
2. **Branch**: Create a feature branch (`feature/your-feature`)
3. **Implement**: Code changes following TypeScript strict mode
4. **Test**: Write tests and ensure `npm run test` passes
5. **Lint**: Run `npm run lint` to check code quality
6. **Type Check**: Ensure `npx tsc --noEmit` passes
7. **Commit**: Clear, descriptive commit messages
8. **Pull Request**: Submit PR with test evidence

---

## 🐛 Troubleshooting

### Development Server Won't Start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Build Errors
```bash
# Ensure TypeScript passes
npx tsc --noEmit

# Check for linting errors
npm run lint
```

### Tests Failing
```bash
# Run tests with verbose output
npm run test -- --verbose

# Check specific test file
npm run test -- src/path/to/test.spec.ts
```

---

## 📞 Support & Contact

### Reporting Issues
Found a bug? Please create an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS version
- Screenshots or screen recording

### Questions?
Check the [docs/](./docs/) folder for detailed documentation and feature specifications.

---

## 📄 License

This project is proprietary software for tax calculation purposes.

---

## 🎉 Acknowledgments

Built with modern web technologies to make tax management simple and efficient for individual investors in Thailand.

**Happy tracking! 🚀**
