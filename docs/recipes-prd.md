# Product Requirements Document: Recipe & Grocery Planner App

## 1. Introduction

This document outlines the requirements for the Recipe & Grocery Planner App, a mobile application designed to help couples and households organize recipes, plan meals, manage grocery shopping efficiently, and gain insights into grocery pricing. The core functionality revolves around importing recipes, structuring them using AI, scheduling meals, generating shopping lists with price optimization, and viewing historical price trends.

## 2. Goals

- Simplify recipe collection and organization.
- Streamline meal planning for individuals and households.
- Automate grocery list generation based on planned meals.
- Provide an intuitive and user-friendly interface for recipe management and meal planning.
- Enhance the cooking experience with integrated timers.
- Empower users to make cost-effective grocery shopping decisions by providing price comparisons and historical data.
- Help users track and understand grocery price inflation over time.

## 3. User Stories

- **As a user, I want to** add a recipe from a website URL **so that** I can easily save recipes I find online.
- **As a user, I want to** add a recipe from a YouTube video URL **so that** I can save recipes from cooking videos.
- **As a user, I want to** add a recipe by uploading an image **so that** I can digitize recipes from physical copies or screenshots.
- **As a user, I want to** see recipes automatically structured into ingredients, steps, portions, utensils, and metadata **so that** the information is consistent and easy to read.
- **As a user, I want to** save my favorite recipes **so that** I can quickly access them later.
- **As a user, I want to** start an in-app timer for cooking steps that require specific timing **so that** I don't need a separate timer device.
- **As a user, I want to** mark cooking steps as complete **so that** I can track my progress while following a recipe.
- **As a user, I want to** schedule recipes for specific days of the week **so that** I can plan my meals in advance.
- **As a user, I want to** generate a shopping list based on my scheduled meals for the upcoming week **so that** I know exactly what ingredients to buy.
- **As a user, I want to** adjust the number of portions for a recipe **so that** the ingredient amounts in the recipe details and the shopping list update accordingly.
- **As a user, I want to** view and manage my scheduled meals in a calendar or weekly view **so that** I have a clear overview of my meal plan.
- **As a user concerned about budget, I want to** see the estimated total cost of my generated shopping list **so that** I can anticipate my grocery expenses.
- **As a user concerned about budget, I want to** see price options for items on my shopping list from different Dutch supermarkets **so that** I can find the cheapest place to buy them.
- **As a user concerned about inflation, I want to** view historical price trends for specific grocery items **so that** I can understand how prices have changed over time.
- **As a user, I want to** be able to select a preferred supermarket or find the overall cheapest combination for my shopping list **so that** I can optimize my shopping strategy.

## 4. Features & Requirements

### 4.1 Recipe Input & Parsing

- **URL Input:** Allow users to paste a URL pointing to a recipe webpage.
  - The system should attempt to fetch and parse the recipe content from the URL.
- **YouTube URL Input:** Allow users to paste a YouTube video URL.
  - The system should attempt to fetch the video's transcript (if available).
  - The transcript text will be processed by the LLM to extract recipe information.
- **Image Input:** Allow users to upload an image (e.g., photo, screenshot) containing a recipe.
  - The system should use OCR and an LLM to extract and structure the recipe content from the image.
- **LLM Parsing:**
  - Utilize a Large Language Model (LLM) to process the input (URL content, YouTube transcript, or image text).
  - The LLM must identify and structure the following components:
    - Recipe Title
    - Description/Metadata (e.g., source, prep time, cook time, cuisine type)
    - Number of Portions (default if not specified)
    - Ingredients (including quantity, unit, name)
    - Cooking Steps (numbered or ordered list)
    - Utensils/Equipment required.
  - Provide a mechanism for users to review and potentially edit the parsed recipe data for accuracy.

### 4.2 Recipe Management

- **Recipe Storage:** Store parsed recipes in a structured format associated with the user's account.
- **Recipe View:** Display recipes clearly, separating ingredients, steps, portions, utensils, and metadata.
- **Favorites:** Allow users to mark/unmark recipes as favorites. Provide a dedicated view for favorite recipes.
- **Portion Adjustment:** Users should be able to modify the number of portions for a saved recipe. Ingredient quantities should scale proportionally (where feasible).

