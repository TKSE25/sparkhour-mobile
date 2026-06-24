import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Space } from '../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Props {
  space: Space;
  onPress: () => void;
  wide?: boolean;
}

function getFirstImage(space: Space): string | null {
  const imgs = space.images ?? space.image_urls ?? [];
  return imgs.length > 0 ? imgs[0] : null;
}

export default function StudioCard({ space, onPress, wide = false }: Props) {
  const imageUrl = getFirstImage(space);
  const cardStyle = wide ? [styles.card, styles.cardWide] : styles.card;

  return (
    <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={32} color={Colors.gray400} />
          </View>
        )}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {space.category?.charAt(0).toUpperCase() + (space.category?.slice(1) ?? '')}
          </Text>
        </View>
        {space.instant_book ? (
          <View style={styles.instantBadge}>
            <Ionicons name="flash" size={10} color={Colors.white} />
            <Text style={styles.instantText}>Instant</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {space.name}
        </Text>

        {(space.area || space.location) && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={Colors.gray400} />
            <Text style={styles.location} numberOfLines={1}>
              {space.area ?? space.location}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.price}>
            <Text style={styles.priceAmount}>
              AED {space.price_per_hour?.toLocaleString()}
            </Text>
            <Text style={styles.priceUnit}>/hr</Text>
          </Text>

          {space.rating != null && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={11} color={Colors.yellow} />
              <Text style={styles.rating}>
                {space.rating.toFixed(1)}
                {space.total_reviews ? ` (${space.total_reviews})` : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardWide: {
    width: width - 32,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    backgroundColor: Colors.gray100,
  },
  imagePlaceholder: {
    width: '100%',
    height: CARD_WIDTH * 0.75,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.navy + 'cc',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  instantBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  instantText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  info: {
    padding: 10,
    gap: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.navy,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  location: {
    fontSize: 11,
    color: Colors.gray400,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  price: {},
  priceAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.purple,
  },
  priceUnit: {
    fontSize: 11,
    color: Colors.gray400,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rating: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray600,
  },
});
