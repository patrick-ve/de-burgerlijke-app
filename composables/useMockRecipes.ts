/**
 * Provides access to the mock recipe data.
 */
import type { Recipe } from '~/types/recipe';

const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Spaghetti Carbonara',
    description: 'A classic Roman pasta dish.',
    imageUrl:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/chorizo-mozarella-gnocchi-bake-cropped-9ab73a3.jpg?resize=768,574',
    prepTime: 10,
    cookTime: 15,
    cuisine: 'Italian',
    portions: 2,
    ingredients: [
      { id: 'i1', quantity: 200, unit: 'g', name: 'Spaghetti' },
      {
        id: 'i2',
        quantity: 100,
        unit: 'g',
        name: 'Guanciale or Pancetta',
      },
      { id: 'i3', quantity: 2, unit: null, name: 'Large Eggs' },
      {
        id: 'i4',
        quantity: 50,
        unit: 'g',
        name: 'Pecorino Romano Cheese',
        notes: 'grated',
      },
      { id: 'i5', quantity: null, unit: null, name: 'Black Pepper' },
    ],
    steps: [
      {
        id: 's1',
        order: 1,
        description: 'Cook pasta according to package directions.',
      },
      {
        id: 's2',
        order: 2,
        description: 'While pasta cooks, fry guanciale until crisp.',
      },
      {
        id: 's3',
        order: 3,
        description:
          'Whisk eggs and cheese. Temper with hot pasta water.',
      },
      {
        id: 's4',
        order: 4,
        description:
          'Drain pasta, reserving some water. Combine pasta, guanciale, egg mixture, and pepper. Add pasta water if needed.',
      },
    ],
    utensils: [
      { id: 'u1', name: 'Large Pot' },
      { id: 'u2', name: 'Frying Pan' },
      { id: 'u3', name: 'Whisk' },
      { id: 'u4', name: 'Colander' },
    ],
    isFavorite: true,
  },
  {
    id: '2',
    title: 'Chicken Stir-Fry',
    description: 'Quick and easy weeknight meal.',
    imageUrl:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/chorizo-mozarella-gnocchi-bake-cropped-9ab73a3.jpg?resize=768,574',
    prepTime: 15,
    cookTime: 10,
    cuisine: 'Asian',
    portions: 3,
    ingredients: [
      {
        id: 'i6',
        quantity: 300,
        unit: 'g',
        name: 'Chicken Breast',
        notes: 'sliced',
      },
      {
        id: 'i7',
        quantity: 1,
        unit: null,
        name: 'Broccoli Head',
        notes: 'cut into florets',
      },
      {
        id: 'i8',
        quantity: 1,
        unit: null,
        name: 'Bell Pepper',
        notes: 'sliced',
      },
      { id: 'i9', quantity: 2, unit: 'tbsp', name: 'Soy Sauce' },
      { id: 'i10', quantity: 1, unit: 'tbsp', name: 'Sesame Oil' },
      {
        id: 'i11',
        quantity: 1,
        unit: 'clove',
        name: 'Garlic',
        notes: 'minced',
      },
      {
        id: 'i12',
        quantity: null,
        unit: null,
        name: 'Rice',
        notes: 'cooked, for serving',
      },
    ],
    steps: [
      {
        id: 's5',
        order: 1,
        description: 'Heat oil in a wok or large skillet.',
      },
      {
        id: 's6',
        order: 2,
        description: 'Add chicken and cook until browned.',
      },
      {
        id: 's7',
        order: 3,
        description:
          'Add vegetables and stir-fry until tender-crisp.',
      },
      {
        id: 's8',
        order: 4,
        description:
          'Stir in soy sauce, sesame oil, and garlic. Cook for 1 minute more.',
      },
      { id: 's9', order: 5, description: 'Serve over rice.' },
    ],
    utensils: [
      { id: 'u5', name: 'Wok or Large Skillet' },
      { id: 'u6', name: 'Knife' },
      { id: 'u7', name: 'Cutting Board' },
    ],
    isFavorite: false,
  },
  {
    id: '3',
    title: 'Greek Salad',
    description: 'Fresh and healthy Mediterranean salad.',
    imageUrl:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/chorizo-mozarella-gnocchi-bake-cropped-9ab73a3.jpg?resize=768,574',
    prepTime: 20,
    cookTime: 0,
    cuisine: 'Greek',
    portions: 4,
    ingredients: [
      {
        id: 'i13',
        quantity: 2,
        unit: null,
        name: 'Cucumbers',
        notes: 'diced',
      },
      {
        id: 'i14',
        quantity: 4,
        unit: null,
        name: 'Tomatoes',
        notes: 'wedged',
      },
      {
        id: 'i15',
        quantity: 1,
        unit: null,
        name: 'Red Onion',
        notes: 'sliced',
      },
      {
        id: 'i16',
        quantity: 200,
        unit: 'g',
        name: 'Feta Cheese',
        notes: 'cubed',
      },
      {
        id: 'i17',
        quantity: 100,
        unit: 'g',
        name: 'Kalamata Olives',
      },
      { id: 'i18', quantity: 60, unit: 'ml', name: 'Olive Oil' },
    ],
    steps: [
      {
        id: 's10',
        order: 1,
        description: 'Combine all vegetables in a large bowl.',
      },
      {
        id: 's11',
        order: 2,
        description: 'Add feta cheese and olives.',
      },
      {
        id: 's12',
        order: 3,
        description: 'Drizzle with olive oil and toss gently.',
      },
    ],
    utensils: [
      { id: 'u8', name: 'Large Bowl' },
      { id: 'u9', name: 'Cutting Board' },
      { id: 'u10', name: 'Sharp Knife' },
    ],
    isFavorite: true,
  },
  {
    id: '4',
    title: 'Beef Tacos',
    description: 'Classic Mexican street tacos.',
    imageUrl:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/chorizo-mozarella-gnocchi-bake-cropped-9ab73a3.jpg?resize=768,574',
    prepTime: 25,
    cookTime: 20,
    cuisine: 'Mexican',
    portions: 6,
    ingredients: [
      { id: 'i19', quantity: 500, unit: 'g', name: 'Ground Beef' },
      { id: 'i20', quantity: 12, unit: null, name: 'Corn Tortillas' },
      {
        id: 'i21',
        quantity: 1,
        unit: 'cup',
        name: 'Onion',
        notes: 'diced',
      },
      {
        id: 'i22',
        quantity: 1,
        unit: 'cup',
        name: 'Cilantro',
        notes: 'chopped',
      },
      {
        id: 'i23',
        quantity: 2,
        unit: null,
        name: 'Limes',
        notes: 'wedged',
      },
      {
        id: 'i24',
        quantity: 1,
        unit: 'packet',
        name: 'Taco Seasoning',
      },
    ],
    steps: [
      {
        id: 's13',
        order: 1,
        description: 'Brown beef in a large skillet.',
      },
      {
        id: 's14',
        order: 2,
        description: 'Add taco seasoning and water, simmer.',
      },
      {
        id: 's15',
        order: 3,
        description: 'Warm tortillas on a griddle.',
      },
      {
        id: 's16',
        order: 4,
        description: 'Assemble tacos with meat and toppings.',
      },
    ],
    utensils: [
      { id: 'u11', name: 'Large Skillet' },
      { id: 'u12', name: 'Griddle' },
      { id: 'u13', name: 'Tongs' },
    ],
    isFavorite: false,
  },
  {
    id: '5',
    title: 'Chocolate Chip Cookies',
    description: 'Classic homemade cookies.',
    imageUrl:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/chorizo-mozarella-gnocchi-bake-cropped-9ab73a3.jpg?resize=768,574',
    prepTime: 15,
    cookTime: 12,
    cuisine: 'American',
    portions: 24,
    ingredients: [
      {
        id: 'i25',
        quantity: 250,
        unit: 'g',
        name: 'Butter',
        notes: 'softened',
      },
      { id: 'i26', quantity: 200, unit: 'g', name: 'Brown Sugar' },
      { id: 'i27', quantity: 2, unit: null, name: 'Eggs' },
      { id: 'i28', quantity: 300, unit: 'g', name: 'Flour' },
      {
        id: 'i29',
        quantity: 200,
        unit: 'g',
        name: 'Chocolate Chips',
      },
      {
        id: 'i30',
        quantity: 1,
        unit: 'tsp',
        name: 'Vanilla Extract',
      },
    ],
    steps: [
      {
        id: 's17',
        order: 1,
        description: 'Cream butter and sugar until fluffy.',
      },
      {
        id: 's18',
        order: 2,
        description: 'Beat in eggs and vanilla.',
      },
      {
        id: 's19',
        order: 3,
        description: 'Mix in flour and chocolate chips.',
      },
      {
        id: 's20',
        order: 4,
        description: 'Bake at 180°C for 12 minutes.',
      },
    ],
    utensils: [
      { id: 'u14', name: 'Mixing Bowl' },
      { id: 'u15', name: 'Electric Mixer' },
      { id: 'u16', name: 'Baking Sheet' },
    ],
    isFavorite: true,
  },
];

export const useMockRecipes = () => {
  const findRecipeById = (id: string): Recipe | undefined => {
    return mockRecipes.find((recipe) => recipe.id === id);
  };

  return {
    recipes: mockRecipes,
    findRecipeById,
  };
};
