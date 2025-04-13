# Product Requirements Document: Recipe & Grocery Planner App

## 1. Introduction

This document outlines the requirements for the Recipe & Grocery Planner App, a mobile application designed to help couples and households organize recipes, plan meals, and manage grocery shopping efficiently. The core functionality revolves around importing recipes, structuring them using AI, scheduling meals, and generating shopping lists.

## 2. Goals

- Simplify recipe collection and organization.
- Streamline meal planning for individuals and households.
- Automate grocery list generation based on planned meals.
- Provide an intuitive and user-friendly interface for recipe management and meal planning.
- Enhance the cooking experience with integrated timers.

## 3. User Stories

- **As a user, I want to** add a recipe from a website URL **so that** I can easily save recipes I find online.
- **As a user, I want to** add a recipe by uploading an image **so that** I can digitize recipes from physical copies or screenshots.
- **As a user, I want to** see recipes automatically structured into ingredients, steps, portions, utensils, and metadata **so that** the information is consistent and easy to read.
- **As a user, I want to** save my favorite recipes **so that** I can quickly access them later.
- **As a user, I want to** start an in-app timer for cooking steps that require specific timing **so that** I don't need a separate timer device.
- **As a user, I want to** schedule recipes for specific days of the week **so that** I can plan my meals in advance.
- **As a user, I want to** generate a shopping list based on my scheduled meals for the upcoming week **so that** I know exactly what ingredients to buy.
- **As a user, I want to** adjust the number of portions for a recipe **so that** the ingredient amounts in the recipe details and the shopping list update accordingly.
- **As a user, I want to** view and manage my scheduled meals in a calendar or weekly view **so that** I have a clear overview of my meal plan.

## 4. Features & Requirements

### 4.1 Recipe Input & Parsing

- **URL Input:** Allow users to paste a URL pointing to a recipe webpage.
  - The system should attempt to fetch and parse the recipe content from the URL.
- **Image Input:** Allow users to upload an image (e.g., photo, screenshot) containing a recipe.
  - The system should use OCR and an LLM to extract and structure the recipe content from the image.
- **LLM Parsing:**
  - Utilize a Large Language Model (LLM) to process the input (URL content or image text).
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

### 4.4 Meal Planning & Scheduling

- **Weekly Planner:** Provide a calendar or list view representing the days of the week.
- **Scheduling:** Allow users to drag-and-drop or assign saved recipes to specific dates/days.
- **Multiple Meals per Day:** (Optional - Future consideration) Allow scheduling for different meal times (breakfast, lunch, dinner).

### 4.5 Grocery List Generation

- **List Creation:** Generate a consolidated grocery list based on all recipes scheduled for a defined upcoming period (e.g., the next 7 days).
- **Ingredient Aggregation:** Combine identical ingredients from different recipes, summing their quantities (respecting units).
- **Portion Scaling:** Ensure ingredient quantities in the shopping list reflect the portion adjustments made by the user for each scheduled recipe.
- **List Management:** Allow users to check off items as they shop, manually add items, and edit quantities.

### 4.6 Non-Functional Requirements

- **Platform:** Mobile-first application (iOS & Android via Capacitor).
- **Performance:** The app should be responsive. Recipe parsing may take a few seconds, and users should be informed of the progress.
- **Scalability:** The backend should handle a growing number of users and recipes.
- **Usability:** The interface should be intuitive and easy to navigate for non-technical users.
- **Offline Access:** (Consideration) Allow access to saved recipes and potentially the last generated shopping list even when offline. Meal planning might require connectivity.

### 4.7 Acceptance Criteria

- **URL Recipe Import:**
  - Given a valid recipe URL, when the user submits it, the system successfully fetches the page content.
  - Given fetched content, the LLM correctly parses and structures the title, ingredients, steps, portions, and utensils.
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
- **Meal Scheduling:**
  - Given the weekly planner view, the user can successfully drag and drop (or select and assign) a saved recipe to a specific day.
  - The scheduled meal appears correctly on the chosen day in the planner view.
- **Grocery List Generation:**
  - Given meals scheduled for the upcoming week, when the user requests a grocery list, a list is generated.
  - The generated list correctly aggregates identical ingredients from all scheduled recipes for the period.
  - Ingredient quantities on the list accurately reflect any portion adjustments made to the scheduled recipes.
  - The user can successfully check off items on the generated grocery list.
- **UI/UX:**
  - All interactive elements respond within 1 second.
  - Recipe parsing progress is clearly indicated to the user.
  - Navigation between different sections (recipes, planner, grocery list) is intuitive.

### 4.8 Constraints

- **Technology Stack:** The application must be built using Nuxt 3, Vue 3, TypeScript, Capacitor.js, and Nuxt UI/Tailwind CSS as specified.
- **LLM Dependency:** Recipe parsing accuracy is dependent on the capabilities and potential costs associated with the chosen LLM. Error handling for failed parsing is required.
- **OCR Dependency:** Image recipe import accuracy depends on the quality of the image and the OCR service.
- **Scope:** Features listed under "Future Considerations / Out of Scope (v1)" are explicitly excluded from the initial release.
- **Offline Functionality:** Full offline functionality is a consideration, not a hard requirement for v1, except for potentially viewing saved recipes and the last generated list. Core features like parsing and planning may require network connectivity.
- **Platform:** Primary focus is on mobile app experience via Capacitor; a web version is secondary.

## 5. Design & UX Considerations

- Use a clean, modern UI (Nuxt UI/Tailwind CSS).
- Mobile-first design approach.
- Clear visual distinction between ingredients, steps, and timers.
- Intuitive drag-and-drop or selection mechanism for meal scheduling.
- Progress indicators for recipe parsing.
- Easy-to-use interface for managing the shopping list (checking items, editing).

## 6. Future Considerations / Out of Scope (v1)

- User accounts and sharing recipes/plans between household members.
- Integration with online grocery stores for ordering.
- Pantry tracking (managing existing inventory to adjust shopping lists).
- Nutritional information calculation.
- Recipe ratings and reviews.
- Advanced search and filtering (by cuisine, dietary restrictions, ingredients).
- Importing recipes from other formats or apps.
