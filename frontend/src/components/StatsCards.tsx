import React from 'react';

interface StatsCardsProps {
  size: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  size,
}) => {
  return (
    <section className="grid grid-cols-1" data-purpose="metrics-grid">
      
      {/* Card 1: Size */}
      <div className="metric-card p-2.5 rounded-xl flex flex-col justify-between h-14 transition-all duration-300">
        <span className="text-[8px] text-gray-500 uppercase tracking-wider font-bold truncate">Size</span>
        <div className="text-white text-xs font-semibold truncate">
          {size.toFixed(1)} MB
        </div>
      </div>

    </section>
  );
};
