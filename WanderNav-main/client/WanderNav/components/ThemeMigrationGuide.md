# Theme Migration Guide

## Overview
This app now uses a comprehensive theming system that supports light and dark modes with automatic system detection.

## Key Features
- ✅ **Light & Dark Themes**: Complete color palettes for both modes
- ✅ **System Detection**: Automatically follows device theme settings
- ✅ **Manual Override**: Users can manually switch themes
- ✅ **Persistent Storage**: Theme preference is saved and restored
- ✅ **TypeScript Support**: Full type safety for all theme properties
- ✅ **Scalable Architecture**: Easy to add custom themes

## How to Use

### 1. Basic Theme Usage
```tsx
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.BACKGROUND_PRIMARY }}>
      <Text style={{ color: theme.colors.TEXT_PRIMARY }}>
        Hello World
      </Text>
      <TouchableOpacity onPress={toggleTheme}>
        <Text>Toggle Theme</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### 2. Using Specific Theme Hooks
```tsx
import { useThemeColors, useThemeSpacing, useThemeTypography } from '../contexts/ThemeContext';

const MyComponent = () => {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();
  
  return (
    <View style={{ 
      backgroundColor: colors.BACKGROUND_SURFACE,
      padding: spacing.md,
      borderRadius: 12
    }}>
      <Text style={{
        fontSize: typography.body.fontSize,
        color: colors.TEXT_PRIMARY
      }}>
        Styled Text
      </Text>
    </View>
  );
};
```

### 3. Theme-Aware Styling
```tsx
import { useTheme } from '../contexts/ThemeContext';

const MyComponent = () => {
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.BACKGROUND_PRIMARY,
      borderColor: theme.colors.BORDER_COLOR,
    },
    text: {
      color: theme.colors.TEXT_PRIMARY,
      fontSize: theme.typography.body.fontSize,
    },
    button: {
      backgroundColor: theme.colors.ACCENT_COLOR,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
    },
  });
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Content</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={{ color: theme.colors.WHITE }}>Button</Text>
      </TouchableOpacity>
    </View>
  );
};
```

## Migration Steps

### Step 1: Replace Hardcoded Colors
**Before:**
```tsx
<View style={{ backgroundColor: '#FFFFFF' }}>
  <Text style={{ color: '#000000' }}>Text</Text>
</View>
```

**After:**
```tsx
const { theme } = useTheme();
<View style={{ backgroundColor: theme.colors.BACKGROUND_PRIMARY }}>
  <Text style={{ color: theme.colors.TEXT_PRIMARY }}>Text</Text>
</View>
```

### Step 2: Update StyleSheet Usage
**Before:**
```tsx
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
});
```

**After:**
```tsx
const { theme } = useTheme();
const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.BACKGROUND_PRIMARY,
    borderColor: theme.colors.BORDER_COLOR,
  },
});
```

### Step 3: Replace THEME Constants
**Before:**
```tsx
import { THEME } from '../constants/theme';
<View style={{ backgroundColor: THEME.BACKGROUND_PRIMARY }}>
```

**After:**
```tsx
import { useTheme } from '../contexts/ThemeContext';
const { theme } = useTheme();
<View style={{ backgroundColor: theme.colors.BACKGROUND_PRIMARY }}>
```

## Theme Properties

### Colors
- `PRIMARY_BRAND_COLOR` - Main brand color
- `ACCENT_COLOR` - Secondary accent color
- `BACKGROUND_PRIMARY` - Main background
- `BACKGROUND_SECONDARY` - Secondary background
- `BACKGROUND_SURFACE` - Surface/card background
- `TEXT_PRIMARY` - Main text color
- `TEXT_SECONDARY` - Secondary text color
- `TEXT_TERTIARY` - Tertiary text color
- `BORDER_COLOR` - Border color
- `SUCCESS_COLOR` - Success states
- `WARNING_COLOR` - Warning states
- `ERROR_COLOR` - Error states

### Spacing
- `xs: 4` - Extra small spacing
- `sm: 8` - Small spacing
- `md: 16` - Medium spacing
- `lg: 24` - Large spacing
- `xl: 32` - Extra large spacing
- `xxl: 48` - Double extra large spacing

### Typography
- `h1`, `h2`, `h3` - Headings
- `body` - Body text
- `caption` - Caption text
- `button` - Button text

### Border Radius
- `xs: 4` - Extra small radius
- `sm: 8` - Small radius
- `md: 12` - Medium radius
- `lg: 16` - Large radius
- `xl: 20` - Extra large radius
- `round: 50` - Round/circular

### Shadows
- `sm` - Small shadow
- `md` - Medium shadow
- `lg` - Large shadow

## Testing Theme Changes

### Add Theme Toggle to Any Screen
```tsx
import { ThemeToggle } from '../components/ThemeToggle';

const MyScreen = () => {
  return (
    <View>
      <ThemeToggle style={{ position: 'absolute', top: 50, right: 20 }} />
      {/* Your screen content */}
    </View>
  );
};
```

## Best Practices

1. **Always use theme colors** - Never hardcode colors
2. **Use semantic color names** - Use `TEXT_PRIMARY` instead of `#000000`
3. **Test both themes** - Ensure your UI looks good in both light and dark modes
4. **Use spacing consistently** - Use theme spacing values for consistency
5. **Consider contrast** - Ensure text is readable on all backgrounds

## Troubleshooting

### Theme not updating
- Ensure component is wrapped in `ThemeProvider`
- Check that `useTheme()` is called within the provider
- Verify theme mode is set correctly

### Colors not changing
- Make sure you're using `theme.colors.COLOR_NAME` instead of hardcoded values
- Check that the color exists in both light and dark themes
- Verify the theme context is properly initialized

### Performance issues
- Use `useThemeColors()` for color-only access
- Avoid calling `useTheme()` in render loops
- Consider memoizing theme-dependent styles 