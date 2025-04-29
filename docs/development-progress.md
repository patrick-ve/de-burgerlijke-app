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
- [ ] Added `/planner` route to `BottomNav.vue` component.
- [-] **Home Page (`pages/index.vue`):**
  - [x] Display today's scheduled meal(s) using `useMealPlanner`.
  - [-] Display current weather.
    - [x] Created `composables/useWeather.ts` for weather data fetching.
    - [x] Implemented weather display card with loading/error states.
    - [x] Integrated Met Norway Locationforecast API for real weather data.
    - [-] Changed weather display to use background colors instead of icons.
      - [x] Updated styling to match image example (icon, large temp, description, colored background).
      - [x] Replaced weather icon and background with dynamic character image based on temperature and conditions.
- [-] **Landing Page (`pages/landing.vue`):** Added rotating image showcase.

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
- [x] **YouTube URL Input:**
  - [x] UI for pasting YouTube URL.
  - [x] Server API endpoint to fetch transcript.
  - [x] Improved server API endpoint (`server/api/recipe/youtube.post.ts`) to handle shortened `youtu.be/` URLs.
  - [x] LLM integration for parsing transcript.
- [x] **Image Input:**
  - [x] UI for uploading image.
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

- [x] **Weekly Planner View:**
  - [x] UI Component for calendar/list view (`pages/planner.vue`).
  - [x] Display days of the week, starting from the upcoming Monday.
  - [x] Updated date format to show full month name (`pages/planner.vue`).
  - [x] Refactored recipe adding UI in `pages/planner.vue` for better alignment and button placement.
  - [x] Refactored `UCard` to use standard `div` elements for simplicity in `pages/planner.vue`.
- [x] **Scheduling:**
  - [x] UI for assigning recipes to days (e.g., drag-and-drop, selection).
  - [ ] Define database schema for `ScheduledMeal` model.
- [x] **Display Scheduled Meals:** Show assigned recipes in the planner view and on the Home page (`pages/index.vue`).

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
  - [x] **AI-driven Cleanup:** Implemented `/api/shopping-list/clean-up` endpoint using AI to merge, standardize, and categorize items.
  - [x] Integrated AI cleanup call into `pages/planner.vue` after adding all ingredients.
- [x] **Portion Scaling Integration (Client-side):** Ensure generated list quantities reflect scheduled meal portions.
- [x] **Ingredient Categories:**
  - [x] Updated `types/recipe.ts` with refined ingredient categories (e.g., replaced 'Produce' with 'Fruit'/'Vegetables', added 'Alcohol').
  - [x] Added `category` field to `types/shopping-list.ts` (`ShoppingListItem` interface).
  - [x] Updated `composables/useShoppingList.ts` to include category when adding items.
- [x] **Shopping List UI Enhancements (`components/ShoppingList.vue`):**
  - [x] Grouped items by category, respecting the defined order.
  - [x] Added relevant emojis to category headers.
  - [x] Updated UI in `pages/shopping-list/index.vue` to group by Supermarket -> Category.
  - [x] Added total price calculation per supermarket group.
  - [x] Included supermarket icons in group headers.
- [-] **Price Fetching:**
  - [-] Server API endpoint(s) to fetch prices from supported supermarkets (AH, Jumbo, Lidl, Plus). (Initial AI-based implementation added)
  - [x] Moved price fetching logic (`fetchCheapestProducts`) into `composables/useShoppingList.ts`.
  - [x] Automated price fetching after AI list cleanup (`optimizeAndFetchPrices` in `useShoppingList.ts`).
  - [x] Removed manual "Prijzen ophalen" button from `pages/shopping-list/index.vue`.
- [-] **Cheapest Option Calculation:**
  - [-] Server API logic to calculate cheapest overall basket. (Initial AI-based implementation added to `find-cheapest.post.ts`)
  - [x] Server API logic to calculate cheapest overall basket (AI integration with `gpt-4o-mini` in `server/api/shopping-list/find-cheapest.post.ts` using Vercel AI SDK and Zod).
  - [x] Added support for filtering by selected supermarkets (`useOnboardingSettings`) in `find-cheapest.post.ts`.
  - [x] Define `Product` interface in `types/shopping-list.ts` for consistency.
- [x] **Price Display:**
  - [x] UI (`components/ShoppingList.vue`) to display price per item/supermarket.
  - [x] Display total estimated cost per store / cheapest option.
  - [x] Implemented grand total display in `pages/shopping-list/index.vue` and `components/ShoppingList.vue`.
  - [x] Displayed cheapest price info (price, supermarket, amount) per item in `pages/shopping-list/index.vue`.
- [x] **List Management:**
  - [x] UI (`components/ShoppingList.vue`) for checking off items.
  - [x] UI (`components/ShoppingList.vue`) for deleting items.
  - [x] UI (`components/ShoppingList.vue`) for clearing the list.
  - [x] **Manual Add:**
    - [x] Added "Voeg boodschappen toe" button in fixed bottom bar (`pages/shopping-list/index.vue`).
    - [x] Implemented modal (`UModal`) with textarea for multi-line text input.
    - [x] Created new API endpoint (`/api/shopping-list/standardize-text`) to parse/standardize raw text using AI.
    - [x] Updated `useShoppingList.ts` (`addItemsFromText`) to call the new endpoint, manage loading state (`isStandardizingItems`), and merge standardized items.
    - [x] Updated shopping list modal to use loading state for the add button.
    - [x] Fixed multi-line placeholder formatting in the textarea (`&#10;`).
  - [x] **Copy to Clipboard:**
    - [x] Added context menu to shopping list page header.
    - [x] Implemented "Kopieer lijst" button to copy unchecked items to clipboard.
  - [x] **View Mode Toggle:**
    - [x] Added `UToggle` to `pages/shopping-list/index.vue` to switch between views.
    - [x] Implemented conditional rendering: group by supermarket/category (with prices) vs. group by category only (no prices).

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
- **`AddRecipeModal.vue`**: Corrected Zod parsing logic to handle the direct recipe object returned by the `/api/recipe/url`
- **`USelectMenu`**: Fixed dropdown being clipped in the meal planner by removing `overflow-hidden` from the parent card container.

## Feature: Meal Planning