### 4.3 Cooking Assistance

- **Step Timers:** Detect timed actions within cooking steps (e.g., "simmer for 10 minutes", "bake for 25 min").
  - Provide an interactive element (e.g., a button) next to timed steps to start an in-app timer.
  - Display the remaining time prominently.
  - Allow multiple timers to run concurrently if needed.
- **Step Completion:**
  - Display each cooking step as an item that can be marked as complete (e.g., with a checkbox).
  - Persist the completion status of steps for a given cooking session (or associate with the scheduled meal instance).

### 4.4 Meal Planning & Scheduling

- **Weekly Planner:** Provide a calendar or list view representing the days of the week.
- **Scheduling:** Allow users to drag-and-drop or assign saved recipes to specific dates/days.
- **Multiple Meals per Day:** (Optional - Future consideration) Allow scheduling for different meal times (breakfast, lunch, dinner).

### 4.5 Grocery List Generation & Pricing

- **List Creation:** Generate a consolidated grocery list based on all recipes scheduled for a defined upcoming period (e.g., the next 7 days).
- **Ingredient Aggregation:** Combine identical ingredients from different recipes, summing their quantities (respecting units). Standardize ingredient names where possible for price matching.
- **Portion Scaling:** Ensure ingredient quantities in the shopping list reflect the portion adjustments made by the user for each scheduled recipe.
- **Price Fetching:**
  - For items on the generated list, fetch current prices from supported Dutch supermarkets (e.g., Albert Heijn, Jumbo, Lidl, Plus).
  - Match standardized ingredients to supermarket product databases. Handle ambiguities or missing items gracefully.
- **Cheapest Option Calculation:**
  - Provide an option to calculate the cheapest overall basket based on the list across selected/all supported supermarkets.
  - Allow users to select preferred supermarkets for comparison.
- **Price Display:**
  - Display the price per item and per supermarket.
  - Show the estimated total cost for the list per selected supermarket and the cheapest overall option.
- **List Management:** Allow users to check off items as they shop, manually add items (including attempting to price match), and edit quantities. Prices should update accordingly.

### 4.6 Technical Specifications & Business Logic

- **Architecture:**
  - Mobile-first application built using Capacitor.js to target iOS and Android from a single Nuxt 3 codebase.
  - Client-side focused logic using Vue 3 Composition API and TypeScript.
  - Nuxt Server API (`server/api/`) will be used for:
    - Interfacing with the LLM for recipe parsing.
    - Interfacing with OCR services (if external).
    - Interfacing with YouTube services to fetch video transcripts.
    - Handling price data fetching and potentially aggregation logic from external supermarket sources/APIs.
    - User account management and data persistence (database interactions).
- **Key Technologies:**
  - **Frontend Framework:** Nuxt 3 / Vue 3
  - **Language:** TypeScript
  - **Mobile Wrapper:** Capacitor.js
  - **UI:** Nuxt UI / Tailwind CSS
  - **AI/ML:** Large Language Model (LLM) for recipe parsing, OCR for image input.
  - **External Services:** YouTube Transcript API (or similar mechanism).
  - **State Management:** Pinia (implied by Nuxt/Vue ecosystem best practices)
  - **Routing:** Vue Router (via Nuxt)
- **Data Models (Conceptual):**
  - **Recipe:** `id`, `userId`, `title`, `description`, `sourceUrl?`, `imageUrl?`, `portions`, `prepTime?`, `cookTime?`, `cuisineType?`, `ingredients[]`, `steps[]`, `utensils[]`, `isFavorite`.
  - **Ingredient:** `quantity`, `unit`, `name`, `originalText?`.
  - **Step:** `order`, `description`, `timerDuration?`, `isComplete?`.
  - **ScheduledMeal:** `id`, `userId`, `recipeId`, `date`, `portions`.
  - **ShoppingList:** `id`, `userId`, `startDate`, `endDate`, `items[]`, `status`.
  - **ShoppingListItem:** `ingredientName`, `standardizedName?`, `aggregatedQuantity`, `unit`, `isChecked`, `priceInfo[]?`.
  - **PriceInfo:** `supermarket`, `productId?`, `price`, `lastUpdated`.
