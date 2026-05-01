import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const FormInput: React.FC<InputProps> = ({ label, ...props }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <input className="form-input" {...props} />
  </div>
);