Created `pages/planner.vue` with a 7-day weekly view using `UCard`.
Created `composables/useMealPlanner.ts` with `useStorage` for persistent state.
Integrated `useRecipes` to provide recipes for selection.
Implemented `USelectMenu` for choosing recipes and buttons for adding/removing meals per day.
Used `useHeaderState` to set the page title ("Maaltijdplanner").
Translated UI elements to Dutch.

## Changelog

- Refactored Meal Planner UI: Moved recipe selection and portions input to the card header for a cleaner layout.
- Created reusable `PortionSelector.vue` component and integrated it into `pages/planner.vue`. The planner now defaults portion selection to the recipe's original portion count.
- Refactored the meal planner page (`pages/planner.vue`):
  - Moved recipe selection controls to the bottom section, visible only when no meal is planned.
  - Replaced individual meal removal buttons with a single 'X' button in the top-right corner of the day card when a meal is planned.
  - Hid the entire bottom section of the day card when a meal is planned.

### Planner Page

- Updated the UI for scheduled meal days: displays recipe image as background with overlay, changes text to white, and hides add controls.
- Removed the 'Nog geen maaltijden gepland.' message when no meals are scheduled for a day.

## Meal Planner (`planner-prd.md`)

- [x] **Weekly Planner View:**
  - [x] UI Component for calendar/list view (`pages/planner.vue`).
  - [x] Display days of the week, starting from the upcoming Monday.
  - [x] Updated date format to show full month name (`pages/planner.vue`).
  - [x] Refactored recipe adding UI in `pages/planner.vue` for better alignment and button placement.
  - [x] Refactored `UCard` to use standard `div` elements for simplicity in `pages/planner.vue`.
  - [x] Reordered elements in the planner day card header: moved Add Recipe controls before Day/Date info.

### Changed

- Adjusted the layout of meal cards in the planner page (`pages/planner.vue`):
  - Moved the planned meal title to the bottom-right corner.
  - Increased the font size of the planned meal title.
  - Ensured the remove button position remains consistent when visible.

* Fixed `USelectMenu` dropdown clipping issue in the meal planner by setting popper strategy to `fixed`.
* Conditionally applied `relative` positioning to planner day cards only when a meal is present, aiming to fix `USelectMenu` overlap.

### Meal Planner UI Refactor

- Replaced inline recipe selection with a modal (`UModal`) triggered by a 'Plan maaltijd' button on each day card in `pages/planner.vue`.
- Removed the separate `MealPlannerModal.vue` component and integrated its functionality directly into `pages/planner.vue`.
- Updated state management in `pages/planner.vue` to handle the modal's data and visibility.
- Aligned the "Plan maaltijd" button vertically with the date/day text using `sm:items-center`.
- Removed the placeholder text ("Klik op 'plan maaltijd'...") from empty day cards.

## Development Progress Changelog

- Added functionality to show the next available scheduled meal on the homepage if no meal is planned for the current day.
- Added a fixed bottom button to the Meal Planner page (`pages/planner.vue`).
- This button allows users to add all ingredients from the currently displayed week's planned meals directly to the shopping list.
- Ingredients are automatically scaled based on the planned portions for each meal.
- User feedback is provided via toast notifications.

## Database & Data Ingestion

- [x] **Database Setup:**
  - [x] Researched PostgreSQL and SQLite options.
  - [x] Attempted PostgreSQL setup with Docker/OrbStack (encountered authentication issues).
  - [x] Switched to SQLite for local development.
- [x] **Drizzle ORM Integration (SQLite):**
  - [x] Installed necessary dependencies (`drizzle-orm`, `@libsql/client`, `drizzle-kit`).
  - [x] Configured `drizzle.config.ts` for SQLite.
  - [x] Defined database schema (`server/db/schema.ts`) for `supermarkets` and `products` tables, compatible with SQLite.
  - [x] Updated Drizzle client utility (`server/utils/db.ts`) for SQLite.
- [x] **Database Migrations:**
  - [x] Generated initial SQLite migration using `drizzle-kit generate`.
  - [x] Applied migration using `drizzle-kit migrate` to create the database file and tables.
- [x] **Data Ingestion:**
  - [x] Created data ingestion script (`scripts/ingest-data.ts`) to read `data/supermarkets.json`.
  - [x] Implemented logic to parse JSON and map data to database schema.
  - [x] Added check for existing supermarkets to avoid duplicates.
  - [x] Implemented batch insertion for products to handle large datasets and avoid SQLite variable limits.
  - [x] Added `onConflictDoNothing` for product links to handle potential duplicates gracefully.
  - [x] Successfully ingested supermarket and product data into the SQLite database.

## To-Do List

- [x] Core CRUD functionality (`composables/useToDos.ts`).
- [x] Basic UI (`pages/to-do.vue`) with pending/completed lists.
- [x] Input form for adding new tasks.
- [x] Header integration with context menu for clearing list.
- [x] Confirmation modal for clearing all tasks.
- [x] Due date selection using `DatePicker` component and modal.
- [x] File attachment functionality (storing file data URL).
- [x] Display attachment info (name, size) and allow removal.
- [x] PDF Attachment Preview:
  - [x] Added `vue-pdf-embed` library.
  - [x] Implemented a preview button for PDF attachments.
  - [x] Added a modal to display the embedded PDF viewer.

## Other

## Planning & Calendar

- [x] **To-Do List (`/to-do`)**:
  - [x] Create basic To-Do page (`pages/to-do.vue`).
  - [x] Create `useToDos` composable for state management.
  - [x] Implement adding, toggling, deleting todos.
  - [x] Persist state using `useLocalStorage`.
  - [x] Add context menu for clearing all todos.
  - [x] Implement date picker for setting due dates (`v-calendar`).
  - [x] Implement file attachments (storing file data in localStorage).
  - [x] Implement PDF preview modal using `vue-pdf-embed`.
  - [x] Sort pending todos by due date.
- [ ] **Birthdays (`/birthdays`)**:
  - [ ] Create page and basic UI.
  - [ ] Create `useBirthdays` composable.
  - [ ] Implement adding/editing/deleting birthdays.
  - [ ] Persist state.
  - [ ] Display upcoming birthdays.
