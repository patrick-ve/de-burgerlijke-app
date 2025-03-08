<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button
            default-href="/recipes"
            text="Recepten"
          ></ion-back-button>
        </ion-buttons>
        <ion-title>Importeren</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="max-w-3xl mx-auto">
        <RecipeImport />
      </div>
    </ion-content>
  </ion-page>
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

<style scoped>
ion-content::part(scroll) {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
