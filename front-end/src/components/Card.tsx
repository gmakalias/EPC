import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, children }) => (
  <div className="card">
    {title && <h3 className="card-title">{title}</h3>}
    {children}
  </div>
);

export default Card;