# Product Requirements Document: User Accounts & Sharing

## 1. Introduction

This document details the requirements for user account management and sharing functionalities within the Recipe & Grocery Planner App. It covers user registration, authentication, profile management, household creation, and the mechanisms for sharing recipes, meal plans, and shopping lists among users.

## 2. Goals

- Provide secure and easy user registration and login.
- Allow users to manage their personal profile information.
- Enable users to form household groups for collaborative meal planning and shopping.
- Facilitate seamless sharing of recipes, meal plans, and shopping lists within a household.
- Ensure data privacy and security related to user accounts and shared information.

## 3. User Stories

- **As a new user, I want to** register for an account using my email address and a password **so that** I can save my recipes and meal plans.
- **As a registered user, I want to** log in to my account securely **so that** I can access my saved data.
- **As a user, I want to** be able to reset my password if I forget it **so that** I can regain access to my account.
- **As a user, I want to** view and edit my profile information (e.g., name, email) **so that** my details are up to date.
- **As a user, I want to** create a household group **so that** I can invite others to join me for shared planning.
- **As a user, I want to** invite other registered users to my household via email or username **so that** we can collaborate.
- **As a user, I want to** accept or decline invitations to join a household **so that** I can control which groups I belong to.
- **As a member of a household, I want to** see recipes saved or planned by other members **so that** we have a shared view.
- **As a member of a household, I want to** contribute to a shared weekly meal plan **so that** everyone knows what's for dinner.
- **As a member of a household, I want to** access a shared shopping list generated from the household meal plan **so that** anyone can do the shopping.
- **As a household administrator (creator), I want to** be able to remove members from the household **so that** I can manage group membership.
- **As a user, I want to** be able to leave a household **so that** I am no longer part of that shared group.

## 4. Features & Requirements

### 4.1 User Authentication & Authorization

- **Registration:**
  - Allow sign-up using Email and Password.
  - Implement password strength requirements.
  - Verify email address (e.g., sending a confirmation link).
  - (Optional - Future) Offer OAuth options (Google, Apple Sign-In).
- **Login:**
  - Secure login using registered credentials (Email/Password).
  - Implement mechanisms to prevent brute-force attacks (e.g., rate limiting).
- **Password Reset:**
  - Provide a "Forgot Password" flow.
  - Send a secure link or code to the user's registered email for resetting the password.
- **Session Management:**
  - Maintain user sessions securely (e.g., using JWT or similar tokens).
  - Handle token refresh and expiration.

### 4.2 Profile Management

- **View Profile:** Display user's current information (Name, Email).
- **Edit Profile:** Allow users to update their Name and potentially other non-critical information.
- **Change Password:** Allow logged-in users to change their current password.
- **Delete Account:** Provide an option for users to permanently delete their account and associated data (subject to data retention policies).

### 4.3 Household Management

- **Household Creation:** Any registered user can create a new household, becoming its initial administrator.
- **Invitations:**
  - Household administrators can invite other registered users by email or username.
  - Track invitation status (Pending, Accepted, Declined).
  - Invited users receive a notification (in-app or email) and can accept/decline.
- **Membership:**
  - Users can belong to one or multiple households (define limits if necessary).
  - Display list of members within a household view.
- **Roles:**
  - Define basic roles (e.g., Administrator, Member).
  - Administrators can manage members (invite/remove).
- **Leaving/Removing:**
  - Members can voluntarily leave a household.
  - Administrators can remove other members.
  - Define behavior if the last administrator leaves/is removed (e.g., promote another member, dissolve household).

### 4.4 Sharing Mechanisms

- **Shared Scope:** Data (recipes, scheduled meals, shopping lists) created within or explicitly shared with a household context should be visible to all current members of that household.
- **Recipe Sharing:**
  - Option to save a new recipe directly to a specific household's collection.
  - Option to move/copy a personal recipe to a household.
- **Meal Plan Sharing:**
  - A household has a shared meal plan/schedule.
  - Members can add/edit/remove recipes from the household schedule.
- **Shopping List Sharing:**
  - The shopping list generated from the household meal plan is automatically shared.
  - Members can view, add items to, and check off items from the shared list.
  - Shared lists should also reflect the price fetching and comparison features available (e.g., seeing the cheapest options based on household preferences or collectively).
- **Permissions:** Access control should be based on household membership. Ensure users outside a household cannot access its shared data.

## 5. Technical Specifications & Business Logic

- **Architecture:**
  - Authentication, authorization, and household management logic primarily reside in the Nuxt Server API (`server/api/`).
  - This backend interacts with a database to store user credentials, profile info, household memberships, and shared data links.
  - Client-side handles UI for login/registration forms, profile editing, household management interfaces, and displaying shared data.
- **Key Technologies:**
  - **Backend:** Nuxt 3 Server API (Node.js environment).
  - **Database:** SQL (e.g., PostgreSQL, MySQL) or NoSQL (e.g., MongoDB) database capable of handling relational user/household data and potentially document-based recipe/list data.
  - **Authentication:** Secure password hashing (e.g., bcrypt), potentially JWT for session management.
  - **Frontend:** Vue 3 / Nuxt 3.
  - **Email Service:** Third-party email service (e.g., SendGrid, Mailgun) for verification and password resets.
