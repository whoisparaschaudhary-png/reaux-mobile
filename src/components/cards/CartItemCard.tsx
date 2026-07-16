import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, borderRadius, spacing } from '../../theme';
import { formatCurrency } from '../../utils/formatters';
import { ms } from '../../utils/responsive';
import type { CartItem, Product } from '../../types/models';

interface CartItemCardProps {
  item: CartItem;
  onRemove: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

export const CartItemCard: React.FC<CartItemCardProps> = ({
  item,
  onRemove,
  onIncrement,
  onDecrement,
}) => {
  const product = item.product as Product;
  const isPopulated = typeof product === 'object' && product !== null;

  const productName  = isPopulated ? product.name : 'Product';
  const productPrice = isPopulated ? product.price : 0;
  const productImage = isPopulated ? product.images?.[0] : undefined;
  const productStock = isPopulated ? product.stock : 0;
  const lineTotal    = productPrice * item.quantity;

  const decrementDisabled = !onDecrement || item.quantity <= 1;
  const incrementDisabled = !onIncrement || item.quantity >= productStock;

  return (
    <View style={styles.container}>
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: productImage }}
          style={styles.image}
          contentFit="cover"
          placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
          transition={200}
        />
      </View>

      <View style={styles.details}>
        <Text style={styles.name} numberOfLines={2}>
          {productName}
        </Text>
        {item.flavour ? (
          <Text style={styles.flavour} numberOfLines={1}>
            {item.flavour}
          </Text>
        ) : null}
        <Text style={styles.price}>{formatCurrency(productPrice)}</Text>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            onPress={onDecrement}
            disabled={decrementDisabled}
            style={[styles.stepperButton, decrementDisabled && styles.stepperButtonDisabled]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="remove"
              size={ms(16)}
              color={decrementDisabled ? colors.text.light : colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={onIncrement}
            disabled={incrementDisabled}
            style={[styles.stepperButton, incrementDisabled && styles.stepperButtonDisabled]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="add"
              size={ms(16)}
              color={incrementDisabled ? colors.text.light : colors.text.primary}
            />
          </TouchableOpacity>
          <Text style={styles.lineTotal}>{formatCurrency(lineTotal)}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onRemove}
        style={styles.removeButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={ms(20)} color={colors.status.error} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  imageWrap: {
    width: ms(72),
    height: ms(72),
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.border.light,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  details: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  name: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    lineHeight: ms(18),
    color: colors.text.primary,
    marginBottom: ms(2),
  },
  flavour: {
    fontFamily: fontFamily.medium,
    fontSize: ms(12),
    lineHeight: ms(16),
    color: colors.text.light,
    marginBottom: spacing.xs,
  },
  price: {
    fontFamily: fontFamily.regular,
    fontSize: ms(13),
    lineHeight: ms(18),
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperButton: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border.light,
    borderWidth: 1,
    borderColor: colors.border.gray,
  },
  stepperButtonDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(14),
    color: colors.text.primary,
    minWidth: ms(28),
    textAlign: 'center',
    marginHorizontal: spacing.xs,
  },
  lineTotal: {
    fontFamily: fontFamily.bold,
    fontSize: ms(14),
    color: colors.text.primary,
    marginLeft: spacing.md,
  },
  removeButton: {
    width: ms(36),
    height: ms(36),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ms(18),
    backgroundColor: '#fee2e2',
  },
});
