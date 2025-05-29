import { type IWebScraperService, type ScrapedRecipeData } from '../../application/interfaces/IWebScraperService';
import FirecrawlApp from '@mendable/firecrawl-js';

export class FirecrawlScraperService implements IWebScraperService {
  private firecrawl: FirecrawlApp;

  constructor(apiKey: string) {
    this.firecrawl = new FirecrawlApp({ apiKey });
  }

  async scrapeRecipe(url: string): Promise<ScrapedRecipeData> {
    const response = await this.firecrawl.scrapeUrl(url, {
      formats: ['markdown'],
    });

    if (!response.success) {
      throw new Error('Failed to scrape recipe from URL');
    }

    // Parse the markdown content to extract recipe data
    const content = response.markdown || '';
    
    // This is a simplified parser - in production, you'd want more robust parsing
    const recipe: ScrapedRecipeData = {
      title: this.extractTitle(content),
      description: this.extractDescription(content),
      ingredients: this.extractIngredients(content),
      instructions: this.extractInstructions(content),
      prepTime: this.extractTime(content, 'prep'),
      cookTime: this.extractTime(content, 'cook'),
      servings: this.extractServings(content),
      tags: this.extractTags(content),
      imageUrl: this.extractImageUrl(content)
    };

    return recipe;
  }

  private extractTitle(content: string): string {
    const match = content.match(/^#\s+(.+)$/m);
    return match ? match[1].trim() : 'Untitled Recipe';
  }

  private extractDescription(content: string): string {
    const lines = content.split('\n');
    const titleIndex = lines.findIndex(line => line.startsWith('#'));
    if (titleIndex >= 0 && titleIndex + 1 < lines.length) {
      const nextLine = lines[titleIndex + 1].trim();
      if (nextLine && !nextLine.startsWith('#') && !nextLine.startsWith('-')) {
        return nextLine;
      }
    }
    return '';
  }

  private extractIngredients(content: string): string[] {
    const ingredients: string[] = [];
    const lines = content.split('\n');
    let inIngredientSection = false;

    for (const line of lines) {
      if (line.toLowerCase().includes('ingredient')) {
        inIngredientSection = true;
        continue;
      }
      if (inIngredientSection && line.startsWith('#')) {
        break;
      }
      if (inIngredientSection && line.trim().startsWith('-')) {
        ingredients.push(line.trim().substring(1).trim());
      }
    }

    return ingredients.length > 0 ? ingredients : ['No ingredients found'];
  }

  private extractInstructions(content: string): string[] {
    const instructions: string[] = [];
    const lines = content.split('\n');
    let inInstructionSection = false;

    for (const line of lines) {
      if (line.toLowerCase().includes('instruction') || line.toLowerCase().includes('method')) {
        inInstructionSection = true;
        continue;
      }
      if (inInstructionSection && line.startsWith('#')) {
        break;
      }
      if (inInstructionSection && (line.trim().match(/^\d+\./) || line.trim().startsWith('-'))) {
        instructions.push(line.trim().replace(/^\d+\.\s*/, '').replace(/^-\s*/, ''));
      }
    }

    return instructions.length > 0 ? instructions : ['No instructions found'];
  }

  private extractTime(content: string, type: 'prep' | 'cook'): string {
    const regex = new RegExp(`${type}.*?time.*?(\\d+)\\s*(hours?|hrs?|minutes?|mins?)`, 'i');
    const match = content.match(regex);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      if (unit.startsWith('h')) {
        return `${value}h`;
      }
      return `${value}min`;
    }
    return '0min';
  }

  private extractServings(content: string): number {
    const match = content.match(/servings?.*?(\d+)/i);
    return match ? parseInt(match[1]) : 4;
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    
    // Check for common dietary tags
    if (/vegetarian/i.test(content)) tags.push('vegetarian');
    if (/vegan/i.test(content)) tags.push('vegan');
    if (/gluten.?free/i.test(content)) tags.push('gluten-free');
    if (/dairy.?free/i.test(content)) tags.push('dairy-free');
    if (/quick|easy|simple/i.test(content)) tags.push('quick');
    if (/healthy/i.test(content)) tags.push('healthy');
    
    return tags;
  }

  private extractImageUrl(content: string): string | undefined {
    const match = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
    return match ? match[1] : undefined;
  }
}