- [x] **Holiday Checklist (`/holiday`)**:
  - [x] Create Holiday Checklist page (`pages/holiday/index.vue`).
  - [x] Create `useHoliday` composable for state management with `useLocalStorage`.
  - [x] Implement adding, toggling (checking), and deleting items.
  - [x] Define default checklist items and categories.
  - [x] Group items by category in the UI.
  - [x] Add modal for creating new checklist items.
  - [x] Add emojis to category definitions and display them in UI.
  - [x] Add navigation link in `NavigationSlideover.vue`.

## Recipes (`recipes-prd.md`)

### Features Checklist

#### 4.1 Recipe Input & Parsing

- [x] **URL Input:**
  - [x] UI for pasting URL (`components/AddRecipeModal.vue`, integrated into `pages/recipes/index.vue`).
  - [x] Server API endpoint (`server/api/recipe/url.post.ts`) to fetch URL content.
  - [x] LLM integration for parsing fetched HTML content.
- [x] **YouTube URL Input:**
  - [x] UI for pasting YouTube URL.
  - [x] Server API endpoint to fetch transcript.
  - [x] Improved server API endpoint (`server/api/recipe/youtube.post.ts`) to handle shortened `youtu.be/` URLs.
  - [x] LLM integration for parsing transcript.
- [x] **Image Input:**
  - [x] UI for uploading image.
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

- [x] **Weekly Planner View:**
  - [x] UI Component for calendar/list view (`pages/planner.vue`).
  - [x] Display days of the week, starting from the upcoming Monday.
  - [x] Updated date format to show full month name (`pages/planner.vue`).
  - [x] Refactored recipe adding UI in `pages/planner.vue` for better alignment and button placement.
  - [x] Refactored `UCard` to use standard `div` elements for simplicity in `pages/planner.vue`.
- [x] **Scheduling:**
  - [x] UI for assigning recipes to days (e.g., drag-and-drop, selection).
  - [ ] Define database schema for `ScheduledMeal` model.
- [x] **Display Scheduled Meals:** Show assigned recipes in the planner view and on the Home page (`pages/index.vue`).

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
  - [x] **AI-driven Cleanup:** Implemented `/api/shopping-list/clean-up` endpoint using AI to merge, standardize, and categorize items.
  - [x] Integrated AI cleanup call into `pages/planner.vue` after adding all ingredients.
- [x] **Portion Scaling Integration (Client-side):** Ensure generated list quantities reflect scheduled meal portions.
- [x] **Ingredient Categories:**
  - [x] Updated `types/recipe.ts` with refined ingredient categories (e.g., replaced 'Produce' with 'Fruit'/'Vegetables', added 'Alcohol').
  - [x] Added `category` field to `types/shopping-list.ts` (`ShoppingListItem` interface).
  - [x] Updated `composables/useShoppingList.ts` to include category when adding items.
- [x] **Shopping List UI Enhancements (`components/ShoppingList.vue`):**
  - [x] Grouped items by category, respecting the defined order.
  - [x] Added relevant emojis to category headers.
  - [x] Updated UI in `pages/shopping-list/index.vue` to group by Supermarket -> Category.
  - [x] Added total price calculation per supermarket group.
  - [x] Included supermarket icons in group headers.
- [-] **Price Fetching:**
  - [-] Server API endpoint(s) to fetch prices from supported supermarkets (AH, Jumbo, Lidl, Plus). (Initial AI-based implementation added)
  - [x] Moved price fetching logic (`fetchCheapestProducts`) into `composables/useShoppingList.ts`.
  - [x] Automated price fetching after AI list cleanup (`optimizeAndFetchPrices` in `useShoppingList.ts`).
  - [x] Removed manual "Prijzen ophalen" button from `pages/shopping-list/index.vue`.
- [-] **Cheapest Option Calculation:**
  - [-] Server API logic to calculate cheapest overall basket. (Initial AI-based implementation added to `find-cheapest.post.ts`)
  - [x] Server API logic to calculate cheapest overall basket (AI integration with `gpt-4o-mini` in `server/api/shopping-list/find-cheapest.post.ts` using Vercel AI SDK and Zod).
  - [x] Added support for filtering by selected supermarkets (`useOnboardingSettings`) in `find-cheapest.post.ts`.
  - [x] Define `Product` interface in `types/shopping-list.ts` for consistency.
- [x] **Price Display:**
  - [x] UI (`components/ShoppingList.vue`) to display price per item/supermarket.
  - [x] Display total estimated cost per store / cheapest option.
  - [x] Implemented grand total display in `pages/shopping-list/index.vue` and `components/ShoppingList.vue`.
  - [x] Displayed cheapest price info (price, supermarket, amount) per item in `pages/shopping-list/index.vue`.
- [x] **List Management:**
  - [x] UI (`components/ShoppingList.vue`) for checking off items.
  - [x] UI (`components/ShoppingList.vue`) for deleting items.
  - [x] UI (`components/ShoppingList.vue`) for clearing the list.
  - [x] **Manual Add:**
    - [x] Added "Voeg boodschappen toe" button in fixed bottom bar (`pages/shopping-list/index.vue`).
    - [x] Implemented modal (`UModal`) with textarea for multi-line text input.
    - [x] Created new API endpoint (`/api/shopping-list/standardize-text`) to parse/standardize raw text using AI.
    - [x] Updated `useShoppingList.ts` (`addItemsFromText`) to call the new endpoint, manage loading state (`isStandardizingItems`), and merge standardized items.
    - [x] Updated shopping list modal to use loading state for the add button.
    - [x] Fixed multi-line placeholder formatting in the textarea (`&#10;`).
  - [x] **Copy to Clipboard:**
    - [x] Added context menu to shopping list page header.
    - [x] Implemented "Kopieer lijst" button to copy unchecked items to clipboard.
  - [x] **View Mode Toggle:**
    - [x] Added `UToggle` to `pages/shopping-list/index.vue` to switch between views.
    - [x] Implemented conditional rendering: group by supermarket/category (with prices) vs. group by category only (no prices).

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
- **`AddRecipeModal.vue`**: Corrected Zod parsing logic to handle the direct recipe object returned by the `/api/recipe/url`
- **`USelectMenu`**: Fixed dropdown being clipped in the meal planner by removing `overflow-hidden` from the parent card container.

## Feature: Meal Planning

Created `pages/planner.vue` with a 7-day weekly view using `UCard`.
Created `composables/useMealPlanner.ts` with `useStorage` for persistent state.
Integrated `useRecipes` to provide recipes for selection.
Implemented `USelectMenu` for choosing recipes and buttons for adding/removing meals per day.
Used `useHeaderState` to set the page title ("Maaltijdplanner").
Translated UI elements to Dutch.

