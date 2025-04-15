# Development Progress Tracker

This document tracks the implementation status of features outlined in the Product Requirement Documents (PRDs) using a checklist format.

Development of the app follows a Test-Driven Development (TDD) approach:

1. Test Writing Phase:

   - Unit tests are written first, based on:
     - Business requirements and acceptance criteria
     - Edge cases and error scenarios
     - Domain knowledge and expected behaviors
     - Component interfaces and props
   - Integration tests are added for critical user flows
   - E2E tests cover key user journeys

2. Test Execution:

   - Unit tests: `yarn run unit`

3. Implementation Phase:

   - Components are developed to pass the test specifications
   - Code is refactored while maintaining test coverage
   - Additional tests are added as new edge cases are discovered
   - Components are improved based on test results and feedback

4. Code Review:
   - Tests are reviewed alongside implementation
   - Coverage reports are analyzed
   - Edge cases and error handling are verified
   - Performance implications are considered

## General UI / Core Components

- [x] `components/TheHeader.vue`: Improved alignment using CSS Grid (`grid-cols-[1fr_auto_1fr]`) to ensure title is always centered.
- [x] `components/BottomNav.vue`: Conditionally render based on route depth (show only on root or level-1 routes).
- [x] `components/RecipeCard.vue`: Display basic recipe info.
- [x] `__tests__/RecipeCard.spec.ts`: Unit tests for `RecipeCard`.
- [x] `components/RecipeDetailView.vue`: Display full recipe details.
- [x] `__tests__/RecipeDetailView.spec.ts`: Unit tests for `RecipeDetailView`.
- [x] `components/RecipeForm.vue`: Form for creating/editing recipes.
- [x] `__tests__/RecipeForm.spec.ts`: Unit tests for `RecipeForm`.
- [-] `components/RecipeList.vue`: Component to display multiple `RecipeCard`s with filtering/sorting/pagination (Basic structure created).
- [-] `__tests__/RecipeList.spec.ts`: Unit tests for `RecipeList` (Basic tests added).
- [x] `pages/recipes/index.vue`: Page to display `RecipeList`.
- [x] `pages/recipes/[id].vue`: Page to display `RecipeDetailView` for a specific recipe.
- [x] `pages/recipes/new.vue`: Page to display `RecipeForm` for creating new recipes.
- [x] **Favorites:**
  - [x] UI toggle button (`RecipeCard.vue`).
  - [ ] Persistence for favorite status (backend).
  - [ ] Dedicated "Favorites" view/filter.
- [ ] **Portion Adjustment:**
  - [-] UI element in `RecipeDetailView.vue` or `RecipeForm.vue` to adjust portions. (Slideover UI implemented)
  - [x] Logic to scale ingredient quantities proportionally. (Needed for shopping list)
  - [ ] Update stored recipe data. (Needed for shopping list)
- [x] `components/RecipeCookingTimer.vue`: Refactored timer logic for accurate display countdown using reactive state and endTime.

## Recipes (`recipes-prd.md`)

### Core Components & Tests

- [x] `components/RecipeCard.vue`: Display basic recipe info.
- [x] `__tests__/RecipeCard.spec.ts`: Unit tests for `RecipeCard`.
- [x] `components/RecipeDetailView.vue`: Display full recipe details.
- [x] `__tests__/RecipeDetailView.spec.ts`: Unit tests for `RecipeDetailView`.
- [x] `components/RecipeForm.vue`: Form for creating/editing recipes.
- [x] `__tests__/RecipeForm.spec.ts`: Unit tests for `RecipeForm`.
- [-] `components/RecipeList.vue`: Component to display multiple `RecipeCard`s with filtering/sorting/pagination (Basic structure created).
- [-] `__tests__/RecipeList.spec.ts`: Unit tests for `RecipeList` (Basic tests added).
- [x] `pages/recipes/index.vue`: Page to display `RecipeList`.
- [x] `pages/recipes/[id].vue`: Page to display `RecipeDetailView` for a specific recipe.
- [x] `pages/recipes/new.vue`: Page to display `RecipeForm` for creating new recipes.

### Features Checklist

#### 4.1 Recipe Input & Parsing

- [x] **URL Input:**
  - [x] UI for pasting URL (`components/AddRecipeModal.vue`, integrated into `pages/recipes/index.vue`).
  - [x] Server API endpoint (`server/api/recipe/url.post.ts`) to fetch URL content.
  - [x] LLM integration for parsing fetched HTML content.
- [ ] **Image Input:**
  - [ ] UI for uploading image.
