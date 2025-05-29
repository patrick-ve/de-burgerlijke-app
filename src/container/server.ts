import { type Container, createContainer as createBaseContainer } from './index';

let serverContainer: Container | null = null;

export function createServerContainer(config: {
  openaiApiKey?: string;
  firecrawlApiKey?: string;
}): Container {
  // Import services here to avoid circular dependencies
  const { OpenAIService } = require('../infrastructure/services/OpenAIService');
  const { FirecrawlScraperService } = require('../infrastructure/services/FirecrawlScraperService');
  const { MockPriceService } = require('../infrastructure/services/MockPriceService');
  const { AITextStandardizationService } = require('../infrastructure/services/AITextStandardizationService');
  const { LocalFileStorageService } = require('../infrastructure/services/LocalFileStorageService');
  const { LocalStorageRecipeRepository } = require('../infrastructure/repositories/LocalStorageRecipeRepository');
  const { LocalStorageShoppingListRepository } = require('../infrastructure/repositories/LocalStorageShoppingListRepository');
  const { LocalStorageTodoRepository } = require('../infrastructure/repositories/LocalStorageTodoRepository');
  const { LocalStorageMealPlanRepository } = require('../infrastructure/repositories/LocalStorageMealPlanRepository');
  const { LocalStorageUserSettingsRepository } = require('../infrastructure/repositories/LocalStorageUserSettingsRepository');
  const { LocalStorageBirthdayRepository } = require('../infrastructure/repositories/LocalStorageBirthdayRepository');
  const { LocalStorageHolidayChecklistRepository } = require('../infrastructure/repositories/LocalStorageHolidayChecklistRepository');
  const { PriceCalculator } = require('../domain/services/PriceCalculator');
  const { MealPlanner } = require('../domain/services/MealPlanner');
  
  // Import use cases
  const { CreateRecipe } = require('../application/use-cases/recipes/CreateRecipe');
  const { UpdateRecipe } = require('../application/use-cases/recipes/UpdateRecipe');
  const { DeleteRecipe } = require('../application/use-cases/recipes/DeleteRecipe');
  const { GenerateRecipeWithAI } = require('../application/use-cases/recipes/GenerateRecipeWithAI');
  const { ImportRecipeFromUrl } = require('../application/use-cases/recipes/ImportRecipeFromUrl');
  const { AddItemToShoppingList } = require('../application/use-cases/shopping/AddItemToShoppingList');
  const { UpdateShoppingItem } = require('../application/use-cases/shopping/UpdateShoppingItem');
  const { OptimizeShoppingList } = require('../application/use-cases/shopping/OptimizeShoppingList');
  const { FindCheapestPrices } = require('../application/use-cases/shopping/FindCheapestPrices');
  const { StandardizeShoppingText } = require('../application/use-cases/shopping/StandardizeShoppingText');
  const { CleanUpShoppingList } = require('../application/use-cases/shopping/CleanUpShoppingList');
  const { CreateTodo } = require('../application/use-cases/todos/CreateTodo');
  const { UpdateTodo } = require('../application/use-cases/todos/UpdateTodo');
  const { DeleteTodo } = require('../application/use-cases/todos/DeleteTodo');
  const { AttachFileToTodo } = require('../application/use-cases/todos/AttachFileToTodo');
  const { SetTodoDueDate } = require('../application/use-cases/todos/SetTodoDueDate');
  const { CreateMealPlan } = require('../application/use-cases/meal-planning/CreateMealPlan');
  const { ScheduleMeal } = require('../application/use-cases/meal-planning/ScheduleMeal');
  const { GenerateWeeklyMealPlan } = require('../application/use-cases/meal-planning/GenerateWeeklyMealPlan');
  const { GetMealSuggestions } = require('../application/use-cases/meal-planning/GetMealSuggestions');
  const { UpdateMealPlan } = require('../application/use-cases/meal-planning/UpdateMealPlan');
  const { GetUserSettings } = require('../application/use-cases/settings/GetUserSettings');
  const { UpdateUserSettings } = require('../application/use-cases/settings/UpdateUserSettings');
  const { CompleteOnboarding } = require('../application/use-cases/settings/CompleteOnboarding');
  const { SelectSupermarkets } = require('../application/use-cases/settings/SelectSupermarkets');
  const { CreateBirthday } = require('../application/use-cases/birthdays/CreateBirthday');
  const { UpdateBirthday } = require('../application/use-cases/birthdays/UpdateBirthday');
  const { DeleteBirthday } = require('../application/use-cases/birthdays/DeleteBirthday');
  const { GetUpcomingBirthdays } = require('../application/use-cases/birthdays/GetUpcomingBirthdays');
  const { CreateHolidayChecklist } = require('../application/use-cases/holiday/CreateHolidayChecklist');
  const { AddItemToChecklist } = require('../application/use-cases/holiday/AddItemToChecklist');
  const { ToggleChecklistItem } = require('../application/use-cases/holiday/ToggleChecklistItem');
  const { CloneHolidayChecklist } = require('../application/use-cases/holiday/CloneHolidayChecklist');
  
  // Initialize repositories
  const recipeRepository = new LocalStorageRecipeRepository();
  const shoppingListRepository = new LocalStorageShoppingListRepository();
  const todoRepository = new LocalStorageTodoRepository();
  const mealPlanRepository = new LocalStorageMealPlanRepository();
  const userSettingsRepository = new LocalStorageUserSettingsRepository();
  const birthdayRepository = new LocalStorageBirthdayRepository();
  const holidayChecklistRepository = new LocalStorageHolidayChecklistRepository();
  
  // Initialize services
  const aiService = new OpenAIService(config.openaiApiKey || '');
  const webScraperService = new FirecrawlScraperService(config.firecrawlApiKey || '');
  const priceService = new MockPriceService();
  const textStandardizationService = new AITextStandardizationService(config.openaiApiKey || '');
  const fileStorageService = new LocalFileStorageService();
  
  // Initialize domain services
  const priceCalculator = new PriceCalculator();
  const mealPlanner = new MealPlanner();
  
  // Initialize recipe use cases
  const createRecipe = new CreateRecipe(recipeRepository);
  const updateRecipe = new UpdateRecipe(recipeRepository);
  const deleteRecipe = new DeleteRecipe(recipeRepository);
  const generateRecipeWithAI = new GenerateRecipeWithAI(recipeRepository, aiService);
  const importRecipeFromUrl = new ImportRecipeFromUrl(recipeRepository, webScraperService);
  
  // Initialize shopping use cases
  const addItemToShoppingList = new AddItemToShoppingList(shoppingListRepository);
  const updateShoppingItem = new UpdateShoppingItem(shoppingListRepository);
  const optimizeShoppingList = new OptimizeShoppingList(shoppingListRepository, priceService, priceCalculator);
  const findCheapestPrices = new FindCheapestPrices(shoppingListRepository, priceService, priceCalculator);
  const standardizeShoppingText = new StandardizeShoppingText(textStandardizationService);
  const cleanUpShoppingList = new CleanUpShoppingList(shoppingListRepository, textStandardizationService);
  
  // Initialize todo use cases
  const createTodo = new CreateTodo(todoRepository);
  const updateTodo = new UpdateTodo(todoRepository);
  const deleteTodo = new DeleteTodo(todoRepository);
  const attachFileToTodo = new AttachFileToTodo(todoRepository, fileStorageService);
  const setTodoDueDate = new SetTodoDueDate(todoRepository);
  
  // Initialize meal planning use cases
  const createMealPlan = new CreateMealPlan(mealPlanRepository);
  const scheduleMeal = new ScheduleMeal(mealPlanRepository, recipeRepository);
  const generateWeeklyMealPlan = new GenerateWeeklyMealPlan(mealPlanRepository, recipeRepository, mealPlanner);
  const getMealSuggestions = new GetMealSuggestions(mealPlanRepository, recipeRepository, mealPlanner);
  const updateMealPlan = new UpdateMealPlan(mealPlanRepository);
  
  // Initialize settings use cases
  const getUserSettings = new GetUserSettings(userSettingsRepository);
  const updateUserSettings = new UpdateUserSettings(userSettingsRepository);
  const completeOnboarding = new CompleteOnboarding(userSettingsRepository);
  const selectSupermarkets = new SelectSupermarkets(userSettingsRepository);
  
  // Initialize birthday use cases
  const createBirthday = new CreateBirthday(birthdayRepository);
  const updateBirthday = new UpdateBirthday(birthdayRepository);
  const deleteBirthday = new DeleteBirthday(birthdayRepository);
  const getUpcomingBirthdays = new GetUpcomingBirthdays(birthdayRepository);
  
  // Initialize holiday use cases
  const createHolidayChecklist = new CreateHolidayChecklist(holidayChecklistRepository);
  const addItemToChecklist = new AddItemToChecklist(holidayChecklistRepository);
  const toggleChecklistItem = new ToggleChecklistItem(holidayChecklistRepository);
  const cloneHolidayChecklist = new CloneHolidayChecklist(holidayChecklistRepository);
  
  return {
    // Repositories
    recipeRepository,
    shoppingListRepository,
    todoRepository,
    mealPlanRepository,
    userSettingsRepository,
    birthdayRepository,
    holidayChecklistRepository,
    
    // Services
    aiService,
    webScraperService,
    priceService,
    textStandardizationService,
    fileStorageService,
    
    // Domain Services
    priceCalculator,
    mealPlanner,
    
    // Use Cases - Recipes
    createRecipe,
    updateRecipe,
    deleteRecipe,
    generateRecipeWithAI,
    importRecipeFromUrl,
    
    // Use Cases - Shopping
    addItemToShoppingList,
    updateShoppingItem,
    optimizeShoppingList,
    findCheapestPrices,
    standardizeShoppingText,
    cleanUpShoppingList,
    
    // Use Cases - Todos
    createTodo,
    updateTodo,
    deleteTodo,
    attachFileToTodo,
    setTodoDueDate,
    
    // Use Cases - Meal Planning
    createMealPlan,
    scheduleMeal,
    generateWeeklyMealPlan,
    getMealSuggestions,
    updateMealPlan,
    
    // Use Cases - Settings
    getUserSettings,
    updateUserSettings,
    completeOnboarding,
    selectSupermarkets,
    
    // Use Cases - Birthdays
    createBirthday,
    updateBirthday,
    deleteBirthday,
    getUpcomingBirthdays,
    
    // Use Cases - Holiday
    createHolidayChecklist,
    addItemToChecklist,
    toggleChecklistItem,
    cloneHolidayChecklist,
  };
}

export function getServerContainer(config: {
  openaiApiKey?: string;
  firecrawlApiKey?: string;
}): Container {
  if (!serverContainer) {
    serverContainer = createServerContainer(config);
  }
  return serverContainer;
}