## Changelog

- Refactored Meal Planner UI: Moved recipe selection and portions input to the card header for a cleaner layout.
- Created reusable `PortionSelector.vue` component and integrated it into `pages/planner.vue`. The planner now defaults portion selection to the recipe's original portion count.
- Refactored the meal planner page (`pages/planner.vue`):
  - Moved recipe selection controls to the bottom section, visible only when no meal is planned.
  - Replaced individual meal removal buttons with a single 'X' button in the top-right corner of the day card when a meal is planned.
  - Hid the entire bottom section of the day card when a meal is planned.

### Planner Page

- Updated the UI for scheduled meal days: displays recipe image as background with overlay, changes text to white, and hides add controls.
- Removed the 'Nog geen maaltijden gepland.' message when no meals are scheduled for a day.

## Meal Planner (`planner-prd.md`)

- [x] **Weekly Planner View:**
  - [x] UI Component for calendar/list view (`pages/planner.vue`).
  - [x] Display days of the week, starting from the upcoming Monday.
  - [x] Updated date format to show full month name (`pages/planner.vue`).
  - [x] Refactored recipe adding UI in `pages/planner.vue` for better alignment and button placement.
  - [x] Refactored `UCard` to use standard `div` elements for simplicity in `pages/planner.vue`.
  - [x] Reordered elements in the planner day card header: moved Add Recipe controls before Day/Date info.

### Changed

- Adjusted the layout of meal cards in the planner page (`pages/planner.vue`):
  - Moved the planned meal title to the bottom-right corner.
  - Increased the font size of the planned meal title.
  - Ensured the remove button position remains consistent when visible.

* Fixed `USelectMenu` dropdown clipping issue in the meal planner by setting popper strategy to `fixed`.
* Conditionally applied `relative` positioning to planner day cards only when a meal is present, aiming to fix `USelectMenu` overlap.

### Meal Planner UI Refactor

- Replaced inline recipe selection with a modal (`UModal`) triggered by a 'Plan maaltijd' button on each day card in `pages/planner.vue`.
- Removed the separate `MealPlannerModal.vue` component and integrated its functionality directly into `pages/planner.vue`.
- Updated state management in `pages/planner.vue` to handle the modal's data and visibility.
- Aligned the "Plan maaltijd" button vertically with the date/day text using `sm:items-center`.
- Removed the placeholder text ("Klik op 'plan maaltijd'...") from empty day cards.

## Development Progress Changelog

- Added functionality to show the next available scheduled meal on the homepage if no meal is planned for the current day.
- Added a fixed bottom button to the Meal Planner page (`pages/planner.vue`).
- This button allows users to add all ingredients from the currently displayed week's planned meals directly to the shopping list.
- Ingredients are automatically scaled based on the planned portions for each meal.
- User feedback is provided via toast notifications.

## Database & Data Ingestion

- [x] **Database Setup:**
  - [x] Researched PostgreSQL and SQLite options.
  - [x] Attempted PostgreSQL setup with Docker/OrbStack (encountered authentication issues).
  - [x] Switched to SQLite for local development.
- [x] **Drizzle ORM Integration (SQLite):**
  - [x] Installed necessary dependencies (`drizzle-orm`, `@libsql/client`, `drizzle-kit`).
  - [x] Configured `drizzle.config.ts` for SQLite.
  - [x] Defined database schema (`server/db/schema.ts`) for `supermarkets` and `products` tables, compatible with SQLite.
  - [x] Updated Drizzle client utility (`server/utils/db.ts`) for SQLite.
- [x] **Database Migrations:**
  - [x] Generated initial SQLite migration using `drizzle-kit generate`.
  - [x] Applied migration using `drizzle-kit migrate` to create the database file and tables.
- [x] **Data Ingestion:**
  - [x] Created data ingestion script (`scripts/ingest-data.ts`) to read `data/supermarkets.json`.
  - [x] Implemented logic to parse JSON and map data to database schema.
  - [x] Added check for existing supermarkets to avoid duplicates.
  - [x] Implemented batch insertion for products to handle large datasets and avoid SQLite variable limits.
  - [x] Added `onConflictDoNothing` for product links to handle potential duplicates gracefully.
  - [x] Successfully ingested supermarket and product data into the SQLite database.

## To-Do List

- [x] Core CRUD functionality (`composables/useToDos.ts`).
- [x] Basic UI (`pages/to-do.vue`) with pending/completed lists.
- [x] Input form for adding new tasks.
- [x] Header integration with context menu for clearing list.
- [x] Confirmation modal for clearing all tasks.
- [x] Due date selection using `DatePicker` component and modal.
- [x] File attachment functionality (storing file data URL).
- [x] Display attachment info (name, size) and allow removal.
- [x] PDF Attachment Preview:
  - [x] Added `vue-pdf-embed` library.
  - [x] Implemented a preview button for PDF attachments.
  - [x] Added a modal to display the embedded PDF viewer.

## Other

## Planning & Calendar

- [x] **To-Do List (`/to-do`)**:
  - [x] Create basic To-Do page (`pages/to-do.vue`).
  - [x] Create `useToDos` composable for state management.
  - [x] Implement adding, toggling, deleting todos.
  - [x] Persist state using `useLocalStorage`.
  - [x] Add context menu for clearing all todos.
  - [x] Implement date picker for setting due dates (`v-calendar`).
  - [x] Implement file attachments (storing file data in localStorage).
  - [x] Implement PDF preview modal using `vue-pdf-embed`.
  - [x] Sort pending todos by due date.
- [ ] **Birthdays (`/birthdays`)**:
  - [ ] Create page and basic UI.
  - [ ] Create `useBirthdays` composable.
  - [ ] Implement adding/editing/deleting birthdays.
  - [ ] Persist state.
  - [ ] Display upcoming birthdays.
- [x] **Holiday Checklist (`/holiday`)**:
  - [x] Create Holiday Checklist page (`pages/holiday/index.vue`).
  - [x] Create `useHoliday` composable for state management with `useLocalStorage`.
  - [x] Implement adding, toggling (checking), and deleting items.
  - [x] Define default checklist items and categories.
  - [x] Group items by category in the UI.
  - [x] Add modal for creating new checklist items.
  - [x] Add emojis to category definitions and display them in UI.
  - [x] Add navigation link in `NavigationSlideover.vue`.

