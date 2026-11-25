import { Platform } from 'react-native';

const headingBold = Platform.select({
  web: 'Outfit_700Bold, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'Outfit_700Bold',
});
const headingExtraBold = Platform.select({
  web: 'Outfit_800ExtraBold, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'Outfit_800ExtraBold',
});
const headingBlack = Platform.select({
  web: 'Outfit_900Black, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'Outfit_900Black',
});

const bodyRegular = Platform.select({
  web: 'PlusJakartaSans_400Regular, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'PlusJakartaSans_400Regular',
});
const bodyMedium = Platform.select({
  web: 'PlusJakartaSans_500Medium, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'PlusJakartaSans_500Medium',
});
const bodySemiBold = Platform.select({
  web: 'PlusJakartaSans_600SemiBold, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'PlusJakartaSans_600SemiBold',
});
const bodyBold = Platform.select({
  web: 'PlusJakartaSans_700Bold, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'PlusJakartaSans_700Bold',
});
const bodyExtraBold = Platform.select({
  web: 'PlusJakartaSans_800ExtraBold, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  default: 'PlusJakartaSans_800ExtraBold',
});

const monoNumbers = Platform.select({
  web: '"JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const FONTS = {
  // Heading & Brand Fonts
  headingBold,
  headingExtraBold,
  headingBlack,

  // Clean UI & Body Fonts
  bodyRegular,
  bodyMedium,
  bodySemiBold,
  bodyBold,
  bodyExtraBold,

  // Tabular Numbers
  monoNumbers,

  // Direct Family Aliases
  outfitBold: headingBold,
  outfitExtraBold: headingExtraBold,
  outfitBlack: headingBlack,
  jakartaRegular: bodyRegular,
  jakartaMedium: bodyMedium,
  jakartaSemiBold: bodySemiBold,
  jakartaBold: bodyBold,
  jakartaExtraBold: bodyExtraBold,
};
