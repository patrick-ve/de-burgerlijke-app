# De Burgerlijke App 👩‍🍳👨‍🍳

## Overview

De Burgerlijke App is a mobile application designed to simplify meal planning and grocery shopping for couples. The app allows users to import recipes from cooking websites, automatically generating ingredient lists and cooking instructions using AI. Users can manage their favorite recipes, create smart shopping lists, and follow step-by-step cooking instructions.

## Features

### Recipe Management

- [ ] Recipe URL Import
  - AI-powered recipe parsing
    - Server-side implementation using Vercel AI SDK
    - Input validation using Zod schema
    - Structured recipe data extraction
    - Support for multiple popular cooking websites
  - Recipe Schema
    ```typescript
    {
      title: string
      description?: string
      ingredients: {
        amount: number
        unit: string
        name: string
        notes?: string
      }[]
      instructions: {
        step: number
        text: string
        time?: {
          value: number
          unit: 'minutes' | 'hours'
        }
      }[]
      metadata: {
        servings: number
        prepTime: number
        cookTime: number
        totalTime: number
        difficulty: 'easy' | 'medium' | 'hard'
        cuisine?: string
        tags: string[]
      }
      nutrition?: {
        calories: number
        protein: number
        carbs: number
        fat: number
        fiber?: number
      }
      aiEnhancements: {
        tips: string[]
        substitutions: {
          ingredient: string
          alternatives: string[]
        }[]
        pairingsSuggestions: string[]
      }
    }
    ```
  - Automatic extraction of ingredients and instructions
  - Support for multiple popular cooking websites
- [ ] Recipe Library
  - Save favorite recipes
  - Categorize recipes
  - Search and filter functionality
  - Share recipes with partner
- [ ] Portion Adjustment
  - Dynamic ingredient quantity calculation
  - Serving size modification
  - Metric/Imperial unit conversion

### Shopping List Management

- [ ] Smart Shopping Lists
  - Automatic list generation from recipes
  - Combine ingredients from multiple recipes
  - Real-time sync between partners
  - Check off items while shopping
- [ ] Custom Items
  - Add non-recipe items
  - Quick add frequently bought items
  - Notes for specific items

### Cooking Mode

- [ ] Interactive Cooking Instructions
  - Step-by-step guidance
  - Check off completed steps
  - Keep screen active during cooking
  - Timer integration for cooking steps
- [ ] Kitchen Tools
  - Built-in timers
  - Unit converter
  - Temperature guide
  - Common substitutions

### User Experience

- [ ] Partner Synchronization
  - Real-time updates between partners
  - Shared recipe library
  - Collaborative shopping lists
- [ ] Offline Mode
  - Access to saved recipes
  - Shopping list functionality
  - Sync when back online

### Mobile-Specific Features

- [ ] Push Notifications
  - Shopping list updates
  - Partner activity notifications
  - Recipe sharing alerts
- [ ] Touch ID/Face ID Integration
  - Secure app access
  - Quick authentication
- [ ] Widget Support
  - Shopping list widget
  - Recipe of the day
  - Quick add items

### Technical Specifications

- Built with Nuxt 3 + Capacitor.js
- TypeScript for enhanced type safety
- Nuxt UI + Tailwind CSS for modern UI components
- Ionic Vue components for mobile-optimized interface
- AI-powered recipe parsing service
- Real-time synchronization using WebSocket

### Native Device Features

- [ ] Camera Integration
  - Scan barcodes for quick item addition
  - Take photos of physical recipes
- [ ] Local Storage
  - Offline recipe access
  - Shopping list persistence
- [ ] Share Integration
  - Export shopping lists
  - Share recipes via messaging apps

## Development Roadmap

### Phase 1: Core Features (Q2 2024)

- Basic recipe parsing
- Shopping list management
- User authenticationg
- Partner synchronization

### Phase 2: Enhanced Features (Q3 2024)

- AI improvements
- Advanced recipe management
- Shopping list optimization
- Cooking mode implementation

### Phase 3: Performance & UX (Q4 2024)

- Offline functionality
- UI/UX improvements
- Performance optimization
- Widget implementation

### Phase 4: Beta Testing (Q1 2025)

- Closed beta testing
- User feedback collection
- Bug fixes and improvements
- Performance monitoring

### Phase 5: Production Release (Q2 2025)

- App store submission
- Marketing campaign
- User support system
- Continuous improvements

## Technical Requirements

- iOS 14+ Support
- Android 8+ Support
- Minimum Device Specifications
  - Storage: 100MB
  - RAM: 2GB recommended
  - Internet connection for recipe parsing and sync

## Getting Started

### Prerequisites

- Node.js 18+
- Capacitor.js
- iOS/Android development environment

### Installation

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

## Contributing

We welcome contributions to De Burgerlijke App! Please read our contributing guidelines before submitting pull requests.

### Development Guidelines

- Follow Vue 3 Composition API best practices
- Use TypeScript for all new code
- Maintain mobile-first approach
- Write tests for new features

## License

MIT License - See LICENSE file for details

## Contact

For support or inquiries, please contact [contact information]