## Recipes (`recipes-prd.md`)

### Features Checklist

#### 4.1 Recipe Input & Parsing

- [x] **URL Input:**
  - [x] UI for pasting URL (`components/AddRecipeModal.vue`, integrated into `pages/recipes/index.vue`).
  - [x] Server API endpoint (`server/api/recipe/url.post.ts`) to fetch URL content.
  - [x] LLM integration for parsing fetched HTML content.
- [x] **YouTube URL Input:**
  - [x] UI for pasting YouTube URL.
  - [x] Server API endpoint to fetch transcript.
  - [x] Improved server API endpoint (`server/api/recipe/youtube.post.ts`) to handle shortened `youtu.be/` URLs.
  - [x] LLM integration for parsing transcript.
- [x] **Image Input:**
  - [x] UI for uploading image.
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

- [x] **Weekly Planner View:**
  - [x] UI Component for calendar/list view (`pages/planner.vue`).
  - [x] Display days of the week, starting from the upcoming Monday.
  - [x] Updated date format to show full month name (`pages/planner.vue`).
  - [x] Refactored recipe adding UI in `pages/planner.vue` for better alignment and button placement.
  - [x] Refactored `UCard` to use standard `div` elements for simplicity in `pages/planner.vue`.
- [x] **Scheduling:**
  - [x] UI for assigning recipes to days (e.g., drag-and-drop, selection).
  - [ ] Define database schema for `ScheduledMeal` model.
- [x] **Display Scheduled Meals:** Show assigned recipes in the planner view and on the Home page (`pages/index.vue`).

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
  - [x] **AI-driven Cleanup:** Implemented `/api/shopping-list/clean-up` endpoint using AI to merge, standardize, and categorize items.
  - [x] Integrated AI cleanup call into `pages/planner.vue` after adding all ingredients.
- [x] **Portion Scaling Integration (Client-side):** Ensure generated list quantities reflect scheduled meal portions.
- [x] **Ingredient Categories:**
  - [x] Updated `types/recipe.ts` with refined ingredient categories (e.g., replaced 'Produce' with 'Fruit'/'Vegetables', added 'Alcohol').
  - [x] Added `category` field to `types/shopping-list.ts` (`ShoppingListItem` interface).
  - [x] Updated `composables/useShoppingList.ts` to include category when adding items.
- [x] **Shopping List UI Enhancements (`components/ShoppingList.vue`):**
  - [x] Grouped items by category, respecting the defined order.
  - [x] Added relevant emojis to category headers.
  - [x] Updated UI in `pages/shopping-list/index.vue` to group by Supermarket -> Category.
  - [x] Added total price calculation per supermarket group.
  - [x] Included supermarket icons in group headers.
- [-] **Price Fetching:**
  - [-] Server API endpoint(s) to fetch prices from supported supermarkets (AH, Jumbo, Lidl, Plus). (Initial AI-based implementation added)
  - [x] Moved price fetching logic (`fetchCheapestProducts`) into `composables/useShoppingList.ts`.
  - [x] Automated price fetching after AI list cleanup (`optimizeAndFetchPrices` in `useShoppingList.ts`).
  - [x] Removed manual "Prijzen ophalen" button from `pages/shopping-list/index.vue`.
- [-] **Cheapest Option Calculation:**
  - [-] Server API logic to calculate cheapest overall basket. (Initial AI-based implementation added to `find-cheapest.post.ts`)
  - [x] Server API logic to calculate cheapest overall basket (AI integration with `gpt-4o-mini` in `server/api/shopping-list/find-cheapest.post.ts` using Vercel AI SDK and Zod).
  - [x] Added support for filtering by selected supermarkets (`useOnboardingSettings`) in `find-cheapest.post.ts`.
  - [x] Define `Product` interface in `types/shopping-list.ts` for consistency.
- [x] **Price Display:**
  - [x] UI (`components/ShoppingList.vue`) to display price per item/supermarket.
  - [x] Display total estimated cost per store / cheapest option.
  - [x] Implemented grand total display in `pages/shopping-list/index.vue` and `components/ShoppingList.vue`.
  - [x] Displayed cheapest price info (price, supermarket, amount) per item in `pages/shopping-list/index.vue`.
- [x] **List Management:**
  - [x] UI (`components/ShoppingList.vue`) for checking off items.
  - [x] UI (`components/ShoppingList.vue`) for deleting items.
  - [x] UI (`components/ShoppingList.vue`) for clearing the list.
  - [x] **Manual Add:**
    - [x] Added "Voeg boodschappen toe" button in fixed bottom bar (`pages/shopping-list/index.vue`).
    - [x] Implemented modal (`UModal`) with textarea for multi-line text input.
    - [x] Created new API endpoint (`/api/shopping-list/standardize-text`) to parse/standardize raw text using AI.
    - [x] Updated `useShoppingList.ts` (`addItemsFromText`) to call the new endpoint, manage loading state (`isStandardizingItems`), and merge standardized items.
    - [x] Updated shopping list modal to use loading state for the add button.
    - [x] Fixed multi-line placeholder formatting in the textarea (`&#10;`).
  - [x] **Copy to Clipboard:**
    - [x] Added context menu to shopping list page header.
    - [x] Implemented "Kopieer lijst" button to copy unchecked items to clipboard.
  - [x] **View Mode Toggle:**
    - [x] Added `UToggle` to `pages/shopping-list/index.vue` to switch between views.
    - [x] Implemented conditional rendering: group by supermarket/category (with prices) vs. group by category only (no prices).

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
- **`AddRecipeModal.vue`**: Corrected Zod parsing logic to handle the direct recipe object returned by the `/api/recipe/url`
- **`USelectMenu`**: Fixed dropdown being clipped in the meal planner by removing `overflow-hidden` from the parent card container.

## Feature: Meal Planning

Created `pages/planner.vue` with a 7-day weekly view using `UCard`.
Created `composables/useMealPlanner.ts` with `useStorage` for persistent state.
Integrated `useRecipes` to provide recipes for selection.
Implemented `USelectMenu` for choosing recipes and buttons for adding/removing meals per day.
Used `useHeaderState` to set the page title ("Maaltijdplanner").
Translated UI elements to Dutch.

