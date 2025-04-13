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
  - [ ] UI element in `RecipeDetailView.vue` or `RecipeForm.vue` to adjust portions.
  - [ ] Logic to scale ingredient quantities proportionally.
  - [ ] Update stored recipe data.

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

- [ ] **URL Input:**
  - [ ] UI for pasting URL.
  - [ ] Server API endpoint (`server/api/`) to fetch URL content.
  - [ ] LLM integration for parsing fetched HTML content.
- [ ] **Image Input:**
  - [ ] UI for uploading image.
  - [ ] Server API endpoint (`server/api/`) to handle image upload.
  - [ ] OCR integration (server-side).
  - [ ] LLM integration for parsing OCR text.
- [ ] **LLM Parsing & Structuring:**
  - [ ] Identify/extract Title.
  - [ ] Identify/extract Description/Metadata (prep time, cook time, cuisine, etc.).
  - [ ] Identify/extract Portions.
  - [ ] Identify/extract Ingredients (quantity, unit, name).
  - [ ] Identify/extract Steps (ordered).
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
- [ ] **Favorites:**
  - [x] UI toggle button (`RecipeCard.vue`).
  - [ ] Persistence for favorite status (backend).
  - [ ] Dedicated "Favorites" view/filter.
- [ ] **Portion Adjustment:**
  - [ ] UI element in `RecipeDetailView.vue` or `RecipeForm.vue` to adjust portions.
  - [ ] Logic to scale ingredient quantities proportionally.
  - [ ] Update stored recipe data.

#### 4.3 Cooking Assistance

- [ ] **Step Timers:**
  - [ ] Detect timed actions in recipe steps (server-side parsing or client-side regex).
  - [ ] Display interactive timer button next to relevant steps in `RecipeDetailView.vue`.
  - [ ] Implement in-app timer functionality (UI component).
  - [ ] Handle multiple concurrent timers.

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
  - [ ] UI button/action to generate list from scheduled meals for a period.
  - [ ] Define database schema for `ShoppingList` and `ShoppingListItem` models.
  - [ ] Server API endpoint to generate the list.
- [ ] **Ingredient Aggregation & Standardization:**
  - [ ] Logic to combine identical ingredients (sum quantities, respect units).
  - [ ] Implement ingredient name standardization.
- [ ] **Portion Scaling Integration:** Ensure generated list quantities reflect scheduled meal portions.
- [ ] **Price Fetching:**
  - [ ] Server API endpoint(s) to fetch prices from supported supermarkets (AH, Jumbo, Lidl, Plus).
  - [ ] Implement robust ingredient-to-product matching logic.
  - [ ] Handle missing items/prices gracefully.
- [ ] **Cheapest Option Calculation:**
  - [ ] Server API logic to calculate cheapest overall basket.
  - [ ] UI to select preferred supermarkets for comparison.
- [ ] **Price Display:**
  - [ ] UI (`components/ShoppingList.vue`) to display price per item/supermarket.
  - [ ] Display total estimated cost per store / cheapest option.
- [ ] **List Management:**
  - [ ] UI (`components/ShoppingList.vue`) for checking off items.
  - [ ] UI for manually adding/editing items.
  - [ ] Update list status/item status in the backend.

## Groceries Pricing Insights (`groceries-pricing-insights-prd.md`)

### Core Components & Tests

- [ ] `components/PriceHistoryChart.vue`: Component to display price trend chart.
- [ ] `__tests__/PriceHistoryChart.spec.ts`: Unit tests for `PriceHistoryChart`.
- [ ] `pages/groceries/insights.vue`: Page for searching and viewing price insights.
- [ ] `__tests__/pages/groceries/insights.spec.ts`: Tests for the insights page.

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

#### 4.3 Household Management

- [ ] **Household Creation:**
  - [ ] UI (`components/HouseholdManager.vue`).
  - [ ] Server API (`server/api/households/create`) to create household and set creator as admin.
- [ ] **Invitations:**
  - [ ] UI for sending invites (by email/username) in `components/HouseholdManager.vue`.
  - [ ] Server API (`server/api/households/invite`) to create invitation record.
  - [ ] Notification system (in-app/email) for received invitations.
  - [ ] UI for accepting/declining invites.
  - [ ] Server API (`server/api/households/respond-invite`) to handle acceptance/decline.
- [ ] **Membership:**
  - [ ] UI to display members in `components/HouseholdManager.vue`.
  - [ ] Define database schema for `Household`, `HouseholdMember`, `HouseholdInvitation`.
- [ ] **Roles:** Implement basic Admin/Member roles in backend logic.
- [ ] **Leaving/Removing:**
  - [ ] UI for members to leave.
  - [ ] UI for admins to remove members.
  - [ ] Server API (`server/api/households/leave`, `server/api/households/remove-member`).
  - [ ] Define logic for last admin leaving.

#### 4.4 Sharing Mechanisms

- [ ] **Shared Scope Logic:** Backend APIs must enforce household membership for accessing shared resources.
- [ ] **Recipe Sharing:**
  - [ ] Modify `Recipe` model/schema (`householdId?`).
  - [ ] UI option during recipe save/edit to assign to a household.
  - [ ] Modify recipe list/fetch logic to include household recipes.
- [ ] **Meal Plan Sharing:**
  - [ ] Modify `ScheduledMeal` model/schema (`householdId?`).
  - [ ] Ensure `components/MealPlanner.vue` operates on the household's shared plan.
  - [ ] Modify scheduling APIs to associate with `householdId`.
