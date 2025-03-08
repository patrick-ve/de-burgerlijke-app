interface RecipeData {
  title: string;
  ingredients: string[];
  instructions: string[];
  servings: number;
  prepTime: string;
  cookTime: string;
  aiSuggestions?: {
    tips: string[];
    substitutions: string[];
    nutritionalInfo: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    };
  };
}

interface ParseUrlResult {
  isValid: boolean;
  domain?: string;
  error?: string;
}

export const useRecipeParser = () => {
  const parseRecipeUrl = (url: string): ParseUrlResult => {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');

      return {
        isValid: true,
        domain,
      };
    } catch (error) {
      return {
        isValid: false,
        error:
          'Ongeldige URL. Voer een geldige URL in (bijvoorbeeld: https://www.example.com/recipe)',
      };
    }
  };

  const extractRecipeData = async (
    url: string
  ): Promise<RecipeData> => {
    const { isValid, error } = parseRecipeUrl(url);

    if (!isValid) {
      throw new Error(error || 'Ongeldige URL');
    }

    throw new Error('Not implemented');
  };

  return {
    parseRecipeUrl,
    extractRecipeData,
  };
};
