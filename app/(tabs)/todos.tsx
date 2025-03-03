import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { CheckSquare, Plus } from 'lucide-react-native';
import { useTodoStore } from '@/store/todo-store';
import TodoItem from '@/components/TodoItem';
import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/colors';
import { mockTodos } from '@/mocks/todos';

export default function TodosScreen() {
  const { todos, addTodo, updateTodo, deleteTodo, toggleTodo } = useTodoStore();
  const [newTodo, setNewTodo] = useState('');

  // Add mock todos on first load if no todos exist
  useEffect(() => {
    if (todos.length === 0) {
      mockTodos.forEach(todo => {
        addTodo(todo.title);
        
        // If the todo is completed, toggle it
        if (todo.completed) {
          // We need to find the ID of the newly added todo
          const addedTodo = useTodoStore.getState().todos.find(
            t => t.title === todo.title
          );
          if (addedTodo) {
            toggleTodo(addedTodo.id);
          }
        }
      });
    }
  }, []);

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      addTodo(newTodo);
      setNewTodo('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={todos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TodoItem
              todo={item}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onUpdate={updateTodo}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon={CheckSquare}
              title="No to-dos yet"
              message="Add your first to-do using the input below"
            />
          }
        />
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a new to-do..."
            value={newTodo}
            onChangeText={setNewTodo}
            onSubmitEditing={handleAddTodo}
            returnKeyType="done"
          />
          <TouchableOpacity 
            style={[
              styles.addButton,
              !newTodo.trim() && styles.addButtonDisabled
            ]} 
            onPress={handleAddTodo}
            disabled={!newTodo.trim()}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.gray[100],
    borderRadius: 24,
    paddingHorizontal: 16,
    marginRight: 12,
    fontSize: 16,
    color: Colors.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: Colors.gray[300],
  },
});