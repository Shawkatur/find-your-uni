import { Text, View, ViewProps } from "react-native";

interface Props extends ViewProps {
  rating: number;
  reviewCount?: number;
  size?: number;
}

export function StarRating({ rating, reviewCount, size = 12, className = "", ...props }: Props) {
  const stars = Math.round(rating);
  return (
    <View className={`flex-row items-center gap-1 ${className}`} {...props}>
      <Text style={{ fontSize: size }}>
        {"★".repeat(stars)}{"☆".repeat(5 - stars)}
      </Text>
      <Text className="text-text-muted" style={{ fontSize: size }}>
        {rating.toFixed(1)}
        {reviewCount !== undefined && ` (${reviewCount})`}
      </Text>
    </View>
  );
}
