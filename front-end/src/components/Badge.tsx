import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'active' | 'draft' | 'retired' | 'cfs' | 'rfs' | 'resource';
}

const Badge: React.FC<BadgeProps> = ({ label, variant = 'active' }) => (
  <span className={`badge badge-${variant}`}>{label}</span>
);

export default Badge;