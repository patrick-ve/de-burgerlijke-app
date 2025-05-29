# Clean Architecture Migration Guide

## Overview
This guide provides step-by-step instructions for migrating the existing codebase to Clean Architecture.

## Migration Steps

### 1. Install Dependencies
First, ensure TypeScript path mapping is configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/domain/*": ["./src/domain/*"],
      "@/application/*": ["./src/application/*"],
      "@/infrastructure/*": ["./src/infrastructure/*"],
      "@/container": ["./src/container/index"]
    }
  }
}
```

### 2. Migrate Recipe Feature

#### Step 1: Update Recipe Type
The existing `Recipe` type in `/types/recipe.ts` needs to be replaced with references to the domain entity:

```typescript
// OLD: types/recipe.ts
export interface Recipe {
  id: string;
  title: string;
  // ...
}

// NEW: Import from domain
import { type Recipe } from '@/domain/entities/Recipe';
```

#### Step 2: Update RecipeForm Component
The RecipeForm component should use DTOs instead of domain entities:

```typescript
// components/RecipeForm.vue
import { type CreateRecipeDTO } from '@/application/dto/CreateRecipeDTO';

const emit = defineEmits<{
  submit: [recipe: CreateRecipeDTO]
}>();
```

#### Step 3: Replace useRecipes Composable
1. Rename current `useRecipes.ts` to `useRecipes.old.ts`
2. Copy `useRecipes.refactored.ts` to `useRecipes.ts`
3. Update imports in components

### 3. Migrate Shopping List Feature

#### Domain Entities
- Create `Todo` entity
- Create `MealPlan` entity
- Create value objects as needed

#### Use Cases
Create use cases for each operation:
- `AddToShoppingList`
- `OptimizeShoppingList`
- `FindCheapestPrices`

#### Repository Implementation
Create `LocalStorageShoppingListRepository`

### 4. Update API Routes

Current API routes should be updated to use use cases:

```typescript
// server/api/recipe/generate.post.ts
import { getContainer } from '@/container';

export default defineEventHandler(async (event) => {
  const { generateRecipeWithAI } = getContainer();
  const body = await readBody(event);
  
  try {
    const recipe = await generateRecipeWithAI.execute(body);
    return recipe;
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message
    });
  }
});
```

### 5. Testing Strategy

#### Unit Tests
- Test domain entities in isolation
- Test use cases with mocked repositories
- Test value objects

#### Integration Tests
- Test repositories with real storage
- Test API endpoints

Example test structure:
```typescript
// __tests__/domain/entities/Recipe.spec.ts
describe('Recipe Entity', () => {
  it('should validate required fields', () => {
    expect(() => new Recipe('', '', [], [], ...)).toThrow();
  });
  
  it('should calculate total time correctly', () => {
    const recipe = new Recipe(...);
    expect(recipe.totalTime.minutes).toBe(90);
  });
});
```

### 6. Gradual Migration Path

To avoid breaking the entire app, follow this order:

1. **Phase 1**: Core Infrastructure
   - Set up folder structure ✓
   - Create domain entities ✓
   - Set up dependency injection ✓

2. **Phase 2**: Recipe Feature
   - Migrate recipe functionality
   - Update recipe-related components
   - Test thoroughly

3. **Phase 3**: Shopping List
   - Migrate shopping list
   - Update related components

4. **Phase 4**: Remaining Features
   - Todos
   - Meal planning
   - Settings

5. **Phase 5**: Cleanup
   - Remove old code
   - Update documentation
   - Optimize bundle size

## Common Patterns

### Converting Composable to Use Case

**Before:**
```typescript
const addRecipe = (recipe: Recipe) => {
  recipe.id = generateId();
  recipe.createdAt = new Date();
  recipes.value.push(recipe);
  toast.add({ title: 'Recipe added!' });
};
```

**After:**
```typescript
const addRecipe = async (dto: CreateRecipeDTO) => {
  const recipe = await createRecipe.execute(dto);
  recipes.value.push(recipe);
};
```

### Handling Errors

Use a consistent error handling strategy:

```typescript
try {
  const result = await useCase.execute(input);
  // handle success
} catch (error) {
  if (error instanceof DomainError) {
    // handle domain errors
  } else if (error instanceof ValidationError) {
    // handle validation errors
  } else {
    // handle unexpected errors
  }
}
```

## Checklist

- [ ] Set up Clean Architecture folders
- [ ] Create domain entities and value objects
- [ ] Implement repository interfaces
- [ ] Create use cases
- [ ] Set up dependency injection
- [ ] Migrate composables one by one
- [ ] Update components to use new composables
- [ ] Update API routes
- [ ] Add comprehensive tests
- [ ] Remove old code
- [ ] Update documentation

## Notes

- Keep the UI components largely unchanged
- Focus on extracting business logic
- Maintain backward compatibility during migration
- Test each feature thoroughly after migration
- Document any breaking changes