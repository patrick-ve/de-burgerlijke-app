# 🍽️ De Burgerlijke App

*Making meal planning and grocery shopping effortless for couples*

## 🤔 What's De Burgerlijke App?

De Burgerlijke App is your smart cooking companion that takes the hassle out of meal planning and grocery shopping! Simply paste a recipe URL, and my AI-powered parser will automatically extract ingredients, instructions, and even suggest helpful tips and substitutions. Perfect for couples who want to cook together without the stress of planning!

Built with love using **Clean Architecture** principles to ensure maintainable, testable, and scalable code.

## ✨ Features

### Smart Recipe Management
*Turn any recipe URL into your personal cooking guide*

- **One-Click Recipe Import** - Just paste a URL and watch the magic happen
- **AI-Powered Enhancement** - Get helpful cooking tips, ingredient substitutions, and pairing suggestions
- **Personal Recipe Library** - Save, organize, and search your favorite recipes
- **Flexible Portion Control** - Automatically adjust ingredients for any serving size
- **Smart Unit Conversion** - Switch between metric and imperial measurements effortlessly

### Intelligent Shopping Lists
*Never forget an ingredient again*

- **Auto-Generated Lists** - Create shopping lists instantly from your recipes
- **Real-Time Sync** - Share lists with your partner for collaborative shopping
- **Smart Checkoff** - Mark items as bought and watch them disappear from both phones
- **Custom Items** - Add non-recipe items and personal notes
- **Store Organization** - Group items by category for efficient shopping

### Interactive Cooking Mode
*Your personal sous chef*

- **Step-by-Step Guidance** - Follow along with clear, timed instructions
- **Built-in Timers** - Never overcook or undercook again
- **Kitchen Tools** - Unit converter, temperature guide, and substitution helper
- **Smart Screen** - Keep your display active while cooking

### Perfect for Couples
*Cooking together, made simple*

- **Partner Synchronization** - Share recipes, lists, and cooking plans instantly
- **Collaborative Planning** - Plan meals together, even when apart
- **Shared Goals** - Work together towards your cooking and health objectives
- **Recipe Sharing** - Send your favorite finds to your partner with one tap

### Native Mobile Features
*Built for your phone, optimized for your life*

- **Camera Integration** - Scan barcodes and capture recipe photos
- **Secure Access** - Touch ID/Face ID for quick, secure login
- **Smart Widgets** - Access shopping lists and recipes right from your home screen
- **Smart Notifications** - Stay updated on shared activities and meal reminders
- **Offline Mode** - Access saved recipes and lists even without internet

## 🏗️ Tech Stack & Architecture

I've built De Burgerlijke App using modern, battle-tested technologies:

### Frontend & Mobile
- **Nuxt 3** - The intuitive Vue framework for production-ready apps
- **Vue 3** with **Composition API** - Reactive, performant, and developer-friendly
- **TypeScript** - Because I believe in type safety and better developer experience
- **Capacitor.js** - Cross-platform mobile development that actually works
- **Ionic Vue** - Mobile-optimized UI components that feel native
- **Nuxt UI + Tailwind CSS** - Beautiful, responsive design system

### AI & Data Processing
- **Vercel AI SDK** - Powering my intelligent recipe parsing
- **OpenAI API** - For smart recipe enhancement and suggestions
- **Google AI API** - Additional AI capabilities
- **Firecrawl** - Web scraping service for reliable recipe extraction
- **Browserbase** - Browser automation for complex scraping tasks
- **Scrapebase** - Alternative scraping service
- **Zod** - Runtime type validation for bulletproof data handling

### Database & Storage
- **Turso** - Edge database for fast, global data access
- **PostgreSQL** - Reliable relational database
- **Weaviate** - Vector database for AI-powered search

### Architecture Decisions
I've implemented **Clean Architecture** to ensure my app is:
- **Maintainable** - Clear separation of concerns across layers
- **Testable** - Every component has comprehensive unit tests
- **Scalable** - Easy to add new features without breaking existing code
- **Flexible** - Swap out external services without touching business logic

#### Architecture Layers:
1. **Domain Layer** - Pure business logic and entities
2. **Application Layer** - Use cases and application services
3. **Infrastructure Layer** - External APIs, databases, and frameworks
4. **Dependency Injection** - Clean, testable dependency management

