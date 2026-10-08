import React from 'react';

export type CreationType = 'image' | 'story' | 'sound' | 'video' | 'chat';

export type FlexibleCreationType =
  | CreationType
  | 'Image'
  | 'Story'
  | 'Sound'
  | 'Video'
  | 'Chat';

export interface CreationItem {
  id: string;
  title: string;
  type: FlexibleCreationType;
  timestamp: string;
  imageUrl?: string;
  mediaUrl?: string;
  description?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreationAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  isDestructive?: boolean;
  onClick?: (item: CreationItem) => void;
}

export type CreationCardVariant = 'default' | 'graveyard';

export interface CreationCardProps {
  creation: CreationItem;
  variant?: CreationCardVariant;
  actions?: CreationAction[];
  showFavoriteButton?: boolean;
  onOpen?: (item: CreationItem) => void;
  onToggleFavorite?: (item: CreationItem) => void;
  onAction?: (actionKey: string, item: CreationItem) => void;
  className?: string;
}

/**
 * Normalizes any casing ('Image', 'IMAGE', 'image') to canonical CreationType
 */
export function normalizeCreationType(type: string): CreationType {
  const lower = (type || '').toLowerCase();
  switch (lower) {
    case 'image':
      return 'image';
    case 'story':
      return 'story';
    case 'sound':
      return 'sound';
    case 'video':
      return 'video';
    case 'chat':
      return 'chat';
    default:
      return 'image';
  }
}
