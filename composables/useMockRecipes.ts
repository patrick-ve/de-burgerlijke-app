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
  {
    id: '6',
    title: 'Pad Thai',
    description: 'Authentic Thai street food noodle dish.',
    imageUrl:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/pad-thai-3a32372.jpg',
    prepTime: 20,
    cookTime: 15,
    cuisine: 'Thai',
    portions: 4,
    ingredients: [
      { id: 'i31', quantity: 250, unit: 'g', name: 'Rice Noodles' },
      {
        id: 'i32',
        quantity: 200,
        unit: 'g',
        name: 'Tofu',
        notes: 'cubed',
      },
      {
        id: 'i33',
        quantity: 2,
        unit: 'tbsp',
        name: 'Tamarind Paste',
      },
      { id: 'i34', quantity: 3, unit: 'tbsp', name: 'Fish Sauce' },
      { id: 'i35', quantity: 100, unit: 'g', name: 'Bean Sprouts' },
      {
        id: 'i36',
        quantity: 50,
        unit: 'g',
        name: 'Peanuts',
        notes: 'crushed',
      },
    ],
    steps: [
      {
        id: 's21',
        order: 1,
        description: 'Soak noodles in warm water.',
      },
      {
        id: 's22',
        order: 2,
        description: 'Make sauce with tamarind and fish sauce.',
      },
      {
        id: 's23',
        order: 3,
        description: 'Stir-fry tofu until golden.',
      },
      {
        id: 's24',
        order: 4,
        description: 'Add noodles and sauce, cook until done.',
      },
    ],
    utensils: [
      { id: 'u17', name: 'Wok' },
      { id: 'u18', name: 'Large Bowl' },
      { id: 'u19', name: 'Spatula' },
    ],
    isFavorite: true,
  },
  {
    id: '7',
    title: 'Ratatouille',
    description: 'Classic French vegetable stew.',
    imageUrl:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/ratatouille-5567.jpg',
    prepTime: 30,
    cookTime: 60,
    cuisine: 'French',
    portions: 6,
    ingredients: [
      { id: 'i37', quantity: 2, unit: null, name: 'Eggplants' },
      { id: 'i38', quantity: 4, unit: null, name: 'Zucchini' },
      { id: 'i39', quantity: 2, unit: null, name: 'Bell Peppers' },
      { id: 'i40', quantity: 4, unit: null, name: 'Tomatoes' },
      { id: 'i41', quantity: 1, unit: null, name: 'Onion' },
      { id: 'i42', quantity: 3, unit: 'cloves', name: 'Garlic' },
    ],
    steps: [
      { id: 's25', order: 1, description: 'Slice all vegetables.' },
      {
        id: 's26',
        order: 2,
        description: 'Layer vegetables in baking dish.',
      },
      {
        id: 's27',
        order: 3,
        description: 'Season with herbs and olive oil.',
      },
      {
        id: 's28',
        order: 4,
        description: 'Bake at 180°C for 45-60 minutes.',
      },
    ],
    utensils: [
      { id: 'u20', name: 'Baking Dish' },
      { id: 'u21', name: 'Sharp Knife' },
      { id: 'u22', name: 'Cutting Board' },
    ],
    isFavorite: false,
  },
  {
    id: '8',
    title: 'Sushi Rolls',
    description: 'Homemade California rolls.',
    imageUrl:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/sushi-rolls-7aea311.jpg',
    prepTime: 45,
    cookTime: 20,
    cuisine: 'Japanese',
    portions: 4,
    ingredients: [
      { id: 'i43', quantity: 300, unit: 'g', name: 'Sushi Rice' },
      { id: 'i44', quantity: 4, unit: 'sheets', name: 'Nori' },
      { id: 'i45', quantity: 1, unit: null, name: 'Cucumber' },
      { id: 'i46', quantity: 1, unit: null, name: 'Avocado' },
      { id: 'i47', quantity: 200, unit: 'g', name: 'Crab Meat' },
      { id: 'i48', quantity: 2, unit: 'tbsp', name: 'Rice Vinegar' },
    ],
    steps: [
      {
        id: 's29',
        order: 1,
        description: 'Cook and season sushi rice.',
      },
      { id: 's30', order: 2, description: 'Prepare fillings.' },
      {
        id: 's31',
        order: 3,
        description: 'Roll sushi using bamboo mat.',
      },
      {
        id: 's32',
        order: 4,
        description: 'Slice rolls into pieces.',
      },
    ],
    utensils: [
      { id: 'u23', name: 'Bamboo Mat' },
      { id: 'u24', name: 'Rice Cooker' },
      { id: 'u25', name: 'Sharp Knife' },
    ],
    isFavorite: true,
  },
  {
    id: '9',
    title: 'Butter Chicken',
    description: 'Rich and creamy Indian curry.',
    imageUrl:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/butter-chicken-cf6f9e2.jpg',
    prepTime: 30,
    cookTime: 40,
    cuisine: 'Indian',
    portions: 6,
    ingredients: [
      { id: 'i49', quantity: 800, unit: 'g', name: 'Chicken Thighs' },
      { id: 'i50', quantity: 400, unit: 'ml', name: 'Tomato Sauce' },
      { id: 'i51', quantity: 200, unit: 'ml', name: 'Heavy Cream' },
      { id: 'i52', quantity: 2, unit: 'tbsp', name: 'Garam Masala' },
      { id: 'i53', quantity: 100, unit: 'g', name: 'Butter' },
      { id: 'i54', quantity: 4, unit: 'cloves', name: 'Garlic' },
    ],
    steps: [
      {
        id: 's33',
        order: 1,
        description: 'Marinate chicken in yogurt and spices.',
      },
      {
        id: 's34',
        order: 2,
        description: 'Cook chicken until golden.',
      },
      {
        id: 's35',
        order: 3,
        description: 'Make sauce with tomatoes and cream.',
      },
      {
        id: 's36',
        order: 4,
        description: 'Simmer chicken in sauce until tender.',
      },
    ],
    utensils: [
      { id: 'u26', name: 'Large Pot' },
      { id: 'u27', name: 'Mixing Bowl' },
      { id: 'u28', name: 'Wooden Spoon' },
    ],
    isFavorite: true,
  },
  {
    id: '10',
    title: 'Paella',
    description: 'Traditional Spanish rice dish.',
    imageUrl:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/paella-5567.jpg',
    prepTime: 35,
    cookTime: 45,
    cuisine: 'Spanish',
    portions: 6,
    ingredients: [
      { id: 'i55', quantity: 400, unit: 'g', name: 'Paella Rice' },
      { id: 'i56', quantity: 300, unit: 'g', name: 'Seafood Mix' },
      { id: 'i57', quantity: 200, unit: 'g', name: 'Chicken' },
      { id: 'i58', quantity: 1, unit: 'pinch', name: 'Saffron' },
      { id: 'i59', quantity: 1, unit: null, name: 'Red Pepper' },
      { id: 'i60', quantity: 1, unit: 'l', name: 'Stock' },
    ],
    steps: [
      {
        id: 's37',
        order: 1,
        description: 'Cook chicken and seafood.',
      },
      { id: 's38', order: 2, description: 'Add rice and saffron.' },
      { id: 's39', order: 3, description: 'Pour in hot stock.' },
      {
        id: 's40',
        order: 4,
        description: 'Cook until rice is done and crispy on bottom.',
      },
    ],
    utensils: [
      { id: 'u29', name: 'Paella Pan' },
      { id: 'u30', name: 'Measuring Cups' },
      { id: 'u31', name: 'Wooden Spoon' },
    ],
    isFavorite: false,
  },
  {
    id: '11',
    title: 'Beef Wellington',
    description: 'Elegant British beef dish.',
    imageUrl:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/beef-wellington-5567.jpg',
    prepTime: 60,
    cookTime: 45,
    cuisine: 'British',
    portions: 6,
    ingredients: [
      { id: 'i61', quantity: 1, unit: 'kg', name: 'Beef Tenderloin' },
      { id: 'i62', quantity: 500, unit: 'g', name: 'Mushrooms' },
      {
        id: 'i63',
        quantity: 1,
        unit: 'package',
        name: 'Puff Pastry',
      },
      { id: 'i64', quantity: 100, unit: 'g', name: 'Prosciutto' },
      { id: 'i65', quantity: 2, unit: null, name: 'Egg Yolks' },
    ],
    steps: [
      { id: 's41', order: 1, description: 'Sear beef and let cool.' },
      { id: 's42', order: 2, description: 'Make mushroom duxelles.' },
      { id: 's43', order: 3, description: 'Wrap beef in pastry.' },
      {
        id: 's44',
        order: 4,
        description: 'Bake until golden brown.',
      },
    ],
    utensils: [
      { id: 'u32', name: 'Skillet' },
      { id: 'u33', name: 'Food Processor' },
      { id: 'u34', name: 'Baking Sheet' },
    ],
    isFavorite: true,
  },
  {
    id: '12',
    title: 'Vietnamese Pho',
    description: 'Traditional Vietnamese noodle soup.',
    imageUrl:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/pho-5567.jpg',
    prepTime: 30,
    cookTime: 180,
    cuisine: 'Vietnamese',
    portions: 6,
    ingredients: [
      { id: 'i66', quantity: 1, unit: 'kg', name: 'Beef Bones' },
      { id: 'i67', quantity: 200, unit: 'g', name: 'Rice Noodles' },
      { id: 'i68', quantity: 1, unit: null, name: 'Onion' },
      { id: 'i69', quantity: 2, unit: null, name: 'Star Anise' },
      { id: 'i70', quantity: 1, unit: null, name: 'Cinnamon Stick' },
    ],
    steps: [
      {
        id: 's45',
        order: 1,
        description: 'Make broth with bones and spices.',
      },
      { id: 's46', order: 2, description: 'Cook rice noodles.' },
      { id: 's47', order: 3, description: 'Slice beef very thinly.' },
      {
        id: 's48',
        order: 4,
        description:
          'Assemble bowls with noodles, beef, and hot broth.',
      },
    ],
    utensils: [
      { id: 'u35', name: 'Large Stock Pot' },
      { id: 'u36', name: 'Strainer' },
      { id: 'u37', name: 'Sharp Knife' },
    ],
    isFavorite: false,
  },
  {
    id: '13',
    title: 'Moussaka',
    description: 'Classic Greek casserole.',
    imageUrl:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/moussaka-5567.jpg',
    prepTime: 45,
    cookTime: 60,
    cuisine: 'Greek',
    portions: 8,
    ingredients: [
      { id: 'i71', quantity: 3, unit: null, name: 'Eggplants' },
      { id: 'i72', quantity: 500, unit: 'g', name: 'Ground Lamb' },
      {
        id: 'i73',
        quantity: 500,
        unit: 'ml',
        name: 'Béchamel Sauce',
      },
      { id: 'i74', quantity: 2, unit: null, name: 'Onions' },
      { id: 'i75', quantity: 400, unit: 'g', name: 'Tomatoes' },
    ],
    steps: [
      {
        id: 's49',
        order: 1,
        description: 'Slice and grill eggplants.',
      },
      { id: 's50', order: 2, description: 'Make meat sauce.' },
      { id: 's51', order: 3, description: 'Prepare béchamel sauce.' },
      {
        id: 's52',
        order: 4,
        description: 'Layer and bake until golden.',
      },
    ],
    utensils: [
      { id: 'u38', name: 'Baking Dish' },
      { id: 'u39', name: 'Grill Pan' },
      { id: 'u40', name: 'Saucepan' },
    ],
    isFavorite: true,
  },
  {
    id: '14',
    title: 'Bibimbap',
    description: 'Korean rice bowl with vegetables.',
    imageUrl:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/bibimbap-5567.jpg',
    prepTime: 40,
    cookTime: 20,
    cuisine: 'Korean',
    portions: 4,
    ingredients: [
      { id: 'i76', quantity: 400, unit: 'g', name: 'Rice' },
      { id: 'i77', quantity: 200, unit: 'g', name: 'Spinach' },
      { id: 'i78', quantity: 200, unit: 'g', name: 'Bean Sprouts' },
      { id: 'i79', quantity: 4, unit: null, name: 'Eggs' },
      { id: 'i80', quantity: 4, unit: 'tbsp', name: 'Gochujang' },
    ],
    steps: [
      { id: 's53', order: 1, description: 'Cook rice.' },
      {
        id: 's54',
        order: 2,
        description: 'Prepare vegetables separately.',
      },
      { id: 's55', order: 3, description: 'Fry eggs sunny-side up.' },
      {
        id: 's56',
        order: 4,
        description: 'Assemble bowls and mix before eating.',
      },
    ],
    utensils: [
      { id: 'u41', name: 'Rice Cooker' },
      { id: 'u42', name: 'Multiple Small Bowls' },
      { id: 'u43', name: 'Frying Pan' },
    ],
    isFavorite: true,
  },
  {
    id: '15',
    title: 'Tiramisu',
    description: 'Classic Italian coffee-flavored dessert.',
    imageUrl:
      'https://images.immediate.co.uk/production/volatile/sites/30/2020/08/tiramisu-5567.jpg',
    prepTime: 30,
    cookTime: 0,
    cuisine: 'Italian',
    portions: 8,
    ingredients: [
      { id: 'i81', quantity: 500, unit: 'g', name: 'Mascarpone' },
      { id: 'i82', quantity: 24, unit: null, name: 'Ladyfingers' },
      { id: 'i83', quantity: 4, unit: null, name: 'Eggs' },
      { id: 'i84', quantity: 100, unit: 'ml', name: 'Strong Coffee' },
      { id: 'i85', quantity: 50, unit: 'g', name: 'Cocoa Powder' },
    ],
    steps: [
      {
        id: 's57',
        order: 1,
        description: 'Make coffee and let cool.',
      },
      {
        id: 's58',
        order: 2,
        description: 'Prepare mascarpone mixture.',
      },
      {
        id: 's59',
        order: 3,
        description: 'Dip ladyfingers in coffee.',
      },
      {
        id: 's60',
        order: 4,
        description: 'Layer and refrigerate overnight.',
      },
    ],
    utensils: [
      { id: 'u44', name: 'Large Bowl' },
      { id: 'u45', name: 'Electric Mixer' },
      { id: 'u46', name: 'Serving Dish' },
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
