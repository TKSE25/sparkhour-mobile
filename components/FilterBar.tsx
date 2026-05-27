import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { CATEGORIES, CategoryId } from '../types';

interface Props {
  selected: CategoryId;
  onSelect: (category: CategoryId) => void;
}

export default function FilterBar({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((cat) => {
        const isActive = selected === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(cat.id as CategoryId)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={cat.icon as keyof typeof Ionicons.glyphMap}
              size={14}
              color={isActive ? Colors.white : Colors.gray600}
            />
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  chipActive: {
    backgroundColor: Colors.purple,
    borderColor: Colors.purple,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray600,
  },
  chipTextActive: {
    color: Colors.white,
  },
});
