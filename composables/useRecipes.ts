/**
 * Provides access to the mock recipe data, now persistent using localStorage.
 */
import { useStorage } from '@vueuse/core';
import { v4 as uuidv4 } from 'uuid';
import type { Recipe } from '~/types/recipe';
import type { AIRecipeDTO } from '~/server/utils/recipeSchema'; // Import the DTO type
import { computed } from 'vue';

// Helper function to parse duration strings/numbers (e.g., "15 min", "1 hour", 15) into minutes
function parseDuration(
  duration: string | number | null | undefined
): number | null {
  if (duration === null || duration === undefined) return null;
  if (typeof duration === 'number')
    return duration > 0 ? duration : null; // Handle direct number input

  // Handle string input
  let totalMinutes = 0;
  const hourMatch = duration.match(/(\d+)\s*(?:hour|uur)/i);
  const minMatch = duration.match(/(\d+)\s*(?:min|minuten)/i);

  if (hourMatch) {
    totalMinutes += parseInt(hourMatch[1], 10) * 60;
  }
  if (minMatch) {
    totalMinutes += parseInt(minMatch[1], 10);
  }

  // If no explicit hour/min match but string contains digits, try parsing just the digits
  if (totalMinutes === 0) {
    const digitMatch = duration.match(/\d+/);
    if (digitMatch) {
      totalMinutes = parseInt(digitMatch[0], 10);
    }
  }

  return totalMinutes > 0 ? totalMinutes : null;
}

// Helper function to parse portions string/number into a number or null
function parsePortions(
  portions: string | number | null | undefined
): number | null {
  if (typeof portions === 'number') return portions;
  if (typeof portions === 'string') {
    // Try to extract the first number found
    const match = portions.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }
  return null; // Default or unable to parse
}

// Helper specifically for step timer parsing
function parseStepTimer(
  timerValue: string | number | null | undefined
): number | null {
  if (timerValue === null || timerValue === undefined) return null;

  let durationMinutes: number | null = null;

  if (typeof timerValue === 'number') {
    // Heuristic:
    // If number > 1000, assume milliseconds -> convert to minutes.
    // If number <= 180 (3 min), assume seconds -> convert to minutes.
    // Otherwise (181-1000), assume minutes (less likely for steps, but possible).
    if (timerValue > 1000) {
      // Plausibly milliseconds
      durationMinutes = timerValue / 60000;
    } else if (timerValue > 0 && timerValue <= 180) {
      // Plausibly seconds
      durationMinutes = timerValue / 60;
    } else if (timerValue > 180) {
      // Plausibly minutes
      durationMinutes = timerValue;
    }
  } else if (typeof timerValue === 'string') {
    let totalMinutes = 0;
    const hourMatch = timerValue.match(/(\d+)\s*(?:hour|uur)/i);
    const minMatch = timerValue.match(/(\d+)\s*(?:min|minuten)/i);
    const secMatch = timerValue.match(/(\d+)\s*(?:sec|seconden)/i);

    if (hourMatch) totalMinutes += parseInt(hourMatch[1], 10) * 60;
    if (minMatch) totalMinutes += parseInt(minMatch[1], 10);
    if (secMatch) totalMinutes += parseInt(secMatch[1], 10) / 60;

    // Fallback for simple number strings (assume seconds?)
    if (totalMinutes === 0) {
      const digitMatch = timerValue.match(/\d+/);
      if (digitMatch) {
        const num = parseInt(digitMatch[0], 10);
        // Heuristic: Assume seconds if just a number in a string & <= 180
        if (num > 0 && num <= 180) {
          totalMinutes = num / 60;
        } else if (num > 180) {
          // Assume minutes if > 180
          totalMinutes = num;
        }
      }
    }
    durationMinutes = totalMinutes;
  }

  // Return null if parsing failed or resulted in 0 or negative
  return durationMinutes !== null && durationMinutes > 0
    ? durationMinutes
    : null;
}

// Helper function to extract YouTube video ID from various URL formats
function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;
  let videoId: string | null = null;
  try {
    const parsedUrl = new URL(url);
    // Standard watch URL
    if (
      parsedUrl.hostname.includes('youtube.com') &&
      parsedUrl.pathname === '/watch'
    ) {
      videoId = parsedUrl.searchParams.get('v');
      // Shortened URL
    } else if (parsedUrl.hostname === 'youtu.be') {
      videoId = parsedUrl.pathname.slice(1); // Remove leading '/'
      // Embed URL
    } else if (
      parsedUrl.hostname.includes('youtube.com') &&
      parsedUrl.pathname.startsWith('/embed/')
    ) {
      videoId = parsedUrl.pathname.split('/embed/')[1];
      // Shorts URL
    } else if (
      parsedUrl.hostname.includes('youtube.com') &&
      parsedUrl.pathname.startsWith('/shorts/')
    ) {
      videoId = parsedUrl.pathname.split('/shorts/')[1];
    }
    // Add more checks if needed for other URL formats
  } catch (e) {
    console.warn(
      'Could not parse YouTube URL with URL API, trying regex:',
      url,
      e
    );
    // Fallback regex for cases where URL parsing might fail or miss patterns
    const regex =
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    if (match && match[1]) {
      videoId = match[1];
    }
  }

  // Basic validation and cleanup (YouTube IDs are typically 11 chars)
  if (videoId && videoId.length >= 11) {
    // Remove potential extra parameters attached to the ID
    return videoId.substring(0, 11);
  }

  console.warn('Could not extract YouTube ID from URL:', url);
  return null;
}