- [x] **LLM Parsing & Structuring:**
  - [x] Identify/extract Title.
  - [x] Identify/extract Description/Metadata (prep time, cook time, cuisine, etc.).
  - [x] Identify/extract Portions.
  - [x] Identify/extract Ingredients (quantity, unit, name).
  - [x] Identify/extract Steps (ordered).
  - [ ] Identify/extract Utensils.
- [x] **User Review & Edit:**
  - [x] UI for reviewing parsed recipe data before saving (`components/RecipeForm.vue`).
  - [x] Functionality to edit parsed fields (`components/RecipeForm.vue`, `composables/useFieldArray.ts`).

#### 4.2 Recipe Management

- [ ] **Recipe Storage:**
  - [ ] Define database schema for `Recipe` model.
  - [ ] Server API endpoints for CRUD operations on recipes.
- [x] **Recipe View (Detail):** (`components/RecipeDetailView.vue`)
  - [x] Display Title, Description, Metadata.
  - [x] Display Ingredients list (in dedicated tab).
  - [x] Display Steps list (in dedicated tab).
  - [x] Display Utensils list (in dedicated tab).
  - [x] Display Portions.
- [x] **Recipe Deletion:**
  - [x] Added `deleteRecipe` function to `composables/useRecipes.ts`.
  - [x] Implemented context menu trigger (ellipsis icon) in header on recipe detail page (`pages/recipes/[id].vue`).
  - [x] Added "Verwijder recept" option in context menu.
  - [x] Implemented confirmation modal (`UModal`) for delete action.
  - [x] Added logic to call `deleteRecipe` and navigate back upon confirmation.
- [ ] **Favorites:**
  - [x] UI toggle button (`RecipeCard.vue`).
  - [ ] Persistence for favorite status (backend).
  - [ ] Dedicated "Favorites" view/filter.
- [ ] **Portion Adjustment:**
  - [-] UI element in `RecipeDetailView.vue` or `RecipeForm.vue` to adjust portions. (Slideover UI implemented)
  - [x] Logic to scale ingredient quantities proportionally. (Needed for shopping list)

#### 4.3 Cooking Assistance

- [x] **Step Timers:**
  - [ ] Detect timed actions in recipe steps (server-side parsing or client-side regex).
  - [x] Display interactive timer button next to relevant steps in `RecipeDetailView.vue`.
  - [x] Implement in-app timer functionality (`components/RecipeCookingTimer.vue`).
  - [x] Handle multiple concurrent timers.
- [x] **Step Completion:**
  - [x] Display steps with interactive checkboxes in `RecipeDetailView.vue`.
  - [ ] Implement logic to track and persist step completion status (e.g., per scheduled meal instance or cooking session).

#### 4.4 Meal Planning & Scheduling

- [ ] **Weekly Planner View:**
  - [ ] UI Component for calendar/list view (`components/MealPlanner.vue`).
  - [ ] Display days of the week.
- [ ] **Scheduling:**
  - [ ] UI for assigning recipes to days (e.g., drag-and-drop, selection).
  - [ ] Define database schema for `ScheduledMeal` model.
  - [ ] Server API endpoints for scheduling meals.
- [ ] **Display Scheduled Meals:** Show assigned recipes in the planner view.

#### 4.5 Grocery List Generation & Pricing

- [ ] **List Creation:**
  - [-] UI button/action to generate list from scheduled meals for a period. (Button exists in RecipeDetailView, uses composable)
  - [ ] Define database schema for `ShoppingList` and `ShoppingListItem` models.
- [ ] Server API endpoint to generate the list.
- [x] Client-side state management using `composables/useShoppingList.ts` (initial implementation).
- [x] **Ingredient Aggregation & Standardization (Client-side):**
  - [-] Logic to combine identical ingredients (sum quantities, respect units). (Basic implementation in composable)
  - [-] Implement ingredient name standardization. (Basic implementation in composable)
  - [x] Improved aggregation logic in `useShoppingList` to handle unit variations (null/empty) and basic pluralization ("cloves" -> "clove").
- [x] **Portion Scaling Integration (Client-side):** Ensure generated list quantities reflect scheduled meal portions.
- [ ] **Price Fetching:**
  - [ ] Server API endpoint(s) to fetch prices from supported supermarkets (AH, Jumbo, Lidl, Plus).
  - [ ] Implement robust ingredient-to-product matching logic.
- [ ] **Cheapest Option Calculation:**
  - [ ] Server API logic to calculate cheapest overall basket.
  - [ ] UI to select preferred supermarkets for comparison.
- [ ] **Price Display:**
  - [ ] UI (`components/ShoppingList.vue`) to display price per item/supermarket.
  - [ ] Display total estimated cost per store / cheapest option.