## Changelog

- Refactored Meal Planner UI: Moved recipe selection and portions input to the card header for a cleaner layout.
- Created reusable `PortionSelector.vue` component and integrated it into `pages/planner.vue`. The planner now defaults portion selection to the recipe's original portion count.
- Refactored the meal planner page (`pages/planner.vue`):
  - Moved recipe selection controls to the bottom section, visible only when no meal is planned.
  - Replaced individual meal removal buttons with a single 'X' button in the top-right corner of the day card when a meal is planned.
  - Hid the entire bottom section of the day card when a meal is planned.

### Planner Page

- Updated the UI for scheduled meal days: displays recipe image as background with overlay, changes text to white, and hides add controls.
- Removed the 'Nog geen maaltijden gepland.' message when no meals are scheduled for a day.

## Meal Planner (`planner-prd.md`)

- [x] **Weekly Planner View:**
  - [x] UI Component for calendar/list view (`pages/planner.vue`).
  - [x] Display days of the week, starting from the upcoming Monday.
  - [x] Updated date format to show full month name (`pages/planner.vue`).
  - [x] Refactored recipe adding UI in `pages/planner.vue` for better alignment and button placement.
  - [x] Refactored `UCard` to use standard `div` elements for simplicity in `pages/planner.vue`.
  - [x] Reordered elements in the planner day card header: moved Add Recipe controls before Day/Date info.

### Changed

- Adjusted the layout of meal cards in the planner page (`pages/planner.vue`):
  - Moved the planned meal title to the bottom-right corner.
  - Increased the font size of the planned meal title.
  - Ensured the remove button position remains consistent when visible.

* Fixed `USelectMenu` dropdown clipping issue in the meal planner by setting popper strategy to `fixed`.
* Conditionally applied `relative` positioning to planner day cards only when a meal is present, aiming to fix `USelectMenu` overlap.

### Meal Planner UI Refactor

- Replaced inline recipe selection with a modal (`UModal`) triggered by a 'Plan maaltijd' button on each day card in `pages/planner.vue`.
- Removed the separate `MealPlannerModal.vue` component and integrated its functionality directly into `pages/planner.vue`.
- Updated state management in `pages/planner.vue` to handle the modal's data and visibility.
- Aligned the "Plan maaltijd" button vertically with the date/day text using `sm:items-center`.
- Removed the placeholder text ("Klik op 'plan maaltijd'...") from empty day cards.

## Development Progress Changelog

- Added functionality to show the next available scheduled meal on the homepage if no meal is planned for the current day.
- Added a fixed bottom button to the Meal Planner page (`pages/planner.vue`).
- This button allows users to add all ingredients from the currently displayed week's planned meals directly to the shopping list.
- Ingredients are automatically scaled based on the planned portions for each meal.
- User feedback is provided via toast notifications.

## Database & Data Ingestion

- [x] **Database Setup:**
  - [x] Researched PostgreSQL and SQLite options.
  - [x] Attempted PostgreSQL setup with Docker/OrbStack (encountered authentication issues).
  - [x] Switched to SQLite for local development.
- [x] **Drizzle ORM Integration (SQLite):**
  - [x] Installed necessary dependencies (`drizzle-orm`, `@libsql/client`, `drizzle-kit`).
  - [x] Configured `drizzle.config.ts` for SQLite.
  - [x] Defined database schema (`server/db/schema.ts`) for `supermarkets` and `products` tables, compatible with SQLite.
  - [x] Updated Drizzle client utility (`server/utils/db.ts`) for SQLite.
- [x] **Database Migrations:**
  - [x] Generated initial SQLite migration using `drizzle-kit generate`.
  - [x] Applied migration using `drizzle-kit migrate` to create the database file and tables.
- [x] **Data Ingestion:**
  - [x] Created data ingestion script (`scripts/ingest-data.ts`) to read `data/supermarkets.json`.
  - [x] Implemented logic to parse JSON and map data to database schema.
  - [x] Added check for existing supermarkets to avoid duplicates.
  - [x] Implemented batch insertion for products to handle large datasets and avoid SQLite variable limits.
  - [x] Added `onConflictDoNothing` for product links to handle potential duplicates gracefully.
  - [x] Successfully ingested supermarket and product data into the SQLite database.

## To-Do List

- [x] Core CRUD functionality (`composables/useToDos.ts`).
- [x] Basic UI (`pages/to-do.vue`) with pending/completed lists.
- [x] Input form for adding new tasks.
- [x] Header integration with context menu for clearing list.
- [x] Confirmation modal for clearing all tasks.
- [x] Due date selection using `DatePicker` component and modal.
- [x] File attachment functionality (storing file data URL).
- [x] Display attachment info (name, size) and allow removal.
- [x] PDF Attachment Preview:
  - [x] Added `vue-pdf-embed` library.
  - [x] Implemented a preview button for PDF attachments.
  - [x] Added a modal to display the embedded PDF viewer.

## Other

## Planning & Calendar

- [x] **To-Do List (`/to-do`)**:
  - [x] Create basic To-Do page (`pages/to-do.vue`).
  - [x] Create `useToDos` composable for state management.
  - [x] Implement adding, toggling, deleting todos.
  - [x] Persist state using `useLocalStorage`.
  - [x] Add context menu for clearing all todos.
  - [x] Implement date picker for setting due dates (`v-calendar`).
  - [x] Implement file attachments (storing file data in localStorage).
  - [x] Implement PDF preview modal using `vue-pdf-embed`.
  - [x] Sort pending todos by due date.
- [ ] **Birthdays (`/birthdays`)**:
  - [ ] Create page and basic UI.
  - [ ] Create `useBirthdays` composable.
  - [ ] Implement adding/editing/deleting birthdays.
  - [ ] Persist state.
  - [ ] Display upcoming birthdays.
- [x] **Holiday Checklist (`/holiday`)**:
  - [x] Create Holiday Checklist page (`pages/holiday/index.vue`).
  - [x] Create `useHoliday` composable for state management with `useLocalStorage`.
  - [x] Implement adding, toggling (checking), and deleting items.
  - [x] Define default checklist items and categories.
  - [x] Group items by category in the UI.
  - [x] Add modal for creating new checklist items.
  - [x] Add emojis to category definitions and display them in UI.
  - [x] Add navigation link in `NavigationSlideover.vue`.

