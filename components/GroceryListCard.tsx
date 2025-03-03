import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { ShoppingCart } from 'lucide-react-native';
import { GroceryList } from '@/types';
import Colors from '@/constants/colors';
import { useRouter } from 'expo-router';

interface GroceryListCardProps {
  groceryList: GroceryList;
}

const GroceryListCard: React.FC<GroceryListCardProps> = ({
  groceryList,
}) => {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/grocery/${groceryList.id}`);
  };

  const completedItems = groceryList.items.filter(
    (item) => item.checked
  ).length;
  const totalItems = groceryList.items.length;
  const progress =
    totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <ShoppingCart size={24} color="#FFFFFF" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{groceryList.name}</Text>
        <Text style={styles.itemCount}>
          {completedItems} of {totalItems} items
        </Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressBar, { width: `${progress}%` }]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 0,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: Colors.text,
  },
  itemCount: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
});

export default GroceryListCard;
