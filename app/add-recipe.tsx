import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRecipeStore } from '@/store/recipe-store';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Colors from '@/constants/colors';
import { parseRecipeFromUrl } from '@/utils/recipe-parser';
import { ModalLayout } from '@/components/AnimatedLayout';

export default function AddRecipeScreen() {
  const router = useRouter();
  const { addRecipe } = useRecipeStore();

  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!url.startsWith('http')) {
      setError('Please enter a valid URL');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const recipe = await parseRecipeFromUrl(url);

      if (recipe) {
        addRecipe(recipe);
        router.back();
      } else {
        setError('Could not extract recipe from this URL');
      }
    } catch (err) {
      console.error('Error parsing recipe:', err);
      setError('An error occurred while parsing the recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <Text style={styles.title}>Add Recipe from URL</Text>
              <Text style={styles.description}>
                Enter the URL of a recipe page, and we'll try to
                extract the recipe information.
              </Text>

              <Input
                label="Recipe URL"
                placeholder="https://example.com/recipe"
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                error={error}
                containerStyle={styles.inputContainer}
              />

              <Text style={styles.note}>
                Note: For demo purposes, any URL containing "recipe",
                "food", or "cook" will work.
              </Text>

              <View style={styles.buttonContainer}>
                <Button
                  title="Cancel"
                  onPress={() => router.back()}
                  variant="outline"
                  style={styles.cancelButton}
                />
                <Button
                  title="Add Recipe"
                  onPress={handleSubmit}
                  loading={loading}
                  disabled={loading}
                  style={styles.submitButton}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ModalLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text,
  },
  description: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  note: {
    fontSize: 14,
    color: Colors.textLight,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
});
