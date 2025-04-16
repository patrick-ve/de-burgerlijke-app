<template>
  <ion-app>
    <TheHeader :title="headerState.title">
      <template #left-action>
        <!-- Content for this slot will be provided by the page -->
        <div id="header-left-action"></div>
      </template>
      <template #right-action>
        <!-- Content for this slot will be provided by the page -->
        <div id="header-right-action"></div>
      </template>
    </TheHeader>

    <ion-content class="ion-padding">
      <NuxtPage />
    </ion-content>

    <NavigationSlideover />

    <USlideovers />
  </ion-app>
</template>

<script setup lang="ts">
import { useHeaderState } from '~/composables/useHeaderState'; // Ensure correct path

const { headerState } = useHeaderState();
</script>

<style>
.ion-padding {
  /* Keep padding for content, but adjust if needed for slideover */
  /* --padding-bottom: 4rem; */ /* Removed as BottomNav is gone */
}

ion-content {
  padding-top: var(--padding-top) !important;
}
</style>
