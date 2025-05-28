import { type IRecipeRepository } from '../domain/interfaces/IRecipeRepository';
import { type IShoppingListRepository } from '../domain/interfaces/IShoppingListRepository';
import { type ITodoRepository } from '../domain/interfaces/ITodoRepository';
import { type IAIService } from '../application/interfaces/IAIService';
import { type IWebScraperService } from '../application/interfaces/IWebScraperService';
import { type IPriceService } from '../application/interfaces/IPriceService';
import { type ITextStandardizationService } from '../application/interfaces/ITextStandardizationService';
import { type IFileStorageService } from '../application/interfaces/IFileStorageService';
import { LocalStorageRecipeRepository } from '../infrastructure/repositories/LocalStorageRecipeRepository';
import { LocalStorageShoppingListRepository } from '../infrastructure/repositories/LocalStorageShoppingListRepository';
import { LocalStorageTodoRepository } from '../infrastructure/repositories/LocalStorageTodoRepository';
import { OpenAIService } from '../infrastructure/services/OpenAIService';
import { FirecrawlScraperService } from '../infrastructure/services/FirecrawlScraperService';
import { MockPriceService } from '../infrastructure/services/MockPriceService';
import { AITextStandardizationService } from '../infrastructure/services/AITextStandardizationService';
import { LocalFileStorageService } from '../infrastructure/services/LocalFileStorageService';
import { PriceCalculator } from '../domain/services/PriceCalculator';
import { CreateRecipe } from '../application/use-cases/recipes/CreateRecipe';
import { UpdateRecipe } from '../application/use-cases/recipes/UpdateRecipe';
import { DeleteRecipe } from '../application/use-cases/recipes/DeleteRecipe';
import { GenerateRecipeWithAI } from '../application/use-cases/recipes/GenerateRecipeWithAI';
import { ImportRecipeFromUrl } from '../application/use-cases/recipes/ImportRecipeFromUrl';
import { AddItemToShoppingList } from '../application/use-cases/shopping/AddItemToShoppingList';
import { UpdateShoppingItem } from '../application/use-cases/shopping/UpdateShoppingItem';
import { OptimizeShoppingList } from '../application/use-cases/shopping/OptimizeShoppingList';
import { FindCheapestPrices } from '../application/use-cases/shopping/FindCheapestPrices';
import { StandardizeShoppingText } from '../application/use-cases/shopping/StandardizeShoppingText';
import { CleanUpShoppingList } from '../application/use-cases/shopping/CleanUpShoppingList';
import { CreateTodo } from '../application/use-cases/todos/CreateTodo';
import { UpdateTodo } from '../application/use-cases/todos/UpdateTodo';
import { DeleteTodo } from '../application/use-cases/todos/DeleteTodo';
import { AttachFileToTodo } from '../application/use-cases/todos/AttachFileToTodo';
import { SetTodoDueDate } from '../application/use-cases/todos/SetTodoDueDate';
import { type IMealPlanRepository } from '../domain/interfaces/IMealPlanRepository';
import { LocalStorageMealPlanRepository } from '../infrastructure/repositories/LocalStorageMealPlanRepository';
import { MealPlanner } from '../domain/services/MealPlanner';
import { CreateMealPlan } from '../application/use-cases/meal-planning/CreateMealPlan';
import { ScheduleMeal } from '../application/use-cases/meal-planning/ScheduleMeal';
import { GenerateWeeklyMealPlan } from '../application/use-cases/meal-planning/GenerateWeeklyMealPlan';
import { GetMealSuggestions } from '../application/use-cases/meal-planning/GetMealSuggestions';
import { UpdateMealPlan } from '../application/use-cases/meal-planning/UpdateMealPlan';
import { type IUserSettingsRepository } from '../domain/interfaces/IUserSettingsRepository';
import { type IBirthdayRepository } from '../domain/interfaces/IBirthdayRepository';
import { type IHolidayChecklistRepository } from '../domain/interfaces/IHolidayChecklistRepository';
import { LocalStorageUserSettingsRepository } from '../infrastructure/repositories/LocalStorageUserSettingsRepository';
import { LocalStorageBirthdayRepository } from '../infrastructure/repositories/LocalStorageBirthdayRepository';
import { LocalStorageHolidayChecklistRepository } from '../infrastructure/repositories/LocalStorageHolidayChecklistRepository';
import { GetUserSettings } from '../application/use-cases/settings/GetUserSettings';
import { UpdateUserSettings } from '../application/use-cases/settings/UpdateUserSettings';
import { CompleteOnboarding } from '../application/use-cases/settings/CompleteOnboarding';
import { SelectSupermarkets } from '../application/use-cases/settings/SelectSupermarkets';
import { CreateBirthday } from '../application/use-cases/birthdays/CreateBirthday';
import { UpdateBirthday } from '../application/use-cases/birthdays/UpdateBirthday';
import { DeleteBirthday } from '../application/use-cases/birthdays/DeleteBirthday';
import { GetUpcomingBirthdays } from '../application/use-cases/birthdays/GetUpcomingBirthdays';
import { CreateHolidayChecklist } from '../application/use-cases/holiday/CreateHolidayChecklist';
import { AddItemToChecklist } from '../application/use-cases/holiday/AddItemToChecklist';
import { ToggleChecklistItem } from '../application/use-cases/holiday/ToggleChecklistItem';
import { CloneHolidayChecklist } from '../application/use-cases/holiday/CloneHolidayChecklist';

