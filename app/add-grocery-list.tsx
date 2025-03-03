import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGroceryStore } from '@/store/grocery-store';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Colors from '@/constants/colors';
import { ModalLayout } from '@/components/AnimatedLayout';

export default function AddGroceryListScreen() {
  const router = useRouter();
  const { addGroceryList } = useGroceryStore();

  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter a name for your grocery list');
      return;
    }

    addGroceryList(name);
    router.back();
  };

  return (
    <ModalLayout>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <Text style={styles.title}>Create Grocery List</Text>
            <Text style={styles.description}>
              Give your grocery list a name to help you stay
              organized.
            </Text>

            <Input
              label="List Name"
              placeholder="Weekly Groceries"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              error={error}
              containerStyle={styles.inputContainer}
            />

            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                onPress={() => router.back()}
                variant="outline"
                style={styles.cancelButton}
              />
              <Button
                title="Create List"
                onPress={handleSubmit}
                style={styles.submitButton}
              />
            </View>
          </View>
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
