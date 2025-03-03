import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Trash2, Check } from 'lucide-react-native';
import { GroceryItem as GroceryItemType } from '@/types';
import Colors from '@/constants/colors';

interface GroceryItemProps {
  item: GroceryItemType;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const GroceryItem: React.FC<GroceryItemProps> = ({
  item,
  onToggle,
  onDelete,
}) => {
  const handleToggle = () => {
    onToggle(item.id);
  };

  const handleDelete = () => {
    onDelete(item.id);
  };

  const formatQuantity = (quantity: number, unit: string) => {
    const formattedQuantity = Number.isInteger(quantity)
      ? quantity.toString()
      : quantity.toFixed(1);

    return `${formattedQuantity} ${unit}`.trim();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.checkbox,
          item.checked && styles.checkboxChecked,
        ]}
        onPress={handleToggle}
      >
        {item.checked && <Check size={16} color="#FFFFFF" />}
      </TouchableOpacity>

      <View style={styles.content}>
        <Text
          style={[styles.title, item.checked && styles.titleChecked]}
        >
          {item.name}
        </Text>
        {(item.quantity > 0 || item.unit) && (
          <Text style={styles.quantity}>
            {formatQuantity(item.quantity, item.unit)}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
      >
        <Trash2 size={18} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginVertical: 4,
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
  titleChecked: {
    textDecorationLine: 'line-through',
    color: Colors.gray[400],
  },
  quantity: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
  },
});

export default GroceryItem;
