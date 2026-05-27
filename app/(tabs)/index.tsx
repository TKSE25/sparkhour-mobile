import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { CategoryId, Space } from '../../types';
import { useStudios } from '../../hooks/useStudios';
import { useAuthStore } from '../../store/authStore';
import StudioCard from '../../components/StudioCard';
import FilterBar from '../../components/FilterBar';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ExploreScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [category, setCategory] = useState<CategoryId>('all');
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { spaces, isLoading, error, refetch } = useStudios({
    category,
    search: searchQuery,
  });

  function handleSearch() {
    setSearchQuery(search);
  }

  function openStudio(id: string) {
    router.push(`/studio/${id}`);
  }

  const renderCard = ({ item, index }: { item: Space; index: number }) => (
    <View style={index % 2 === 0 ? styles.cardLeft : styles.cardRight}>
      <StudioCard space={item} onPress={() => openStudio(item.id)} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.navy} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hey {profile?.full_name?.split(' ')[0] ?? 'there'} 👋
          </Text>
          <Text style={styles.headerTitle}>Find your studio</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search studios…"
            placeholderTextColor={Colors.gray400}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearch('');
                setSearchQuery('');
              }}
            >
              <Ionicons name="close-circle" size={18} color={Colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filters */}
      <FilterBar selected={category} onSelect={setCategory} />

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : spaces.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="camera-outline" size={64} color={Colors.gray200} />
          <Text style={styles.emptyTitle}>No studios found</Text>
          <Text style={styles.emptySubtitle}>
            Try a different category or search term
          </Text>
        </View>
      ) : (
        <FlatList
          data={spaces}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={Colors.purple}
            />
          }
          ListHeaderComponent={
            <Text style={styles.resultsCount}>
              {spaces.length} studio{spaces.length !== 1 ? 's' : ''} available
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 13,
    color: Colors.gray400,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.navy,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    backgroundColor: Colors.offWhite,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardLeft: {
    flex: 1,
    marginRight: 8,
  },
  cardRight: {
    flex: 1,
    marginLeft: 8,
  },
  resultsCount: {
    fontSize: 13,
    color: Colors.gray600,
    marginVertical: 12,
    paddingTop: 4,
    backgroundColor: Colors.offWhite,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.offWhite,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.gray600,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Colors.purple,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.offWhite,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.navy,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.gray400,
    textAlign: 'center',
  },
});
