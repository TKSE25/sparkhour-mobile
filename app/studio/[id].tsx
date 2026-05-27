import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useSpace } from '../../hooks/useStudios';
import LoadingSpinner from '../../components/LoadingSpinner';

const { width } = Dimensions.get('window');

export default function StudioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { space, isLoading, error } = useSpace(id);
  const [selectedImage, setSelectedImage] = useState(0);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error || !space) {
    return (
      <SafeAreaView style={styles.errorScreen}>
        <Text style={styles.errorText}>{error ?? 'Studio not found'}</Text>
      </SafeAreaView>
    );
  }

  const images = space.images ?? space.image_urls ?? [];

  async function handleShare() {
    await Share.share({
      message: `Check out ${space!.name} on SparkHour — AED ${space!.price_per_hour}/hr`,
    });
  }

  function handleBook() {
    router.push(`/booking/${id}`);
  }

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image gallery */}
        <View style={styles.gallery}>
          {images.length > 0 ? (
            <Image
              source={{ uri: images[selectedImage] }}
              style={styles.mainImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.mainImage, styles.imagePlaceholder]}>
              <Ionicons name="camera-outline" size={64} color={Colors.gray400} />
            </View>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnailStrip}
              contentContainerStyle={styles.thumbnailContainer}
            >
              {images.map((img, i) => (
                <TouchableOpacity key={i} onPress={() => setSelectedImage(i)}>
                  <Image
                    source={{ uri: img }}
                    style={[
                      styles.thumbnail,
                      selectedImage === i && styles.thumbnailActive,
                    ]}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Details */}
        <View style={styles.details}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <Text style={styles.name}>{space.name}</Text>
            <TouchableOpacity onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color={Colors.gray600} />
            </TouchableOpacity>
          </View>

          {/* Meta row */}
          <View style={styles.metaRow}>
            {(space.area || space.location) && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={Colors.gray400} />
                <Text style={styles.metaText}>{space.area ?? space.location}</Text>
              </View>
            )}
            {space.capacity && (
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={14} color={Colors.gray400} />
                <Text style={styles.metaText}>Up to {space.capacity} people</Text>
              </View>
            )}
            {space.rating && (
              <View style={styles.metaItem}>
                <Ionicons name="star" size={14} color={Colors.yellow} />
                <Text style={styles.metaText}>
                  {space.rating.toFixed(1)} ({space.total_reviews ?? 0} reviews)
                </Text>
              </View>
            )}
          </View>

          {/* Category badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {space.category?.charAt(0).toUpperCase() + (space.category?.slice(1) ?? '')}
            </Text>
          </View>

          {/* Description */}
          {space.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this studio</Text>
              <Text style={styles.description}>{space.description}</Text>
            </View>
          )}

          {/* Amenities */}
          {space.amenities && space.amenities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {space.amenities.map((amenity, i) => (
                  <View key={i} style={styles.amenityItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Host */}
          {space.profiles && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hosted by</Text>
              <View style={styles.hostRow}>
                <View style={styles.hostAvatar}>
                  {space.profiles.avatar_url ? (
                    <Image
                      source={{ uri: space.profiles.avatar_url }}
                      style={styles.hostAvatarImg}
                      contentFit="cover"
                    />
                  ) : (
                    <Text style={styles.hostInitial}>
                      {space.profiles.full_name?.charAt(0) ?? 'H'}
                    </Text>
                  )}
                </View>
                <Text style={styles.hostName}>{space.profiles.full_name}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Book button */}
      <View style={styles.bookBar}>
        <View style={styles.priceGroup}>
          <Text style={styles.priceLabel}>Per hour</Text>
          <Text style={styles.price}>AED {space.price_per_hour?.toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.bookBtn} onPress={handleBook} activeOpacity={0.85}>
          <Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.white },
  errorScreen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.error, fontSize: 16 },
  gallery: { backgroundColor: Colors.navy },
  mainImage: { width, height: width * 0.65 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.gray100 },
  thumbnailStrip: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  thumbnailContainer: { padding: 8, gap: 6 },
  thumbnail: {
    width: 56, height: 42, borderRadius: 6, borderWidth: 2, borderColor: 'transparent',
  },
  thumbnailActive: { borderColor: Colors.purple },
  details: { padding: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '800', color: Colors.navy, flex: 1, marginRight: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: Colors.gray600 },
  categoryBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.purpleLight,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 20,
  },
  categoryText: { fontSize: 12, fontWeight: '700', color: Colors.purple },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.navy, marginBottom: 8 },
  description: { fontSize: 14, color: Colors.gray600, lineHeight: 22 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '45%' },
  amenityText: { fontSize: 13, color: Colors.gray600 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hostAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.purpleLight, alignItems: 'center', justifyContent: 'center',
  },
  hostAvatarImg: { width: 44, height: 44, borderRadius: 22 },
  hostInitial: { fontSize: 18, fontWeight: '700', color: Colors.purple },
  hostName: { fontSize: 15, fontWeight: '600', color: Colors.navy },
  bookBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: Colors.gray200, backgroundColor: Colors.white,
  },
  priceGroup: {},
  priceLabel: { fontSize: 11, color: Colors.gray400 },
  price: { fontSize: 22, fontWeight: '800', color: Colors.navy },
  bookBtn: {
    backgroundColor: Colors.purple, borderRadius: 14,
    paddingHorizontal: 32, paddingVertical: 15,
  },
  bookBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