## Recipes (`recipes-prd.md`)

### Features Checklist

#### 4.1 Recipe Input & Parsing

- [x] **URL Input:**
  - [x] UI for pasting URL (`components/AddRecipeModal.vue`, integrated into `pages/recipes/index.vue`).
  - [x] Server API endpoint (`server/api/recipe/url.post.ts`) to fetch URL content.
  - [x] LLM integration for parsing fetched HTML content.
- [x] **YouTube URL Input:**
  - [x] UI for pasting YouTube URL.
  - [x] Server API endpoint to fetch transcript.
  - [x] Improved server API endpoint (`server/api/recipe/youtube.post.ts`) to handle shortened `youtu.be/` URLs.
  - [x] LLM integration for parsing transcript.
- [x] **Image Input:**
  - [x] UI for uploading image.
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

- [x] **Weekly Planner View:**
  - [x] UI Component for calendar/list view (`pages/planner.vue`).
  - [x] Display days of the week, starting from the upcoming Monday.
  - [x] Updated date format to show full month name (`pages/planner.vue`).
  - [x] Refactored recipe adding UI in `pages/planner.vue` for better alignment and button placement.
  - [x] Refactored `UCard` to use standard `div` elements for simplicity in `pages/planner.vue`.
- [x] **Scheduling:**
  - [x] UI for assigning recipes to days (e.g., drag-and-drop, selection).
  - [ ] Define database schema for `ScheduledMeal` model.
- [x] **Display Scheduled Meals:** Show assigned recipes in the planner view and on the Home page (`pages/index.vue`).

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
  - [x] **AI-driven Cleanup:** Implemented `/api/shopping-list/clean-up` endpoint using AI to merge, standardize, and categorize items.
  - [x] Integrated AI cleanup call into `pages/planner.vue` after adding all ingredients.
- [x] **Portion Scaling Integration (Client-side):** Ensure generated list quantities reflect scheduled meal portions.
- [x] **Ingredient Categories:**
  - [x] Updated `types/recipe.ts` with refined ingredient categories (e.g., replaced 'Produce' with 'Fruit'/'Vegetables', added 'Alcohol').
  - [x] Added `category` field to `types/shopping-list.ts` (`ShoppingListItem` interface).
  - [x] Updated `composables/useShoppingList.ts` to include category when adding items.
- [x] **Shopping List UI Enhancements (`components/ShoppingList.vue`):**
  - [x] Grouped items by category, respecting the defined order.
  - [x] Added relevant emojis to category headers.
  - [x] Updated UI in `pages/shopping-list/index.vue` to group by Supermarket -> Category.
  - [x] Added total price calculation per supermarket group.
  - [x] Included supermarket icons in group headers.
- [-] **Price Fetching:**
  - [-] Server API endpoint(s) to fetch prices from supported supermarkets (AH, Jumbo, Lidl, Plus). (Initial AI-based implementation added)
  - [x] Moved price fetching logic (`fetchCheapestProducts`) into `composables/useShoppingList.ts`.
  - [x] Automated price fetching after AI list cleanup (`optimizeAndFetchPrices` in `useShoppingList.ts`).
  - [x] Removed manual "Prijzen ophalen" button from `pages/shopping-list/index.vue`.
- [-] **Cheapest Option Calculation:**
  - [-] Server API logic to calculate cheapest overall basket. (Initial AI-based implementation added to `find-cheapest.post.ts`)
  - [x] Server API logic to calculate cheapest overall basket (AI integration with `gpt-4o-mini` in `server/api/shopping-list/find-cheapest.post.ts` using Vercel AI SDK and Zod).
  - [x] Added support for filtering by selected supermarkets (`useOnboardingSettings`) in `find-cheapest.post.ts`.
  - [x] Define `Product` interface in `types/shopping-list.ts` for consistency.
- [x] **Price Display:**
  - [x] UI (`components/ShoppingList.vue`) to display price per item/supermarket.
  - [x] Display total estimated cost per store / cheapest option.
  - [x] Implemented grand total display in `pages/shopping-list/index.vue` and `components/ShoppingList.vue`.
  - [x] Displayed cheapest price info (price, supermarket, amount) per item in `pages/shopping-list/index.vue`.
- [x] **List Management:**
  - [x] UI (`components/ShoppingList.vue`) for checking off items.
  - [x] UI (`components/ShoppingList.vue`) for deleting items.
  - [x] UI (`components/ShoppingList.vue`) for clearing the list.
  - [x] **Manual Add:**
    - [x] Added "Voeg boodschappen toe" button in fixed bottom bar (`pages/shopping-list/index.vue`).
    - [x] Implemented modal (`UModal`) with textarea for multi-line text input.
    - [x] Created new API endpoint (`/api/shopping-list/standardize-text`) to parse/standardize raw text using AI.
    - [x] Updated `useShoppingList.ts` (`addItemsFromText`) to call the new endpoint, manage loading state (`isStandardizingItems`), and merge standardized items.
    - [x] Updated shopping list modal to use loading state for the add button.
    - [x] Fixed multi-line placeholder formatting in the textarea (`&#10;`).
  - [x] **Copy to Clipboard:**
    - [x] Added context menu to shopping list page header.
    - [x] Implemented "Kopieer lijst" button to copy unchecked items to clipboard.
  - [x] **View Mode Toggle:**
    - [x] Added `UToggle` to `pages/shopping-list/index.vue` to switch between views.
    - [x] Implemented conditional rendering: group by supermarket/category (with prices) vs. group by category only (no prices).

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
- **`AddRecipeModal.vue`**: Corrected Zod parsing logic to handle the direct recipe object returned by the `/api/recipe/url`
- **`USelectMenu`**: Fixed dropdown being clipped in the meal planner by removing `overflow-hidden` from the parent card container.

## Feature: Meal Planning

Created `pages/planner.vue` with a 7-day weekly view using `UCard`.
Created `composables/useMealPlanner.ts` with `useStorage` for persistent state.
Integrated `useRecipes` to provide recipes for selection.
Implemented `USelectMenu` for choosing recipes and buttons for adding/removing meals per day.
Used `useHeaderState` to set the page title ("Maaltijdplanner").
Translated UI elements to Dutch.

## Changelog

