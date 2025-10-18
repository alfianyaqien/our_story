export interface User {
  id: number;
  username: string;
  displayName: string;
  password: string;
  email?: string;
  emailVerified?: boolean;
  accountStatus?: 'active' | 'inactive' | 'suspended';
}

export interface LoveLetter {
  id: number;
  fromUserId: number;
  toUserId: number;
  subject: string;
  content: string;
  encryptedContent: string;
  createdAt: string;
  isRead: boolean;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: number;
  filename: string;
  caption: string;
  uploadedBy: number;
  uploadedAt: string;
  dateTaken?: string;
}

export interface Album {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  coverPhotoId: number | null;
  coverPhotoPath: string | null;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LetterTemplate {
  id: number;
  name: string;
  category: string;
  content: string;
  placeholders: string[];
}

export interface TravelPlan {
  id: number;
  destination: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  notes: string;
  status: 'wishlist' | 'planning' | 'booked' | 'completed';
  createdAt: string;
}

export interface Recipe {
  id: number;
  name: string;
  ingredients: string;
  instructions: string;
  cookingTime?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  isFavorite: boolean;
  createdAt: string;
}

export interface WishlistItem {
  id: number;
  userId: number;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  price?: number;
  link?: string;
  status: 'wished' | 'planned' | 'purchased';
  createdAt: string;
}

export interface Session {
  userId: number;
  username: string;
  displayName: string;
}
