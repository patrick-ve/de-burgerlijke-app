<template>
  <div class="container mx-auto px-4 py-8">
    <UBreadcrumb
      :links="[
        { label: 'Recepten', to: '/recipes' },
        { label: 'Importeren', to: '/recipes/import' },
      ]"
      class="mb-6"
    />

    <div class="max-w-3xl mx-auto">
      <RecipeImport />
    </div>
  </div>
</template>

<script setup lang="ts">
// Set page metadata
useHead({
  title: 'Recept importeren - De Burgerlijke App',
  meta: [
    {
      name: 'description',
      content:
        'Importeer een recept van een kookwebsite naar De Burgerlijke App',
    },
  ],
});
</script>
