import { ref, computed } from 'vue';

// Define a simple interface for weather information
export interface WeatherInfo {
  location: string;
  temperature: number; // Celsius
  description: string;
  icon: string; // Nuxt UI icon name
  symbolCode?: string; // Add symbolCode to the interface
  chanceOfRain?: number; // Added: Probability of precipitation (%)
}

// Interface for Hourly Forecast items
export interface HourlyForecastItem {
  time: string; // Formatted time (e.g., "14:00")
  temperature: number;
  icon: string;
  description: string;
}

// Interfaces based on Met Norway Locationforecast 2.0 Compact response
interface MetNorwayTimeSeriesData {
  instant: {
    details: {
      air_temperature?: number;
      // Add other instant details if needed
    };
  };
  next_1_hours?: {
    summary: {
      symbol_code?: string;
    };
    // Add other forecast details if needed
    details?: {
      // Added details object
      probability_of_precipitation?: number; // Added precipitation probability
    };
  };
  // Add next_6_hours, next_12_hours if needed
}

interface MetNorwayProperties {
  timeseries: {
    time: string;
    data: MetNorwayTimeSeriesData;
  }[];
}

interface MetNorwayResponse {
  type: string;
  geometry: any; // Not strictly needed for this use case
  properties: MetNorwayProperties;
}

// --- Weather Symbol Mapping ---
interface WeatherSymbolMapping {
  description: string;
  icon: string;
}

// Simplified mapping from Met Norway symbol_code to description and icon
// See: https://api.met.no/weatherapi/weathericon/2.0/documentation
const weatherSymbolMap: Record<string, WeatherSymbolMapping> = {
  clearsky_day: {
    description: 'Heldere lucht',
    icon: 'i-heroicons-sun-solid',
  },
  clearsky_night: {
    description: 'Heldere nacht',
    icon: 'i-heroicons-moon-solid',
  },
  fair_day: {
    description: 'Licht bewolkt',
    icon: 'i-heroicons-cloud-sun',
  }, // Adjusted icon
  fair_night: {
    description: 'Licht bewolkt (nacht)',
    icon: 'i-heroicons-cloud-moon',
  }, // Adjusted icon
  partlycloudy_day: {
    description: 'Half bewolkt',
    icon: 'i-heroicons-cloud-solid',
  }, // Adjusted icon
  partlycloudy_night: {
    description: 'Half bewolkt (nacht)',
    icon: 'i-heroicons-cloud-solid',
  },
  cloudy: { description: 'Bewolkt', icon: 'i-heroicons-cloud-solid' },
  lightrainshowers_day: {
    description: 'Lichte regenbuien',
    icon: 'i-heroicons-cloud-arrow-down',
  }, // Adjusted icon
  lightrainshowers_night: {
    description: 'Lichte regenbuien (nacht)',
    icon: 'i-heroicons-cloud-arrow-down',
  },
  rainshowers_day: {
    description: 'Regenbuien',
    icon: 'i-heroicons-cloud-arrow-down',
  },
  rainshowers_night: {
    description: 'Regenbuien (nacht)',
    icon: 'i-heroicons-cloud-arrow-down',
  },
  heavyrainshowers_day: {
    description: 'Zware regenbuien',
    icon: 'i-heroicons-cloud-arrow-down',
  },
  heavyrainshowers_night: {
    description: 'Zware regenbuien (nacht)',
    icon: 'i-heroicons-cloud-arrow-down',
  },
  lightrain: {
    description: 'Lichte regen',
    icon: 'i-heroicons-cloud-arrow-down',
  },
  rain: {
    description: 'Regen',
    icon: 'i-heroicons-cloud-arrow-down',
  },
  heavyrain: {
    description: 'Zware regen',
    icon: 'i-heroicons-cloud-arrow-down',
  },
  lightsleet: {
    description: 'Lichte natte sneeuw',
    icon: 'i-heroicons-cloud-snow',
  }, // Adjusted icon
  sleet: {
    description: 'Natte sneeuw',
    icon: 'i-heroicons-cloud-snow',
  },
  heavysleet: {
    description: 'Zware natte sneeuw',
    icon: 'i-heroicons-cloud-snow',
  },
  lightsnow: {
    description: 'Lichte sneeuw',
    icon: 'i-heroicons-cloud-snow',
  },
  snow: { description: 'Sneeuw', icon: 'i-heroicons-cloud-snow' },
  heavysnow: {
    description: 'Zware sneeuw',
    icon: 'i-heroicons-cloud-snow',
  },
  fog: {
    description: 'Mist',
    icon: 'i-heroicons-bars-3-bottom-left',
  }, // Adjusted icon
  // Add more mappings as needed
};

const defaultWeather: WeatherSymbolMapping = {
  description: 'Weer onbekend',
  icon: 'i-heroicons-question-mark-circle', // Fallback icon
};

const getMappedWeather = (
  symbolCode?: string
): WeatherSymbolMapping => {
  if (!symbolCode) return defaultWeather;
  return weatherSymbolMap[symbolCode] || defaultWeather;
};