- Refactored Meal Planner UI: Moved recipe selection and portions input to the card header for a cleaner layout.
- Created reusable `PortionSelector.vue` component and integrated it into `pages/planner.vue`. The planner now defaults portion selection to the recipe's original portion count.
- Refactored the meal planner page (`pages/planner.vue`):
  - Moved recipe selection controls to the bottom section, visible only when no meal is planned.
  - Replaced individual meal removal buttons with a single 'X' button in the top-right corner of the day card when a meal is planned.
  - Hid the entire bottom section of the day card when a meal is planned.

### Planner Page

- Updated the UI for scheduled meal days: displays recipe image as background with overlay, changes text to white, and hides add controls.
- Removed the 'Nog geen maaltijden gepland.' message when no meals are scheduled for a day.

## Meal Planner (`planner-prd.md`)

- [x] **Weekly Planner View:**
  - [x] UI Component for calendar/list view (`pages/planner.vue`).
  - [x] Display days of the week, starting from the upcoming Monday.
  - [x] Updated date format to show full month name (`pages/planner.vue`).
  - [x] Refactored recipe adding UI in `pages/planner.vue` for better alignment and button placement.
  - [x] Refactored `UCard` to use standard `div` elements for simplicity in `pages/planner.vue`.
  - [x] Reordered elements in the planner day card header: moved Add Recipe controls before Day/Date info.

### Changed

- Adjusted the layout of meal cards in the planner page (`pages/planner.vue`):
  - Moved the planned meal title to the bottom-right corner.
  - Increased the font size of the planned meal title.
  - Ensured the remove button position remains consistent when visible.

* Fixed `USelectMenu` dropdown clipping issue in the meal planner by setting popper strategy to `fixed`.
* Conditionally applied `relative` positioning to planner day cards only when a meal is present, aiming to fix `USelectMenu` overlap.

### Meal Planner UI Refactor

- Replaced inline recipe selection with a modal (`UModal`) triggered by a 'Plan maaltijd' button on each day card in `pages/planner.vue`.
- Removed the separate `MealPlannerModal.vue` component and integrated its functionality directly into `pages/planner.vue`.
- Updated state management in `pages/planner.vue` to handle the modal's data and visibility.
- Aligned the "Plan maaltijd" button vertically with the date/day text using `sm:items-center`.
- Removed the placeholder text ("Klik op 'plan maaltijd'...") from empty day cards.

## Development Progress Changelog

- Added functionality to show the next available scheduled meal on the homepage if no meal is planned for the current day.
- Added a fixed bottom button to the Meal Planner page (`pages/planner.vue`).
- This button allows users to add all ingredients from the currently displayed week's planned meals directly to the shopping list.
- Ingredients are automatically scaled based on the planned portions for each meal.
- User feedback is provided via toast notifications.

## Database & Data Ingestion

- [x] **Database Setup:**
  - [x] Researched PostgreSQL and SQLite options.
  - [x] Attempted PostgreSQL setup with Docker/OrbStack (encountered authentication issues).
  - [x] Switched to SQLite for local development.
- [x] **Drizzle ORM Integration (SQLite):**
  - [x] Installed necessary dependencies (`drizzle-orm`, `@libsql/client`, `drizzle-kit`).
  - [x] Configured `drizzle.config.ts` for SQLite.
  - [x] Defined database schema (`server/db/schema.ts`) for `supermarkets` and `products` tables, compatible with SQLite.
  - [x] Updated Drizzle client utility (`server/utils/db.ts`) for SQLite.
- [x] **Database Migrations:**
  - [x] Generated initial SQLite migration using `drizzle-kit generate`.
  - [x] Applied migration using `drizzle-kit migrate` to create the database file and tables.
- [x] **Data Ingestion:**
  - [x] Created data ingestion script (`scripts/ingest-data.ts`) to read `data/supermarkets.json`.
  - [x] Implemented logic to parse JSON and map data to database schema.
  - [x] Added check for existing supermarkets to avoid duplicates.
  - [x] Implemented batch insertion for products to handle large datasets and avoid SQLite variable limits.
  - [x] Added `onConflictDoNothing` for product links to handle potential duplicates gracefully.
  - [x] Successfully ingested supermarket and product data into the SQLite database.

## To-Do List

- [x] Core CRUD functionality (`composables/useToDos.ts`).
- [x] Basic UI (`pages/to-do.vue`) with pending/completed lists.
- [x] Input form for adding new tasks.
- [x] Header integration with context menu for clearing list.
- [x] Confirmation modal for clearing all tasks.
- [x] Due date selection using `DatePicker` component and modal.
- [x] File attachment functionality (storing file data URL).
- [x] Display attachment info (name, size) and allow removal.
- [x] PDF Attachment Preview:
  - [x] Added `vue-pdf-embed` library.
  - [x] Implemented a preview button for PDF attachments.
  - [x] Added a modal to display the embedded PDF viewer.

## Other

## Planning & Calendar

- [x] **To-Do List (`/to-do`)**:
  - [x] Create basic To-Do page (`pages/to-do.vue`).
  - [x] Create `useToDos` composable for state management.
  - [x] Implement adding, toggling, deleting todos.
  - [x] Persist state using `useLocalStorage`.
  - [x] Add context menu for clearing all todos.
  - [x] Implement date picker for setting due dates (`v-calendar`).
  - [x] Implement file attachments (storing file data in localStorage).
  - [x] Implement PDF preview modal using `vue-pdf-embed`.
  - [x] Sort pending todos by due date.
- [ ] **Birthdays (`/birthdays`)**:
  - [ ] Create page and basic UI.
  - [ ] Create `useBirthdays` composable.
  - [ ] Implement adding/editing/deleting birthdays.
  - [ ] Persist state.
  - [ ] Display upcoming birthdays.
- [x] **Holiday Checklist (`/holiday`)**:
  - [x] Create Holiday Checklist page (`pages/holiday/index.vue`).
  - [x] Create `useHoliday` composable for state management with `useLocalStorage`.
  - [x] Implement adding, toggling (checking), and deleting items.
  - [x] Define default checklist items and categories.
  - [x] Group items by category in the UI.
  - [x] Add modal for creating new checklist items.
  - [x] Add emojis to category definitions and display them in UI.
  - [x] Add navigation link in `NavigationSlideover.vue`.
