<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import TheHeader from '~/components/TheHeader.vue';

interface Feature {
  title: string;
  description: string;
  icon: string;
  image: {
    src: string;
    alt: string;
  };
}

const features: Feature[] = [
  {
    title: 'Receptenboek',
    description:
      "Verzamel en organiseer al je recepten op één centrale plek. Importeer recepten van kookwebsites, YouTube video's, foto's en meer. Zie in een oogopslag welke ingrediënten je nog moet kopen en wat de stappen zijn voor elke maaltijd.",
    icon: 'i-heroicons-book-open',
    image: {
      src: '/pwa-screenshot-mobile-1.png',
      alt: 'Screenshot van De Burgerlijke App - Receptenboek',
    },
  },
  {
    title: 'Maaltijdenplanner',
    description:
      'Plan moeiteloos je wekelijkse maaltijden en voorkom de dagelijkse "wat eten we vandaag"-stress. De ingrediëntenlijst wordt automatisch aangepast naar de hoeveelheden die je nodig hebt en toegevoegd aan je boodschappenlijst.',
    icon: 'i-heroicons-calendar',
    image: {
      src: '/pwa-screenshot-mobile-2.png',
      alt: 'Screenshot van De Burgerlijke App - Maaltijdenplanner',
    },
  },
  {
    title: 'Boodschappenlijst',
    description:
      'Genereer automatisch je boodschappenlijst op basis van je maaltijdplan en recepten. Verkrijg een handig overzicht van je boodschappen. Wij zoeken voor je uit waar je de goedkoopste boodschappen kunt halen.',
    icon: 'i-heroicons-shopping-cart',
    image: {
      src: '/pwa-screenshot-mobile-3.png',
      alt: 'Screenshot van De Burgerlijke App - Slimme Boodschappenlijst',
    },
  },
  {
    title: 'Takenlijst',
    description:
      'Beheer huishoudelijke taken efficiënt. Wijs taken toe aan gezinsleden, stel deadlines in en houd de voortgang bij. Zorg ervoor dat niets over het hoofd wordt gezien.',
    icon: 'i-heroicons-list-bullet',
    image: {
      src: '/pwa-screenshot-mobile-4.png',
      alt: 'Screenshot van De Burgerlijke App - Takenlijst',
    },
  },
  {
    title: 'Verjaardagen',
    description:
      'Vergeet nooit meer een verjaardag. Houd een overzicht bij van belangrijke data en ontvang herinneringen. Plan cadeaus en vieringen ruim op tijd.',
    icon: 'i-heroicons-cake',
    image: {
      src: '/pwa-screenshot-mobile-5.png',
      alt: 'Screenshot van De Burgerlijke App - Verjaardagen',
    },
  },
  {
    title: 'Vakantie paklijst',
    description:
      'Stel eenvoudig paklijsten samen voor vakanties en uitjes. Zorg ervoor dat je niets vergeet mee te nemen, van kleding tot belangrijke documenten.',
    icon: 'i-heroicons-briefcase',
    image: {
      src: '/pwa-screenshot-mobile-6.png',
      alt: 'Screenshot van De Burgerlijke App - Vakantie Paklijst',
    },
  },
];

const selectedFeatureIndex = ref(0);

const selectFeature = (index: number) => {
  selectedFeatureIndex.value = index;
};

const currentFeature = computed(
  () => features[selectedFeatureIndex.value]
);

const router = useRouter();

const items = [
  {
    label: 'Is deze app veilig?',
    content:
      'In de Burgerlijke App wordt al je data en informatie lokaal op je apparaat opgeslagen. Geen enkele informatie - tekst of afbeeldingen - wordt opgeslagen op onze servers.',
  },
  {
    label: 'Is de prijsinformatie van boodschappen correct?',
    content:
      'Ondanks zorgvuldigheid bij het samenstelling van je boodschappenlijst, is het niet mogelijk om de prijsinformatie van boodschappen altijd 100% correct te hebben. De Burgerlijke App aanvaardt geen enkele aansprakelijkheid voor foutieve prijsinformatie.',
  },
  {
    label: 'Hoe kan deze app gratis zijn?',
    content:
      'Bij gratis gebruik van De Burgerlijke App mag je maximaal 10 recepten opslaan in je receptenboek en wekelijks 2x een boodschappenlijstje toevoegen a.d.h.v de maaltijdenplanner.',
  },
  {
    label: 'Wat krijg ik als ik een betaalde licentie aanschaf?',
    content:
      'Je mag dan een onbeperkt aantal recepten opslaan in je receptenboek en onbeperkt vaak je boodschappenlijstje bijwerken a.d.h.v. de maaltijdenplanner.',
  },
  {
    label:
      'Waarom is De Burgerlijke App een Progressive Web App (PWA)? Waarom geen iOS of Android app?',
    content:
      'Een PWA (Progressive Web App) is een website die zich gedraagt als een mobiele app. Je kunt de app direct vanuit je browser installeren zonder een app store te gebruiken. Ze zijn vaak goedkoper en sneller te ontwikkelen dan native apps. Een PWA is net zo veilig als een native app of website.',
  },
];

