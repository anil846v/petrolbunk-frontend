import { memo } from 'react';

const Card = memo(function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-lg shadow border border-neutral-border p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

export default Card;
