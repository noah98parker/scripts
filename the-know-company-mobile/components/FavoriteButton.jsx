import { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

/**
 * Animated heart button for saving/unsaving parking spots.
 *
 * Props:
 *   isFavorite  - bool: filled heart if true
 *   onPress     - called on tap
 *   size        - icon size (default 28)
 *   style       - extra TouchableOpacity style
 */
export default function FavoriteButton({ isFavorite, onPress, size = 28, style }) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.4, useNativeDriver: true, friction: 4 }),
      Animated.spring(scale, { toValue: 1,   useNativeDriver: true, friction: 5 }),
    ]).start();
    onPress?.();
  }

  return (
    <TouchableOpacity
      style={[styles.btn, style]}
      onPress={handlePress}
      activeOpacity={0.8}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={size}
          color={isFavorite ? colors.red : colors.gray400}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