export interface Container {
  // Repositories
  recipeRepository: IRecipeRepository;
  shoppingListRepository: IShoppingListRepository;
  todoRepository: ITodoRepository;
  mealPlanRepository: IMealPlanRepository;
  userSettingsRepository: IUserSettingsRepository;
  birthdayRepository: IBirthdayRepository;
  holidayChecklistRepository: IHolidayChecklistRepository;
  
  // Services
  aiService: IAIService;
  webScraperService: IWebScraperService;
  priceService: IPriceService;
  textStandardizationService: ITextStandardizationService;
  fileStorageService: IFileStorageService;
  
  // Domain Services
  priceCalculator: PriceCalculator;
  mealPlanner: MealPlanner;
  
  // Use Cases - Recipes
  createRecipe: CreateRecipe;
  updateRecipe: UpdateRecipe;
  deleteRecipe: DeleteRecipe;
  generateRecipeWithAI: GenerateRecipeWithAI;
  importRecipeFromUrl: ImportRecipeFromUrl;
  
  // Use Cases - Shopping
  addItemToShoppingList: AddItemToShoppingList;
  updateShoppingItem: UpdateShoppingItem;
  optimizeShoppingList: OptimizeShoppingList;
  findCheapestPrices: FindCheapestPrices;
  standardizeShoppingText: StandardizeShoppingText;
  cleanUpShoppingList: CleanUpShoppingList;
  
  // Use Cases - Todos
  createTodo: CreateTodo;
  updateTodo: UpdateTodo;
  deleteTodo: DeleteTodo;
  attachFileToTodo: AttachFileToTodo;
  setTodoDueDate: SetTodoDueDate;
  
  // Use Cases - Meal Planning
  createMealPlan: CreateMealPlan;
  scheduleMeal: ScheduleMeal;
  generateWeeklyMealPlan: GenerateWeeklyMealPlan;
  getMealSuggestions: GetMealSuggestions;
  updateMealPlan: UpdateMealPlan;
  
  // Use Cases - Settings
  getUserSettings: GetUserSettings;
  updateUserSettings: UpdateUserSettings;
  completeOnboarding: CompleteOnboarding;
  selectSupermarkets: SelectSupermarkets;
  
  // Use Cases - Birthdays
  createBirthday: CreateBirthday;
  updateBirthday: UpdateBirthday;
  deleteBirthday: DeleteBirthday;
  getUpcomingBirthdays: GetUpcomingBirthdays;
  
  // Use Cases - Holiday
  createHolidayChecklist: CreateHolidayChecklist;
  addItemToChecklist: AddItemToChecklist;
  toggleChecklistItem: ToggleChecklistItem;
  cloneHolidayChecklist: CloneHolidayChecklist;
}

let container: Container | null = null;

export function createContainer(): Container {
  // Initialize repositories
  const recipeRepository = new LocalStorageRecipeRepository();
  const shoppingListRepository = new LocalStorageShoppingListRepository();
  const todoRepository = new LocalStorageTodoRepository();
  const mealPlanRepository = new LocalStorageMealPlanRepository();
  const userSettingsRepository = new LocalStorageUserSettingsRepository();
  const birthdayRepository = new LocalStorageBirthdayRepository();
  const holidayChecklistRepository = new LocalStorageHolidayChecklistRepository();
  
  // Initialize services - in client, these won't have API keys
  const aiService = new OpenAIService('');
  const webScraperService = new FirecrawlScraperService('');
  const priceService = new MockPriceService();
  const textStandardizationService = new AITextStandardizationService('');
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

export function getContainer(): Container {
  if (!container) {
    container = createContainer();
  }
  return container;
}

// Composable for Vue components
export function useContainer(): Container {
  return getContainer();
}