- [x] **List Management:**
  - [x] UI (`components/ShoppingList.vue`) for checking off items.
  - [ ] UI for manually adding/editing items.
  - [ ] Update list status/item status in the backend.
  - [x] Added confirmation modal when clearing the shopping list (`pages/shopping-list/index.vue`).

## Groceries Pricing Insights (`groceries-pricing-insights-prd.md`)

### Core Components & Tests

- [ ] `components/PriceHistoryChart.vue`: Component to display price trend chart.
- [ ] `__tests__/PriceHistoryChart.spec.ts`: Unit tests for `PriceHistoryChart`.
- [ ] `pages/groceries/insights.vue`: Page for searching and viewing price insights.
- [ ] `__tests__/pages/groceries/insights.spec.ts`: Tests for the insights page.
- [x] `components/ShoppingList.vue`: Component to display the generated shopping list.
- [x] `__tests__/ShoppingList.spec.ts`: Unit tests for `ShoppingList`.
- [x] `pages/shopping-list/index.vue`: Page to display the shopping list.
- [x] `composables/useShoppingList.ts`: Composable for managing shopping list state (client-side).

### Features Checklist

#### 4.1 Price Data Collection & Storage

- [ ] **Data Source:** Confirm/utilize source from `recipes-prd.md` (Supermarket APIs/Scrapers).
- [ ] **Historical Storage:**
  - [ ] Define database schema for `HistoricalPrice` and `StandardizedProduct`.
  - [ ] Implement server-side logic for regular price fetching and storing.
  - [ ] Define data retention policy.
- [ ] **Product Matching & Standardization:** Implement robust logic (ongoing task).

#### 4.2 Price Trend Visualization

- [ ] **Item Search:** Implement search UI on `pages/groceries/insights.vue`.
- [ ] **Chart Display (`components/PriceHistoryChart.vue`):**
  - [ ] Integrate charting library (e.g., Chart.js, ApexCharts).
  - [ ] Fetch aggregated historical data from backend API.
  - [ ] Display line chart of price over time.
  - [ ] Implement time range selection (3m, 6m, 1y, Max).
  - [ ] Implement supermarket selection/filtering for the chart.
- [ ] **Data Granularity:** Decide and implement aggregation (e.g., daily, weekly average) in backend API.
- [ ] **Comparison:** Ensure chart clearly displays lines for multiple selected supermarkets.

#### 4.3 Integration with Shopping List

- [ ] **Contextual Link:** Add button/link from item in `components/ShoppingList.vue` to its price history view/chart.
- [ ] **Price Context Indicator (Optional):**
  - [ ] Backend logic to calculate recent average price.
  - [ ] Backend logic to compare current vs. average (define thresholds).
  - [ ] UI indicator (arrow/color) in `components/ShoppingList.vue`.

#### 4.4 Data Management

- [ ] **Supermarket Coverage:** Define and document initial supermarket scope (AH, Jumbo, Plus, Lidl).
- [ ] **Data Updates:** Ensure regular backend job for fetching and storing historical prices.

## User Accounts & Sharing (`user-accounts-sharing-prd.md`)

### Core Components & Tests

- [ ] `pages/login.vue`, `pages/register.vue`, `pages/profile.vue`, `pages/reset-password.vue`
- [ ] `components/AuthForm.vue` (reusable for login/register)
- [ ] `components/ProfileForm.vue`
- [ ] `components/HouseholdManager.vue`
- [ ] Associated unit/integration tests for auth pages and components.

### Features Checklist

#### 4.1 User Authentication & Authorization

- [ ] **Registration:**
  - [ ] UI Form (`components/AuthForm.vue`, `pages/register.vue`).
  - [ ] Server API (`server/api/auth/register`) for email/password signup.
  - [ ] Implement password strength validation.
  - [ ] Implement email verification flow (send email, confirmation endpoint).
- [ ] **Login:**
  - [ ] UI Form (`components/AuthForm.vue`, `pages/login.vue`).
  - [ ] Server API (`server/api/auth/login`) for email/password login.
  - [ ] Implement brute-force protection (rate limiting).
- [ ] **Password Reset:**
  - [ ] UI Form (`pages/reset-password.vue` - initial request).
  - [ ] Server API (`server/api/auth/request-reset`) to send reset link/code.
  - [ ] UI Form (`pages/reset-password/[token].vue` - new password entry).
  - [ ] Server API (`server/api/auth/perform-reset`) to verify token and update password.
- [ ] **Session Management:**
  - [ ] Implement secure session handling (e.g., JWT with httpOnly cookies).
  - [ ] Handle token refresh/expiration.
  - [ ] Implement middleware for protecting authenticated routes.

#### 4.2 Profile Management

- [ ] **View/Edit Profile:**
  - [ ] UI (`pages/profile.vue`, `components/ProfileForm.vue`).
  - [ ] Server API (`server/api/user/profile`) for GET/PUT operations.
