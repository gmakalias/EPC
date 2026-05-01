import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  icon?: string;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', icon, ...props }) => (
  <button className={`btn btn-${variant}`} {...props}>
    {icon && <span>{icon}</span>}
    {children}
  </button>
);

export default Button;