- **Core Business Logic:**
  - **Recipe Parsing:** Input (URL/YouTube URL/Image) -> Fetch Content/Transcript/OCR -> LLM for structuring -> User review/save. Handles extraction of title, metadata, portions, ingredients (qty, unit, name), ordered steps, utensils. Requires specific handling for parsing natural language from transcripts vs. structured web content or OCR text.
  - **Portion Scaling:** When user adjusts portions on a recipe/scheduled meal, ingredient quantities are multiplied by `(newPortions / originalPortions)`. Logic needed to handle non-scalable units gracefully.
  - **Ingredient Aggregation:** Group items in the shopping list by `standardizedName` and `unit`. Sum `aggregatedQuantity`. Requires robust ingredient name standardization (e.g., "large onion" vs "onion", handling plurals).
  - **Price Matching:** Map `standardizedName` to specific supermarket product SKUs/identifiers. Requires a maintained mapping or intelligent matching algorithm. Handle cases where no match is found.
  - **Cheapest Basket Calculation:** For a given shopping list, fetch prices for matched items across selected supermarkets. Calculate total cost per store. Identify the store or combination of stores with the lowest overall total for the available items.
  - **Step Timers:** Regex or NLP to detect time phrases (e.g., "X minutes", "Y hours") within recipe steps. Associate detected duration with the step for timer activation.

### 4.7 Non-Functional Requirements

- **Platform:** Mobile-first application (iOS & Android via Capacitor).
- **Performance:** The app should be responsive. Recipe parsing may take a few seconds. Price fetching should be reasonably fast, potentially asynchronous, with progress indicators.
- **Scalability:** The backend should handle a growing number of users, recipes, and price data points.
- **Usability:** The interface should be intuitive and easy to navigate for non-technical users. Price information should be clearly presented.
- **Data Accuracy & Freshness:** Price data should be updated regularly (e.g., daily) and sourced reliably. Users should be informed about the potential for slight discrepancies or delays.
- **Offline Access:** (Consideration) Allow access to saved recipes and potentially the last generated shopping list (including last known prices) even when offline. Meal planning and live price fetching require connectivity.

### 4.8 Acceptance Criteria

- **URL Recipe Import:**
  - Given a valid recipe URL, when the user submits it, the system successfully fetches the page content.
  - Given fetched content, the LLM correctly parses and structures the title, ingredients, steps, portions, and utensils.
  - Given the parsed data, the user is presented with a review screen showing the structured recipe.
  - Given the review screen, the user can successfully save the recipe to their collection.
- **YouTube Recipe Import:**
  - Given a valid YouTube URL containing a recipe, when the user submits it, the system successfully fetches the video transcript.
  - Given the fetched transcript, the LLM correctly parses and structures the title, ingredients, steps, portions, and utensils.
  - Given the parsed data, the user is presented with a review screen showing the structured recipe.
  - Given the review screen, the user can successfully save the recipe to their collection.
- **Image Recipe Import:**
  - Given an uploaded image containing a recipe, the system successfully performs OCR.
  - Given the OCR text, the LLM correctly parses and structures the recipe components.
  - Given the parsed data, the user is presented with a review screen.
  - Given the review screen, the user can successfully save the recipe.
- **Recipe Display:**
  - Given a saved recipe, when the user views it, all components (title, ingredients, steps, etc.) are displayed clearly and correctly.
- **Portion Adjustment:**
  - Given a saved recipe, when the user adjusts the portion count, the ingredient quantities displayed on the recipe view update proportionally.
- **Step Timers:**
  - Given a recipe step containing a time duration (e.g., "bake for 30 minutes"), a timer icon/button is displayed next to it.
  - When the user taps the timer icon, an in-app timer starts with the correct duration.
  - The timer accurately displays the remaining time and can be paused or reset.
- **Step Completion:**
  - Given a recipe view, each cooking step is displayed with a checkbox or similar interactive element.
  - When the user marks a step as complete, its visual state changes to indicate completion (e.g., checked box, strikethrough text).
  - The completion status of steps is saved and restored when the user returns to the recipe (within the context of the current cooking session or scheduled meal).
