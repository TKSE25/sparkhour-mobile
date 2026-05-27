export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'guest' | 'host';
  phone: string | null;
  created_at: string;
}

export interface Space {
  id: string;
  host_id: string;
  name: string;
  description: string | null;
  category: string;
  area: string | null;
  location: string | null;
  price_per_hour: number;
  capacity: number | null;
  amenities: string[] | null;
  images: string[] | null;
  image_urls: string[] | null;
  is_active: boolean;
  rating: number | null;
  total_reviews: number | null;
  created_at: string;
  profiles?: Pick<Profile, 'full_name' | 'avatar_url'>;
}

export interface Booking {
  id: string;
  guest_id: string;
  space_id: string;
  host_id: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  payment_intent_id: string | null;
  coupon_code: string | null;
  discount_amount: number | null;
  notes: string | null;
  created_at: string;
  spaces?: Pick<Space, 'id' | 'name' | 'images' | 'image_urls' | 'area' | 'category'>;
  profiles?: Pick<Profile, 'full_name' | 'avatar_url'>;
}

export interface Message {
  id: string;
  booking_id: string | null;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Pick<Profile, 'full_name' | 'avatar_url'>;
}

export interface Conversation {
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  booking_id: string | null;
}

export interface Review {
  id: string;
  space_id: string;
  guest_id: string;
  booking_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: Pick<Profile, 'full_name' | 'avatar_url'>;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
}

export const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'grid' },
  { id: 'photography', label: 'Photo', icon: 'camera' },
  { id: 'music', label: 'Music', icon: 'musical-notes' },
  { id: 'podcast', label: 'Podcast', icon: 'mic' },
  { id: 'dance', label: 'Dance', icon: 'body' },
  { id: 'events', label: 'Events', icon: 'star' },
  { id: 'art', label: 'Art', icon: 'brush' },
  { id: 'video', label: 'Video', icon: 'videocam' },
] as const;

export type CategoryId = typeof CATEGORIES[number]['id'];
