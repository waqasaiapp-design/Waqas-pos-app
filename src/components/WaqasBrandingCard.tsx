import React from 'react';
import { WaqasDualProfileCards, WaqasDualProfileCardsProps } from './WaqasDualProfileCards';
import { MartOwnerProfile } from '../types/pos';

export interface WaqasBrandingCardProps {
  className?: string;
  variant?: 'sidebar' | 'sidebar-dark' | 'banner' | 'compact' | 'full' | 'owner-card';
  profile?: MartOwnerProfile;
  compactOnMobile?: boolean;
}

/**
 * WaqasBrandingCard
 * Shared wrapper rendering the Dual Owner Profile Cards:
 * 1. Software Owner (Permanently Locked - Waqas Ahmad)
 * 2. Mart Owner (Customizable via Settings - Female Owner Portrait)
 */
export const WaqasBrandingCard: React.FC<WaqasBrandingCardProps> = ({
  className = '',
  variant = 'owner-card',
  profile,
}) => {
  let dualVariant: 'sale-area' | 'banner' | 'sidebar' | 'compact' = 'sale-area';

  if (variant === 'owner-card') {
    dualVariant = 'sale-area';
  } else if (variant === 'banner' || variant === 'full') {
    dualVariant = 'banner';
  } else if (variant === 'sidebar' || variant === 'sidebar-dark') {
    dualVariant = 'sidebar';
  } else if (variant === 'compact') {
    dualVariant = 'compact';
  }

  return (
    <WaqasDualProfileCards
      className={className}
      variant={dualVariant}
      customMartOwner={profile}
    />
  );
};