### Key Architecture Benefits:
- **Dependency Inversion** - External services are easily replaceable
- **Test-Driven Development** - Comprehensive test coverage for confidence
- **Mobile-First Design** - Optimized for touch interactions and offline use
- **Type Safety** - End-to-end TypeScript for fewer runtime errors

## 🏛️ Why Clean Architecture?

I chose **Clean Architecture** because I believe in building software that lasts. Here's why it matters:

### The Problem with Traditional App Development
- **Tight Coupling** - Change one thing, break three others
- **Hard to Test** - Business logic mixed with UI and external services
- **Difficult to Scale** - Adding features becomes increasingly complex
- **Vendor Lock-in** - Switching services requires rewriting large portions

### My Solution: Clean Architecture
- **Dependency Inversion** - Core business logic doesn't depend on external services
- **Easy Testing** - Pure functions and clear boundaries make testing straightforward
- **Scalable Growth** - Add features without touching existing code
- **Flexible Infrastructure** - Swap out APIs, databases, or frameworks without pain

### Real-World Benefits
- **Faster Development** - Clear patterns mean less time figuring out "where does this go?"
- **Fewer Bugs** - Separation of concerns prevents unexpected side effects
- **Better Collaboration** - Team members can work on different layers independently
- **Future-Proof** - Easy to adapt when requirements change (and they always do!)

*"It's not about being perfect from day one, it's about being able to evolve gracefully."*


## 📱 System Requirements

### Mobile Support
- **iOS 14+** - Optimized for modern iPhones and iPads
- **Android 8+** - Works great on most Android devices

### Device Specifications
- **Storage**: 100MB free space
- **RAM**: 2GB recommended for smooth performance
- **Internet**: Required for recipe parsing and real-time sync
- **Camera**: Optional, for barcode scanning and recipe photos

## 🚀 Getting Started

Want to contribute or run the app locally? Here's everything you need!

### Prerequisites
- **Node.js 18+** - The engine that powers my development
- **Capacitor.js** - For mobile app functionality
- **iOS/Android development environment** - Xcode or Android Studio

### Quick Start
```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Run development server
npm run dev

# Build for production
npm run build
```

### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# AI Services
OPENAI_API_KEY="your-openai-api-key"
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# Web Scraping
FIRECRAWL_API_KEY="your-firecrawl-api-key"
BROWSERBASE_API_KEY="your-browserbase-api-key"
BROWSERBASE_PROJECT_ID="your-browserbase-project-id"
SCRAPEBASE_API_KEY="your-scrapebase-api-key"

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres"
TURSO_DB_URL="your-turso-database-url"
TURSO_DB_AUTH_TOKEN="your-turso-auth-token"

# Vector Database
WEAVIATE_URL="your-weaviate-cluster-url"
WEAVIATE_API_KEY="your-weaviate-api-key"

# External APIs
RAPID_API_KEY_YOUTUBE="your-youtube-api-key"

# UI License
NUXT_UI_PRO_LICENSE="your-nuxt-ui-pro-license"
```

### Database Setup

Before running the app, you need to seed the Weaviate vector database:

```bash
# Seed the vector database (required before first run)
npx jiti lib/ingest-weaviate.ts
```

### Development Commands
```bash
# Development
npm run dev                # Start development server with host binding
npm run build              # Build the application for production
npm run generate           # Generate static site
npm run preview            # Preview the production build
npm run postinstall        # Prepare Nuxt (runs automatically after install)

# Testing
npm run unit               # Run unit tests with Vitest
npm run unit:ui            # Run unit tests with Vitest UI
npm run unit:coverage      # Run unit tests with coverage report
npm run e2e                # Run end-to-end tests with Playwright
npm run e2e:ui             # Run E2E tests with Playwright UI
npm run e2e:update         # Update Playwright snapshots
```

## 🤝 Contributing

### Development Guidelines
- **Clean Architecture** - Follow my established layer patterns
- **TypeScript First** - All new code should be fully typed
- **Test-Driven Development** - Write tests for new features
- **Mobile-First Design** - Always consider touch interactions
- **Vue 3 Composition API** - Use modern Vue patterns

### Code Style
- Follow existing patterns in the codebase
- Use descriptive variable and function names
- Keep functions small and focused
- Document complex business logic

### Pull Request Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the guidelines
4. Run tests and ensure they pass
5. Submit a pull request with a clear description