- [ ] **Change Password:**
  - [ ] UI in Profile page.
  - [ ] Server API (`server/api/user/change-password`).
- [ ] **Delete Account:**
  - [ ] UI confirmation flow.
  - [ ] Server API (`server/api/user/delete-account`).
- [ ] Implement password strength validation.
- [ ] **Household Association:** Display user's household.
- [ ] **Profile Picture:**
  - [ ] UI for upload.
  - [ ] Backend storage (e.g., S3 compatible).
  - [ ] Server API for upload/update.

#### 4.3 Household Management

- [ ] **Create Household:**
  - [ ] UI (`components/HouseholdManager.vue`).
  - [ ] Server API (`server/api/household`) for creation.
- [ ] **Join Household:**
  - [ ] UI for entering invite code.
  - [ ] Server API for joining via code.
- [ ] **Invite Members:**
  - [ ] UI to generate/display invite code (`components/HouseholdManager.vue`).
  - [ ] Server API for generating/validating codes.
- [ ] **Manage Members:**
  - [ ] UI to view members (`components/HouseholdManager.vue`).
  - [ ] UI to remove members (if owner).
  - [ ] Server API for member management (roles/permissions later).

#### 4.4 Recipe Sharing

- [ ] **Share with Household:**
  - [ ] UI option/toggle during recipe save/edit.
  - [ ] Backend logic to link recipe to household.
- [ ] **Shared Recipe Visibility:** Ensure household members see shared recipes.

#### 4.5 Permissions & Roles (Future)

- [ ] Define roles (Owner, Member).
- [ ] Implement basic permission checks (e.g., only owner can remove members).

## Changelog

#### Fixed

- **`RecipeDetailView.vue`**: Removed redundant icon element from the default slot of the `UTabs` component to fix duplicate tab icons.
- **`AddRecipeModal.vue`**: Corrected Zod parsing logic to handle the direct recipe object returned by the `/api/recipe/url` endpoint, resolving validation errors.
- **`RecipeDetailView.vue`**: Refactored timer logic to correctly handle duration provided in milliseconds, fixing display issues (e.g., 20000ms now shows as 00:20 instead of 20000:00).

#### Added

- **`components/AddRecipeModal.vue`**: Created a modal component to capture a recipe URL from the user.
- **`pages/recipes/index.vue`**: Integrated `AddRecipeModal` and updated the "Voeg toe" button to open this modal instead of navigating directly to the create page.
- **`RecipeList.vue`**:
  - Display active filters (`cuisine`, `time`, `favorites`, `sort`) as badges below the search bar.
  - Added a "Reset filters" button next to the active filter badges.
- **`BottomNav.vue`**: Added slide-up transition when the component appears/disappears.
- **`ShoppingList.vue`**: Added 'Maak leeg' button to shopping list header to clear the list.

#### Changed

- \*\*`RecipeList.vue`

* Refactored recipe list page to use `useRecipes` composable.
* Refactored shopping list page header to use `useHeaderState` composable.

### Shopping List

- Initial implementation of the shopping list page and component.
- Added functionality to add ingredients from recipes, update item status (checked/unchecked), delete items, and clear the list.
- Implemented aggregation logic for ingredients added from multiple recipes.
- Added unit and name standardization helpers.
- Included visual feedback for checked items and transitions for adding/removing items.
- Added a confirmation modal for clearing the entire list.
- Implemented state persistence for the shopping list using `useStorage` from VueUse, ensuring item status is maintained across page refreshes.

- Aligned `server/utils/recipeSchema.ts` and the AI prompt in `server/api/recipe/url.post.ts` with the `types/recipe.ts` interface.

## Recipe Management

- Refactored `useRecipes.ts` to use `useStorage` for persistent recipe storage.
- Added an `addRecipe` function to `useRecipes.ts` to handle adding new recipes from the `AddRecipeModal`.
- Integrated the `addRecipe` function into `pages/recipes/index.vue` to save recipes parsed from the modal.

### Recipe Detail View

- Added timer functionality to instruction steps in `RecipeDetailView.vue`.

### Refactoring

- Extracted timer logic from `RecipeDetailView.vue` into a dedicated `RecipeCookingTimer.vue` component for better separation of concerns and simplified state management.

## Development Progress

- Added initial structure for recipe detail page.
- Implemented basic layout for recipe header, ingredients, and instructions.
- Added `RecipeCookingTimer` component with basic functionality (start, pause, reset).
- Restyled `RecipeCookingTimer` component for better visual prominence.
- Rearranged layout of `RecipeCookingTimer` for better control separation (Play/Pause | Time | Reset).
