import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Check, Pencil, Trash2 } from 'lucide-react-native';
import { Todo } from '@/types';
import Colors from '@/constants/colors';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(todo.title);

  const handleToggle = () => {
    onToggle(todo.id);
  };

  const handleDelete = () => {
    onDelete(todo.id);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedTitle.trim()) {
      onUpdate(todo.id, editedTitle);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedTitle(todo.title);
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.checkbox,
          todo.completed && styles.checkboxChecked,
        ]}
        onPress={handleToggle}
      >
        {todo.completed && <Check size={16} color="#FFFFFF" />}
      </TouchableOpacity>

      <View style={styles.content}>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={editedTitle}
            onChangeText={setEditedTitle}
            autoFocus
            onBlur={handleCancel}
            onSubmitEditing={handleSave}
          />
        ) : (
          <Text
            style={[
              styles.title,
              todo.completed && styles.titleCompleted,
            ]}
          >
            {todo.title}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        {!isEditing && !todo.completed && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleEdit}
          >
            <Pencil size={18} color={Colors.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleDelete}
        >
          <Trash2 size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 6,
    backgroundColor: Colors.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.gray[400],
  },
  input: {
    fontSize: 16,
    color: Colors.text,
    padding: 0,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    marginHorizontal: 2,
  },
});

export default TodoItem;
