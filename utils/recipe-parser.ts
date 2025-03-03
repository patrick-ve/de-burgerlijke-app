import { Recipe, Ingredient } from '@/types';

// This is a mock implementation of a recipe parser
// In a real app, you would use a proper API or library to extract recipe data from URLs
export const parseRecipeFromUrl = async (url: string): Promise<Recipe | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // For demo purposes, return a mock recipe
  if (url.includes('recipe') || url.includes('food') || url.includes('cook')) {
    return {
      id: Date.now().toString(),
      title: 'Pasta with Tomato Sauce',
      description: 'A simple and delicious pasta dish with homemade tomato sauce.',
      imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?q=80&w=2070&auto=format&fit=crop',
      sourceUrl: url,
      ingredients: [
        { id: '1', name: 'Pasta', quantity: 500, unit: 'g' },
        { id: '2', name: 'Tomatoes', quantity: 400, unit: 'g' },
        { id: '3', name: 'Onion', quantity: 1, unit: '' },
        { id: '4', name: 'Garlic', quantity: 2, unit: 'cloves' },
        { id: '5', name: 'Olive oil', quantity: 2, unit: 'tbsp' },
        { id: '6', name: 'Salt', quantity: 1, unit: 'tsp' },
        { id: '7', name: 'Pepper', quantity: 0.5, unit: 'tsp' },
        { id: '8', name: 'Basil', quantity: 5, unit: 'leaves' },
      ],
      instructions: [
        'Boil water in a large pot and add salt.',
        'Cook pasta according to package instructions.',
        'In a separate pan, heat olive oil and sauté chopped onion until translucent.',
        'Add minced garlic and cook for another minute.',
        'Add chopped tomatoes and simmer for 15 minutes.',
        'Season with salt and pepper.',
        'Drain pasta and mix with the sauce.',
        'Garnish with fresh basil leaves before serving.',
      ],
      prepTime: 10,
      cookTime: 20,
      servings: 4,
      tags: ['pasta', 'italian', 'dinner', 'vegetarian'],
      createdAt: Date.now(),
    };
  }
  
  return null;
};