export const useRecipes = () => {
  // Use useStorage to make recipes persistent
  const storedRecipes = useStorage<Recipe[]>('recipes', []);

  const findRecipeById = (id: string): Recipe | undefined => {
    // Search in the stored recipes
    // Filter out recipes with null/undefined IDs before finding
    return storedRecipes.value.find(
      (recipe) => recipe.id === id && recipe.id != null
    );
  };

  /**
   * Adds a new recipe parsed from an AIRecipeDTO to the persistent list.
   */
  const addRecipe = (aiRecipe: AIRecipeDTO): Recipe => {
    // Extract YouTube ID *before* creating the Recipe object
    const youtubeVideoId = extractYouTubeId(
      aiRecipe.youtubeUrl ?? null
    );

    const newRecipe: Recipe = {
      id: uuidv4(), // uuidv4 always returns a string
      // Ensure title conforms to Recipe type (string)
      title: aiRecipe.title ?? 'Untitled Recipe',
      description: aiRecipe.description ?? null,
      imageUrl: aiRecipe.imageUrl ?? null,
      youtubeUrl: aiRecipe.youtubeUrl ?? null,
      prepTime: parseDuration(aiRecipe.prepTime),
      cookTime: parseDuration(aiRecipe.cookTime),
      cuisine: aiRecipe.cuisine ?? null,
      portions: parsePortions(aiRecipe.portions) ?? 1, // Default to 1 if null
      // Assign the pre-calculated ID
      youtubeVideoId, // Use the variable directly
      isVegetarian: aiRecipe.isVegetarian ?? false, // Use undefined as default
      authorName: aiRecipe.authorName ?? null, // Add authorName, default to null
      ingredients: (aiRecipe.ingredients ?? []).map((ing) => ({
        id: uuidv4(), // Generate unique ingredient ID
        name: ing.name,
        quantity: ing.quantity ?? null,
        unit: ing.unit ?? null,
        notes: ing.notes ?? null,
        category: ing.category ?? null,
        isInStock: false,
      })),
      steps: (aiRecipe.steps ?? [])
        .map((step, index) => ({
          id: uuidv4(), // Generate unique step ID
          order: index + 1,
          description: step.description,
          timer: step.timer, // Keep timer value as is from DTO for now
        }))
        // Ensure steps are sorted by order, just in case
        .sort((a, b) => a.order - b.order),
      // Remove utensils mapping as it's not present in AIRecipeDTO
      utensils: [], // Default to empty array for the Recipe type
      isFavorite: false, // Default new recipes are not favorite
      // Explicitly set potentially undefined optional fields to null if needed by backend/storage
      userId: null, // Assuming not available from DTO
      householdId: null, // Assuming not available from DTO
      sourceUrl: aiRecipe.sourceUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // --- Set image from YouTube thumbnail if imageUrl is missing ---
    if (!newRecipe.imageUrl && newRecipe.youtubeVideoId) {
      newRecipe.imageUrl = `https://img.youtube.com/vi/${newRecipe.youtubeVideoId}/hqdefault.jpg`;
      console.log(
        `Set image URL from YouTube thumbnail for recipe: ${newRecipe.title}`
      );
    }
    // --- End YouTube thumbnail logic ---

    storedRecipes.value.push(newRecipe);
    console.log('Added new recipe:', newRecipe);
    return newRecipe; // Return the added recipe
  };

  /**
   * Updates an existing recipe in the persistent list.
   *
   * @param {string} id The ID of the recipe to update.
   * @param {Recipe} updatedRecipeData The new data for the recipe.
   * @returns {Recipe | undefined} The updated recipe if found and updated, otherwise undefined.
   */
  const updateRecipe = (
    id: string,
    updatedRecipeData: Recipe
  ): Recipe | undefined => {
    const recipeIndex = storedRecipes.value.findIndex(
      (recipe) => recipe.id === id
    );

    if (recipeIndex === -1) {
      console.warn(`Recipe with ID: ${id} not found for update.`);
      return undefined;
    }

    // Ensure updatedAt is set
    const recipeToUpdate = {
      ...updatedRecipeData,
      id: id, // Ensure the original ID is kept
      updatedAt: new Date(),
    };

    // Replace the recipe in the array
    storedRecipes.value.splice(recipeIndex, 1, recipeToUpdate);

    console.log(`Updated recipe with ID: ${id}`, recipeToUpdate);
    return recipeToUpdate;
  };

  /**
   * Deletes a recipe by its ID from the persistent list.
   */
  const deleteRecipe = (id: string): void => {
    const initialLength = storedRecipes.value.length;
    // Ensure we only compare with valid string IDs
    storedRecipes.value = storedRecipes.value.filter(
      (recipe) => recipe.id !== id && recipe.id != null
    );
    if (storedRecipes.value.length < initialLength) {
      console.log(`Deleted recipe with ID: ${id}`);
    } else {
      console.warn(`Recipe with ID: ${id} not found for deletion.`);
    }
  };

  // Filter recipes on return to ensure they have valid IDs before exposing
  const recipesWithValidIds = computed(() =>
    storedRecipes.value.filter(
      (recipe) => typeof recipe.id === 'string'
    )
  );

  return {
    // Expose the filtered reactive ref
    recipes: recipesWithValidIds,
    findRecipeById,
    addRecipe, // Expose the new function
    updateRecipe, // Expose the update function
    deleteRecipe, // Expose the delete function
  };
};