- **Meal Scheduling:**
  - Given the weekly planner view, the user can successfully drag and drop (or select and assign) a saved recipe to a specific day.
  - The scheduled meal appears correctly on the chosen day in the planner view.
- **Grocery List Generation:**
  - Given meals scheduled for the upcoming week, when the user requests a grocery list, a list is generated.
  - The generated list correctly aggregates identical ingredients from all scheduled recipes for the period.
  - Ingredient quantities on the list accurately reflect any portion adjustments made to the scheduled recipes.
  - Current prices for list items are fetched and displayed from supported supermarkets.
  - The estimated total cost is calculated and displayed for selected supermarkets and/or the cheapest combination.
  - The user can successfully check off items on the generated grocery list.
- **Cheapest Option:**
  - Given a generated shopping list, when the user requests the cheapest option, the system calculates and displays the store(s) offering the lowest total price for the items.
- **UI/UX:**
  - All interactive elements respond within 1 second (excluding network-dependent operations like price fetching).
  - Recipe parsing and price fetching progress are clearly indicated to the user.
  - Navigation between different sections (recipes, planner, grocery list, price insights) is intuitive.
  - Price comparisons and historical trends are presented clearly.

### 4.9 Constraints

- **Technology Stack:** The application must be built using Nuxt 3, Vue 3, TypeScript, Capacitor.js, and Nuxt UI/Tailwind CSS as specified.
- **LLM Dependency:** Recipe parsing accuracy is dependent on the capabilities and potential costs associated with the chosen LLM, especially when processing less structured input like video transcripts. Error handling for failed parsing is required.
- **YouTube Transcript Dependency:** Feature relies on the availability and accuracy of YouTube's automatically generated or user-provided transcripts. Not all videos have transcripts. Error handling for missing or unusable transcripts is required.
- **OCR Dependency:** Image recipe import accuracy depends on the quality of the image and the OCR service.
- **Price Data Source:** Accuracy and availability depend on external sources (supermarket APIs, reliable scraping methods) for Dutch supermarkets. This may require ongoing maintenance. Specific supermarkets covered in v1 need definition (e.g., Albert Heijn, Jumbo initially).
- **Ingredient Matching:** Matching recipe ingredients (e.g., "flour", "1 large onion") to specific supermarket SKUs can be ambiguous and may require heuristics or user clarification.
- **Scope:** Features listed under "Future Considerations / Out of Scope (v1)" are explicitly excluded from the initial release. Historical price trend details are covered in a separate PRD (`groceries-pricing-insights-prd.md`).
- **Offline Functionality:** Full offline functionality is a consideration, not a hard requirement for v1, except for potentially viewing saved recipes and the last generated list (with cached prices). Core features like parsing, planning, and live price fetching require network connectivity.
- **Platform:** Primary focus is on mobile app experience via Capacitor; a web version is secondary.

## 5. Design & UX Considerations

- Use a clean, modern UI (Nuxt UI/Tailwind CSS).
- Mobile-first design approach.
- Clear visual distinction between ingredients, steps, and timers.
- Intuitive drag-and-drop or selection mechanism for meal scheduling.
- Progress indicators for recipe parsing.
- Easy-to-use interface for managing the shopping list (checking items, editing, viewing prices per store).
- Clear presentation of price comparison results.
- (Refer to `groceries-pricing-insights-prd.md` for historical trend visualization)

## 6. Future Considerations / Out of Scope (v1)

- User accounts and sharing recipes/plans between household members (Covered in `user-accounts-sharing-prd.md`, but integration with pricing is v1).
- Integration with online grocery stores for ordering.
- Pantry tracking (managing existing inventory to adjust shopping lists).
- Nutritional information calculation.
- Recipe ratings and reviews.
- Advanced search and filtering (by cuisine, dietary restrictions, ingredients).
- Importing recipes from other formats or apps.
- Price alerts for specific items.
- Budget tracking features.
- Support for more supermarkets or international stores.
- Loyalty card integration.