- **Data Models (Conceptual):**
  - **User:** `id`, `email`, `passwordHash`, `name`, `createdAt`, `emailVerified`.
  - **Household:** `id`, `name`, `createdAt`.
  - **HouseholdMember:** `userId`, `householdId`, `role` (e.g., 'admin', 'member'), `joinedAt`.
  - **HouseholdInvitation:** `id`, `householdId`, `invitedEmail`, `inviterUserId`, `status` ('pending', 'accepted', 'declined'), `createdAt`, `expiresAt`.
  - **Recipe:** (Existing model - needs `householdId?` or link table if recipes can belong to multiple households or be purely personal).
  - **ScheduledMeal:** (Existing model - needs `householdId?` or link table).
  - **ShoppingList:** (Existing model - needs `householdId?` or link table).
- **Core Business Logic:**
  - **Authentication Flow:** Register (hash password, send verification email) -> Verify Email -> Login (compare password hash, issue session token) -> Authenticated Requests (validate token).
  - **Password Reset Flow:** Request reset -> Generate secure token -> Send email with reset link containing token -> User clicks link -> Verify token -> Allow new password input -> Update password hash.
  - **Household Creation:** Create `Household` record, create `HouseholdMember` record linking creator user with 'admin' role.
  - **Invitation Logic:** Create `HouseholdInvitation` record. Send notification (email/in-app). When accepted, create `HouseholdMember` record, update invitation status. Handle invitation expiry.
  - **Sharing Logic/Permissions:** Backend APIs must check `HouseholdMember` status before returning/modifying shared resources (recipes, meal plans, lists associated with a `householdId`). A user querying for recipes might receive both their personal recipes (`householdId` is null) and recipes from households they are a member of.
  - **Leaving/Removal:** Delete the relevant `HouseholdMember` record. Define logic for the last administrator leaving (e.g., error, auto-promotion, deletion of household if empty).

## 6. Non-Functional Requirements

- **Security:** All authentication and data transmission must use HTTPS. Passwords must be securely hashed and salted. Implement best practices against common web vulnerabilities (OWASP Top 10).
- **Privacy:** Comply with relevant data privacy regulations (e.g., GDPR, CCPA). Clearly define data ownership and sharing consent.
- **Performance:** Authentication and basic profile operations should be near-instantaneous. Loading shared data should be performant.
- **Scalability:** The system must handle growth in users and households without significant degradation.

### 6.1 Acceptance Criteria

- **Registration:**
  - Given valid email and password, when a user signs up, an account is created.
  - Given a successful sign-up, a verification email is sent to the user's email address.
  - Given an invalid email or weak password, the user receives an appropriate error message.
- **Login:**
  - Given correct credentials for a verified account, when a user logs in, they are granted access and a session is established.
  - Given incorrect credentials, the user receives an error message and is denied access.
- **Password Reset:**
  - Given a registered email address, when the user requests a password reset, a reset link/code is sent to that email.
  - Given a valid reset link/code, the user can successfully set a new password.
- **Profile Management:**
  - Given a logged-in user, they can view their current name and email.
  - Given a logged-in user, they can successfully update their name.
  - Given a logged-in user, they can successfully change their password after verifying the current one.
- **Household Creation:**
  - Given a logged-in user, they can successfully create a new household and become its administrator.
- **Household Invitations:**
  - Given a household administrator, they can successfully send an invitation to another registered user via email/username.
  - Given an invited user, they receive a notification and can accept or decline the invitation.
  - Given an accepted invitation, the user becomes a member of the household.
- **Membership Management:**
  - Given a household administrator, they can successfully remove a member from the household.
  - Given a household member, they can successfully leave the household.
- **Recipe Sharing:**
  - Given a household member, they can save a recipe directly to the household collection.
  - Given a household member, they can view recipes saved in the household collection by other members.
- **Meal Plan Sharing:**
  - Given a household member, they can add/remove a recipe to/from the shared household meal plan.
  - Changes made by one member to the household meal plan are visible to other members.
- **Shopping List Sharing:**
  - Given a shared household meal plan, the generated shopping list is accessible to all members.
  - Given a shared shopping list, when one member checks off an item, the change is reflected for other members.
  - Shared shopping lists display price information and comparison results consistently for all members of the household.

### 6.2 Constraints

- **Authentication:** Initial implementation relies solely on email/password. OAuth providers are out of scope for v1.
- **Email Service:** Functionality like email verification and password reset depends on a reliable third-party email sending service.
- **Real-time Updates:** Real-time synchronization of shared data (meal plans, shopping lists) might have latency depending on the chosen implementation (e.g., polling vs. WebSockets). Perfect real-time is not a strict v1 requirement, but updates should appear reasonably quickly.
- **Single Household Focus (Implied):** While users _can_ belong to multiple households, the primary UX focus for v1 will likely be interaction within one active household context at a time.
- **Data Isolation:** Strict separation must be maintained between personal data and household data, and between different households.
- **Platform:** Functionality must work consistently across iOS and Android via Capacitor.

## 7. Design & UX Considerations

- Clear onboarding flow for registration and login.
- Intuitive interface for managing profile settings.
- Simple and clear process for creating, joining, and managing households.
- Visual indicators for shared vs. personal items (recipes, plans, price preferences/views).
- Notifications for invitations and potentially significant changes in shared plans/lists.

## 8. Future Considerations / Out of Scope (v1)

- More granular permission levels within households.
- Sharing with users outside of a household (e.g., sending a recipe link).
- Household-specific settings or preferences.
- Activity feed showing recent changes within a household.
- OAuth login providers (Google, Apple, etc.).