const scrollToFeatures = () => {
  // Check if the large screen feature section is visible (indicates desktop view)
  const largeScreenFeaturesVisible =
    document.getElementById('scroll-demo')?.offsetParent !== null;

  const targetElementId = largeScreenFeaturesVisible
    ? 'start-saving-button' // Desktop target
    : 'phone-mockup-container'; // Mobile target

  const targetElement = document.getElementById(targetElementId);

  if (targetElement) {
    requestAnimationFrame(() => {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }
};
</script>

<template>
  <TheHeader>
    <template #right-action>
      <UButton
        color="primary"
        variant="solid"
        class="font-bold"
        label="Bespaar geld"
        aria-label="Open app"
        @click="() => router.push('/app')"
      />
    </template>
  </TheHeader>

  <div class="bg-white">
    <div class="relative isolate pt-4 md:pt-14">
      <svg
        class="absolute inset-0 -z-10 size-full stroke-gray-200 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="83fd4e5a-9d52-42fc-97b6-718e5d7ee527"
            width="200"
            height="200"
            x="50%"
            y="-1"
            patternUnits="userSpaceOnUse"
          >
            <path d="M100 200V.5M.5 .5H200" fill="none" />
          </pattern>
        </defs>
        <svg x="50%" y="-1" class="overflow-visible fill-gray-50">
          <path
            d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M-300.5 600h201v201h-201Z"
            stroke-width="0"
          />
        </svg>
        <rect
          width="100%"
          height="100%"
          stroke-width="0"
          fill="url(#83fd4e5a-9d52-42fc-97b6-718e5d7ee527)"
        />
      </svg>

      <div class="mx-auto max-w-7xl px-4 lg:px-0">
        <div class="lg:flex lg:items-start lg:gap-x-10">
          <div
            class="mx-auto max-w-2xl lg:mx-0 lg:flex-auto lg:py-40"
          >
            <h1
              class="mt-10 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-7xl"
            >
              Organiseer <br />het huishouden slimmer, sneller en
              goedkoper.
            </h1>
            <p
              class="mt-8 text-pretty text-lg font-medium text-gray-500 sm:text-xl/8"
            >
              De Burgerlijke App is een app die je helpt met het
              verzamelen van recepten, het plannen van maaltijden en
              het beheren van de wekelijkse boodschappen.
            </p>
            <div class="mt-10 flex items-center gap-x-6">
              <nuxt-link
                id="start-saving-button"
                to="/app"
                class="rounded-md bg-primary-500 px-3.5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >Begin met geld besparen</nuxt-link
              >
              <UButton
                variant="link"
                color="gray"
                class="text-sm/6 font-semibold"
                @click="scrollToFeatures"
              >
                Meer informatie <span aria-hidden="true">→</span>
              </UButton>
            </div>

            <!-- Optional: Placeholder for content that scrolls past the sticky phone -->
            <!-- Hide on mobile, show on large screens -->
            <div
              class="mt-16 hidden h-[45rem] lg:flex lg:items-center"
            >
              <div class="space-y-8">
                <!-- Dynamic title and description -->
                <div>
                  <h3
                    class="text-7xl font-semibold text-primary-500 mb-6 font-caveat"
                    id="scroll-demo"
                  >
                    {{ currentFeature.title }}
                  </h3>
                  <p class="mt-2 text-gray-800 min-h-[5rem]">
                    {{ currentFeature.description }}
                  </p>
                </div>
                <!-- Buttons for features -->
                <div class="grid grid-cols-3 gap-2">
                  <UButton
                    v-for="(feature, index) in features"
                    :key="feature.title"
                    :label="feature.title"
                    @click="selectFeature(index)"
                    :variant="
                      selectedFeatureIndex === index
                        ? 'outline'
                        : 'solid'
                    "
                    :icon="feature.icon"
                    color="primary"
                    class="w-52 h-auto justify-start text-left p-2"
                    :class="
                      selectedFeatureIndex === index
                        ? 'font-black'
                        : 'font-bold'
                    "
                    size="lg"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column (Phone Mockup) - Adjusted for mobile -->
          <div
            id="phone-mockup-container"
            class="relative mt-16 h-auto sm:mt-24 lg:sticky lg:top-20 lg:mt-0 lg:h-fit lg:shrink-0 lg:grow lg:pb-40 lg:pt-20"
          >
            <svg
              viewBox="0 0 366 729"
              role="img"
              class="mx-auto w-[22.875rem] max-w-full"
            >
              <title>App screenshot</title>
              <defs>
                <clipPath id="2ade4387-9c63-4fc4-b754-10e687a0d332">
                  <rect width="316" height="684" rx="36" />
                </clipPath>
              </defs>
              <path
                fill="#4B5563"
                d="M363.315 64.213C363.315 22.99 341.312 1 300.092 1H66.751C25.53 1 3.528 22.99 3.528 64.213v44.68l-.857.143A2 2 0 0 0 1 111.009v24.611a2 2 0 0 0 1.671 1.973l.95.158a2.26 2.26 0 0 1-.093.236v26.173c.212.1.398.296.541.643l-1.398.233A2 2 0 0 0 1 167.009v47.611a2 2 0 0 0 1.671 1.973l1.368.228c-.139.319-.314.533-.511.653v16.637c.221.104.414.313.56.689l-1.417.236A2 2 0 0 0 1 237.009v47.611a2 2 0 0 0 1.671 1.973l1.347.225c-.135.294-.302.493-.49.607v377.681c0 41.213 22 63.208 63.223 63.208h95.074c.947-.504 2.717-.843 4.745-.843l.141.001h.194l.086-.001 33.704.005c1.849.043 3.442.37 4.323.838h95.074c41.222 0 63.223-21.999 63.223-63.212v-394.63c-.259-.275-.48-.796-.63-1.47l-.011-.133 1.655-.276A2 2 0 0 0 366 266.62v-77.611a2 2 0 0 0-1.671-1.973l-1.712-.285c.148-.839.396-1.491.698-1.811V64.213Z"
              />
              <path
                fill="#343E4E"
                d="M16 59c0-23.748 19.252-43 43-43h246c23.748 0 43 19.252 43 43v615c0 23.196-18.804 42-42 42H58c-23.196 0-42-18.804-42-42V59Z"
              />
              <foreignObject
                width="316"
                height="684"
                transform="translate(24 24)"
                clip-path="url(#2ade4387-9c63-4fc4-b754-10e687a0d332)"
              >
                <Transition name="fade" mode="out-in">
                  <img
                    :key="currentFeature.image.src"
                    :src="currentFeature.image.src"
                    :alt="currentFeature.image.alt"
                    class="size-full object-cover"
                  />
                </Transition>
              </foreignObject>
            </svg>

            <!-- Mobile Features Section - Overlapping phone -->
            <div
              id="mobile-feature-display"
              class="absolute inset-x-0 bottom-0 block bg-gradient-to-t from-white via-white via-70% to-transparent pt-24 lg:hidden"
            >
              <div class="mx-auto max-w-2xl px-0 md:px-4 text-center">
                <!-- Feature content -->
                <div class="space-y-8">
                  <div>
                    <h3
                      class="text-4xl font-semibold text-primary-500 mb-4 font-caveat"
                    >
                      {{ currentFeature.title }}
                    </h3>
                    <p class="mt-2 text-gray-800 min-h-[5rem]">
                      {{ currentFeature.description }}
                    </p>
                  </div>
                  <div
                    class="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-8"
                  >
                    <UButton
                      v-for="(feature, index) in features"
                      :key="feature.title"
                      :label="feature.title"
                      @click="selectFeature(index)"
                      :variant="
                        selectedFeatureIndex === index
                          ? 'outline'
                          : 'solid'
                      "
                      :icon="feature.icon"
                      color="primary"
                      class="w-full h-auto justify-start text-left text-xs md:text-base p-2"
                      :class="
                        selectedFeatureIndex === index
                          ? 'font-black'
                          : 'font-bold'
                      "
                      size="md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- End lg:flex -->

        <ULandingFAQ :items="items" multiple class="mt-16" />
      </div>
    </div>
  </div>

  <footer class="bg-primary-500 mt-20">
    <div class="mx-auto max-w-7xl px-6 lg:px-8 py-4">
      <div class="flex items-center justify-between">
        <p class="text-white font-semibold text-sm md:text-xl">
          &copy; {{ new Date().getFullYear() }} De Burgerlijke App -
          Alle rechten voorbehouden
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.font-caveat {
  font-family: 'Caveat', cursive;
}

html {
  scroll-behavior: smooth;
}

/* Transition for the image */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
