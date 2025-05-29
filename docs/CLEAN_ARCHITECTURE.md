# Clean Architecture Implementation Plan

## Overview
This document outlines the Clean Architecture implementation for De Burgerlijke App, transforming it from a composables-based architecture to a properly layered Clean Architecture.

## Architecture Layers

### 1. Domain Layer (Core Business Logic)
The innermost layer containing enterprise business rules and entities.

**Location**: `/src/domain/`

- **Entities**: Core business objects with business rules
  - Recipe
  - ShoppingList
  - ShoppingItem
  - MealPlan
  - Todo
  - Birthday
  - Holiday
  
- **Value Objects**: Immutable objects representing concepts
  - Money
  - Quantity
  - Duration
  - RecipeIngredient
  - NutritionalInfo
  
- **Domain Services**: Business logic that doesn't fit in entities
  - RecipeParser
  - PriceCalculator
  - MealPlanner
  
- **Repository Interfaces**: Contracts for data access
  - IRecipeRepository
  - IShoppingListRepository
  - ITodoRepository
  - IMealPlanRepository

### 2. Application Layer (Use Cases)
Contains application-specific business rules and orchestrates the flow of data.

**Location**: `/src/application/`

- **Use Cases**: Application-specific business rules
  - recipes/
    - CreateRecipe
    - UpdateRecipe
    - DeleteRecipe
    - ImportRecipeFromUrl
    - GenerateRecipeWithAI
  - shopping/
    - AddToShoppingList
    - OptimizeShoppingList
    - FindCheapestPrices
    - CleanUpShoppingList
  - meal-planning/
    - PlanMeal
    - GenerateMealPlan
    - GetMealSuggestions
  - todos/
    - CreateTodo
    - UpdateTodo
    - AttachFileToTodo
    
- **DTOs**: Data Transfer Objects for use case input/output
- **Interfaces**: Contracts for external services
  - INotificationService
  - IFileStorageService
  - IAIService
  - IPriceService

### 3. Infrastructure Layer
Contains all external concerns and implementations.

**Location**: `/src/infrastructure/`

- **Repositories**: Concrete implementations
  - LocalStorageRecipeRepository
  - SQLiteRecipeRepository (future)
  - LocalStorageShoppingListRepository
  
- **External Services**:
  - OpenAIService
  - GoogleAIService
  - FirecrawlService
  - WeaviateService
  - WeatherAPIService
  
- **Persistence**:
  - Database configurations
  - Migration management
  - Cache implementations

### 4. Presentation Layer
UI components and controllers.

**Location**: Existing structure with modifications

- **Composables**: Thin wrappers around use cases
  - Inject use cases
  - Handle UI state
  - No business logic
  
- **Components**: Vue components (unchanged)
- **Pages**: Nuxt pages (unchanged)
- **API Routes**: Controllers that use use cases

## Dependency Injection Container

**Location**: `/src/container/`

```typescript
// container/index.ts
export interface Container {
  // Repositories
  recipeRepository: IRecipeRepository;
  shoppingListRepository: IShoppingListRepository;
  
  // Services
  aiService: IAIService;
  priceService: IPriceService;
  
  // Use Cases
  createRecipe: CreateRecipe;
  updateRecipe: UpdateRecipe;
  // ... etc
}
```

## Migration Strategy

### Phase 1: Setup Infrastructure
1. Create folder structure
2. Set up dependency injection
3. Create base interfaces and classes

### Phase 2: Domain Layer
1. Extract entities from existing types
2. Add business rules to entities
3. Create value objects
4. Define repository interfaces

### Phase 3: Use Cases
1. Extract business logic from composables
2. Create use case classes
3. Define DTOs

### Phase 4: Infrastructure
1. Implement repositories
2. Wrap external services
3. Set up persistence layer

### Phase 5: Refactor Presentation
1. Update composables to use use cases
2. Remove business logic from composables
3. Update API routes to use use cases

## Benefits

1. **Testability**: Business logic can be tested without UI or external dependencies
2. **Maintainability**: Clear separation of concerns
3. **Scalability**: Easy to add new features or change implementations
4. **Flexibility**: Can switch between localStorage and database easily
5. **Type Safety**: Strong contracts between layers

## Example Refactoring

### Before (Current Composable):
```typescript
// composables/useRecipes.ts
export const useRecipes = () => {
  const recipes = useStorage<Recipe[]>('recipes', []);
  
  const addRecipe = (recipe: Recipe) => {
    const newRecipe = {
      ...recipe,
      id: generateId(),
      createdAt: new Date()
    };
    recipes.value.push(newRecipe);
    toast.add({ title: 'Recipe added!' });
  };
  
  return { recipes, addRecipe };
};
```

### After (Clean Architecture):
```typescript
// domain/entities/Recipe.ts
export class Recipe {
  constructor(
    public id: string,
    public title: string,
    public ingredients: RecipeIngredient[],
    public createdAt: Date
  ) {}
  
  validate(): void {
    if (!this.title) throw new Error('Recipe must have a title');
  }
}

// application/use-cases/CreateRecipe.ts
export class CreateRecipe {
  constructor(
    private recipeRepo: IRecipeRepository,
    private notificationService: INotificationService
  ) {}
  
  async execute(dto: CreateRecipeDTO): Promise<Recipe> {
    const recipe = new Recipe(
      generateId(),
      dto.title,
      dto.ingredients,
      new Date()
    );
    
    recipe.validate();
    await this.recipeRepo.save(recipe);
    await this.notificationService.notify('Recipe added!');
    
    return recipe;
  }
}

// composables/useRecipes.ts (refactored)
export const useRecipes = () => {
  const { createRecipe } = useContainer();
  const recipes = ref<Recipe[]>([]);
  
  const addRecipe = async (recipeData: CreateRecipeDTO) => {
    const recipe = await createRecipe.execute(recipeData);
    recipes.value.push(recipe);
  };
  
  return { recipes, addRecipe };
};
```

This structure provides a solid foundation for scaling the application while maintaining clean, testable code.