- [ ] **Shopping List Sharing:**
  - [ ] Modify `ShoppingList` model/schema (`householdId?`).
  - [ ] Ensure list generation uses the shared household meal plan.
  - [ ] Modify list fetching/updating APIs to use `householdId`.
  - [ ] Ensure real-time (or near real-time) updates for shared list changes (checking off items). Consider WebSockets or polling.
- [ ] **Permissions:** Implement backend checks based on `HouseholdMember` status for all shared CRUD operations.

## Development Progress

### Features Implemented

- **Dynamic Header:**
  - Created `composables/useHeaderState.ts` to manage header configuration (title, action visibility, handlers) using `useState`.
  - Created `components/TheHeader.vue` with a title prop and target divs (`#header-left-action`, `#header-right-action`) for teleported actions.
  - Integrated `TheHeader` into `app.vue`, providing the title from `useHeaderState`.
  - Refactored Action Buttons: Moved the definition of action buttons from `app.vue` to individual pages using `<Teleport>`.
  - Updated `pages/recipes/new.vue`:
    - Uses `useHeaderState` to set title, visibility flags, and action handlers.
    - Teleports Back and Save buttons to the header.
  - **Updated `pages/recipes/index.vue`:**
    - Uses `useHeaderState` to set title ("Recipes") and action handler.
    - Teleports an "Add" button to the header's right action slot, navigating to `/recipes/new`.
  - **Updated `pages/recipes/[id].vue`:**
    - Uses `useHeaderState` to set an initial title ("Loading Recipe...") and action handler.
    - Teleports a "Back" button to the header's left action slot.
    - Watches the fetched recipe data to dynamically update the header title to the recipe's name or "Recipe Not Found".
    - Removed the static back link.
- **Recipe Form Page (`pages/recipes/new.vue`):**
  - Setup basic structure with placeholder save logic.
  - Included `RecipeForm` component (assuming it exists).
  - Added `useHead` for page title.
  - Removed the static `<h1>` and `<NuxtLink>`.
- Updated component logic (filtering, reset, computed properties) to support the new UI elements.
- Arranged filter/sort controls (Title Sort, Quick Recipes, Cuisine, Favorites) into a 2x2 grid layout.
- Replaced the 'Quick Recipes' checkbox with a `USelectMenu` offering specific time ranges: '< 20 min', '20-45 min', '> 45 min', and 'Any Time'.
- Updated filtering logic to handle the new time range selections.
- Replaced the 'Cuisine' filter (`USelect`) with a searchable `USelectMenu`, including an 'Any Cuisine' option.
- Replaced the 'Sort by Title' toggle button (`UButton`) with a `USelectMenu` offering 'Ascending' and 'Descending' options.
- Removed search capability from the Cuisine filter.
- Added icons to the 'Sort by Title' select menu options.
- Replaced the 'Favorites' toggle button (`UButton`) with a `UCheckbox`.
- Replaced the 'Favorites' checkbox (`UCheckbox`) with a `UToggle`.
- Removed the text label for the 'Favorites' toggle and added on/off icons instead.

- **Refactor(`RecipeList.vue`):** Simplified the filter slideover footer by removing the "Cancel" button. Closing the slideover via the "X" button or the "Apply" button now confirms the selected filters.
- **Feature(`RecipeList.vue`):** Added filter and sort functionality within a slideover.
- **Feature(`RecipeList.vue`):** Implemented search, pagination, and display of recipes using `RecipeCard`.
- **Component(`RecipeCard.vue`):** Created component to display individual recipe details.
- **Types(`recipe.ts`):** Defined the `Recipe` interface.
- **Component(`RecipeList.vue`):** Initial setup for displaying a list of recipes.

## [Date - e.g., YYYY-MM-DD]

### Added

- Improved the UI for the recipe metadata section in `RecipeDetailView.vue`:
  - Added display for the recipe image (`<NuxtImg>`).
  - Used icons (`<UIcon>`) for prep time, cook time, and portions.
  - Applied modern Tailwind CSS styling to the metadata section.
  - Added icons to the Ingredients/Instructions tabs.

## [Unreleased] - YYYY-MM-DD

### Added

- Display active filters (`cuisine`, `time`, `favorites`, `sort`) as badges below the search bar in `RecipeList.vue`.
- Added a "Reset filters" button that appears next to the active filter badges.

### Refactoring Mock Recipe Data

- **Date:** 2024-07-27
- **Summary:** Refactored mock recipe data handling to eliminate duplication between the recipe list page (`pages/recipes/index.vue`) and the recipe detail page (`pages/recipes/[id].vue`).
- **Details:**
  - Created a new composable `composables/useMockRecipes.ts` to centralize the mock recipe array.
  - This composable exports the `recipes` array and a `findRecipeById` function.
  - Updated `pages/recipes/index.vue` to fetch the list of recipes from the `useMockRecipes` composable.
  - Updated `pages/recipes/[id].vue` to use the `findRecipeById` function from the `useMockRecipes` composable within `useAsyncData` to retrieve the specific recipe based on the route parameter, removing the previously hardcoded mock data.
- **Impact:** Improved code maintainability by centralizing mock data and reducing redundancy.

## [Current Date] - Refinements

- **RecipeDetailView:** Fixed an issue where the tab icon was rendered twice by removing the redundant icon element from the default slot of the `UTabs` component.
