import { Platform, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
  className?: string;
};

const TYPE_CLASS: Record<NonNullable<ThemedTextProps['type']>, string> = {
  default: 'text-base font-medium leading-6',
  title: 'text-5xl font-semibold leading-[52px]',
  small: 'text-sm font-medium leading-5',
  smallBold: 'text-sm font-bold leading-5',
  subtitle: 'text-[32px] font-semibold leading-[44px]',
  link: 'text-sm leading-[30px]',
  linkPrimary: 'text-sm leading-[30px] text-[#3c87f7]',
  code: 'text-xs',
};

export function ThemedText({ style, type = 'default', themeColor, className, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      className={`${TYPE_CLASS[type]} ${className ?? ''}`.trim()}
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'code' && {
          fontFamily: Fonts.mono,
          fontWeight: Platform.select({ android: 700 }) ?? 500,
        },
        style,
      ]}
      {...rest}
    />
  );
}
