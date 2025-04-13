<template>
  <ion-app>
    <TheHeader :title="headerState.title">
      <template #left-action>
        <!-- Content for this slot will be provided by the page -->
      </template>
      <template #right-action>
        <!-- Content for this slot will be provided by the page -->
      </template>
    </TheHeader>

    <ion-content class="ion-padding">
      <NuxtPage />
    </ion-content>

    <BottomNav />
  </ion-app>
</template>

<script setup lang="ts">
import { useHeaderState } from '~/composables/useHeaderState'; // Ensure correct path

const { headerState } = useHeaderState();

// Handlers are no longer needed here as the buttons are defined in the page
// const handleLeftAction = () => { ... };
// const handleRightAction = () => { ... };
</script>

<style>
.ion-padding {
  --padding-bottom: 4rem;
}

ion-content {
  padding-top: var(--padding-top) !important;
}
</style>
