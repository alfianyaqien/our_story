import { Star } from 'lucide-react';

interface EmojiStarRatingProps {
  value: number | undefined;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Emoji mapping for different satisfaction levels
const ratingEmojis: { [key: number]: { emoji: string; label: string; color: string } } = {
  1: { emoji: '😢', label: 'Very Disappointed', color: 'text-red-500' },
  2: { emoji: '😕', label: 'Disappointed', color: 'text-orange-500' },
  3: { emoji: '😐', label: 'Average', color: 'text-yellow-500' },
  4: { emoji: '😊', label: 'Good', color: 'text-lime-500' },
  5: { emoji: '😍', label: 'Excellent', color: 'text-green-500' },
};

export default function EmojiStarRating({ value, onChange, readonly = false, size = 'md' }: EmojiStarRatingProps) {
  const sizeClasses = {
    sm: { emoji: 'text-2xl', star: 20, gap: 'gap-1' },
    md: { emoji: 'text-3xl', star: 24, gap: 'gap-2' },
    lg: { emoji: 'text-4xl', star: 32, gap: 'gap-3' },
  };

  const currentSize = sizeClasses[size];
  const currentRating = value || 0;

  return (
    <div className="space-y-3">
      {/* Star selection. Readonly ratings render as plain marks with a single
          accessible label - not five disabled buttons. Interactive stars get a
          44px hit area so they are comfortable to tap on a phone. */}
      <div
        className={`flex items-center ${currentSize.gap}`}
        role={readonly ? 'img' : undefined}
        aria-label={readonly ? `Rated ${currentRating} out of 5` : undefined}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isSelected = star <= currentRating;

          const mark = (
            <Star
              size={currentSize.star}
              className={`
                ${isSelected ? 'fill-current' : ''}
                ${isSelected && ratingEmojis[star] ? ratingEmojis[star].color : 'text-muted/40'}
                transition-colors duration-200
              `}
            />
          );

          if (readonly) {
            return (
              <span
                key={star}
                className={`transition-all duration-200 ${isSelected ? 'scale-110' : 'opacity-50'}`}
              >
                {mark}
              </span>
            );
          }

          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange && onChange(star)}
              aria-label={`${star} - ${ratingEmojis[star].label}`}
              aria-pressed={isSelected}
              className={`
                grid h-11 w-11 place-items-center rounded-lg
                transition-all duration-200 transform
                hover:scale-110 hover:opacity-100 cursor-pointer
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50
                ${isSelected ? 'scale-105' : 'opacity-50'}
              `}
              title={ratingEmojis[star].label}
            >
              {mark}
            </button>
          );
        })}
      </div>

      {/* Emoji and Label Display */}
      {currentRating > 0 && (
        <div className="flex items-center gap-3 animate-fade-in">
          <span className={`${currentSize.emoji} leading-none`}>
            {ratingEmojis[currentRating].emoji}
          </span>
          <div>
            <span className={`font-semibold ${ratingEmojis[currentRating].color} text-sm`}>
              {ratingEmojis[currentRating].label}
            </span>
            {!readonly && (
              <p className="text-xs text-muted">
                {currentRating}/5 stars
              </p>
            )}
          </div>
        </div>
      )}

      {/* Placeholder when no rating */}
      {currentRating === 0 && !readonly && (
        <p className="text-sm text-muted italic">
          Click the stars to rate your experience
        </p>
      )}
    </div>
  );
}

// Compact version for list view
interface CompactEmojiRatingProps {
  value: number | undefined;
}

export function CompactEmojiRating({ value }: CompactEmojiRatingProps) {
  if (!value || value < 1 || value > 5) return null;

  const rating = ratingEmojis[value];

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface rounded-full border border-default shadow-soft">
      <span className="text-lg leading-none">{rating.emoji}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={12}
            className={`
              ${star <= value ? 'fill-current' : ''}
              ${rating.color}
            `}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-muted">
        {value}/5
      </span>
    </div>
  );
}