// --- Weather Character Image Logic ---
const getWeatherCharacterImage = (
  weather: WeatherInfo | null
): string => {
  if (!weather) return '/man_summer_long.png'; // Default or loading image

  const temp = weather.temperature;
  const symbol = weather.symbolCode?.toLowerCase() || '';

  // Prioritize rain
  if (
    symbol.includes('rain') ||
    symbol.includes('shower') ||
    symbol.includes('sleet')
  ) {
    return '/man_raining.png';
  }

  // Check for winter conditions
  if (temp < 5 || symbol.includes('snow')) {
    return '/man_winter.png';
  }

  // Check for warm summer
  if (temp >= 20) {
    return '/man_summer_short.png';
  }

  // Default to mild/long sleeve summer
  return '/man_summer_long.png';
};

export const useWeather = (
  latitude: number = 52.37,
  longitude: number = 4.89,
  locationName: string = 'Amsterdam'
) => {
  const weatherData = ref<WeatherInfo | null>(null);
  const isLoading = ref<boolean>(false);
  const error = ref<Error | null>(null);
  const hourlyForecast = ref<HourlyForecastItem[]>([]); // Add ref for hourly forecast

  // Computed property for the character image
  const characterImage = computed(() =>
    getWeatherCharacterImage(weatherData.value)
  );

  const fetchWeather = async () => {
    isLoading.value = true;
    error.value = null;
    weatherData.value = null;
    hourlyForecast.value = []; // Reset hourly forecast on new fetch

    // Define a unique User-Agent (replace with your app details)
    const userAgent =
      'DeBurgerlijkeApp/1.0 (https://github.com/your-repo/de-burgerlijke-app; your.email@example.com)';
    const apiUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latitude}&lon=${longitude}`;

    try {
      const response = await $fetch<MetNorwayResponse>(apiUrl, {
        headers: {
          'User-Agent': userAgent,
        },
      });

      // Find the most recent timeseries data (usually the first entry)
      const currentTimeseries = response.properties?.timeseries?.[0];
      const futureTimeseries =
        response.properties?.timeseries?.slice(1, 7) || []; // Get next 6 hours

      if (currentTimeseries?.data) {
        const temp =
          currentTimeseries.data.instant.details.air_temperature;
        const symbolCode =
          currentTimeseries.data.next_1_hours?.summary.symbol_code;
        const mappedWeather = getMappedWeather(symbolCode);
        const chanceOfRain =
          currentTimeseries.data.next_1_hours?.details
            ?.probability_of_precipitation;

        if (temp !== undefined) {
          weatherData.value = {
            location: locationName, // Use the provided location name
            temperature: Math.round(temp), // Round temperature
            description: mappedWeather.description,
            icon: mappedWeather.icon,
            symbolCode: symbolCode, // Store the symbol code
            chanceOfRain:
              chanceOfRain !== undefined
                ? Math.round(chanceOfRain)
                : undefined, // Add rounded chance of rain
          };
        } else {
          throw new Error(
            'Temperatuurgegevens niet beschikbaar in API-respons.'
          );
        }
      } else {
        throw new Error(
          'Ongeldige of ontbrekende timeseries data in API-respons.'
        );
      }

      // Process hourly forecast data
      const forecastItems: HourlyForecastItem[] = [];
      for (const series of futureTimeseries) {
        const hourTemp =
          series.data?.instant?.details?.air_temperature;
        const hourSymbolCode =
          series.data?.next_1_hours?.summary?.symbol_code;
        const hourTime = series.time; // UTC time string

        if (
          hourTemp !== undefined &&
          hourSymbolCode !== undefined &&
          hourTime
        ) {
          const mappedWeather = getMappedWeather(hourSymbolCode);
          // Format time to HH:MM (adjust for local timezone if needed, here assuming local display)
          const localTime = new Date(hourTime).toLocaleTimeString(
            'nl-NL',
            {
              hour: '2-digit',
              minute: '2-digit',
              // timeZone: 'Europe/Amsterdam' // Explicitly set timezone if server is not NL
            }
          );

          forecastItems.push({
            time: localTime,
            temperature: Math.round(hourTemp),
            icon: mappedWeather.icon,
            description: mappedWeather.description,
          });
        }
      }
      hourlyForecast.value = forecastItems;
    } catch (err) {
      console.error('Failed to fetch weather data:', err);
      error.value =
        err instanceof Error
          ? err
          : new Error('Kon weergegevens niet ophalen.'); // More user-friendly error
    } finally {
      isLoading.value = false;
    }
  };

  // Fetch weather immediately when the composable is used
  if (import.meta.client) {
    // Only fetch on client-side to avoid SSR issues/warnings with $fetch
    fetchWeather();
  }
  // Alternatively, trigger manually from the component:
  // onMounted(() => fetchWeather());

  return {
    weatherData,
    isLoading,
    error,
    fetchWeather, // Expose refetch function
    characterImage, // Expose the computed image path
    hourlyForecast, // Expose hourly forecast data
  };
};
