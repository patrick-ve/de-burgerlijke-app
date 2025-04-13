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

## Recipes (`recipes-prd.md`)

### Core Components & Tests
- [x] `components/RecipeCard.vue`: Display basic recipe info.
- [x] `__tests__/RecipeCard.spec.ts`: Unit tests for `RecipeCard`.
- [x] `components/RecipeDetailView.vue`: Display full recipe details.
- [x] `__tests__/RecipeDetailView.spec.ts`: Unit tests for `RecipeDetailView`.
- [ ] `components/RecipeForm.vue`: Form for creating/editing recipes.
- [ ] `__tests__/RecipeForm.spec.ts`: Unit tests for `RecipeForm`.
- [ ] `components/RecipeList.vue`: Component to display multiple `RecipeCard`s with filtering/sorting/pagination.
- [ ] `__tests__/RecipeList.spec.ts`: Unit tests for `RecipeList`.

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
- [ ] **User Review & Edit:**
    - [ ] UI for reviewing parsed recipe data before saving.
    - [ ] Functionality to edit parsed fields.

#### 4.2 Recipe Management
- [ ] **Recipe Storage:**
    - [ ] Define database schema for `Recipe` model.
    - [ ] Server API endpoints for CRUD operations on recipes.
- [ ] **Recipe View (Detail):** (`components/RecipeDetailView.vue`)
    - [x] Display Title, Description, Metadata.
    - [x] Display Ingredients list.
    - [x] Display Steps list.
    - [x] Display Utensils list.
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