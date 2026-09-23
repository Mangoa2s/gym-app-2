import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color: string;
};

/** The double-slider "adjust" icon repeated in the top-right corner of every card. */
export function FilterIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M6 2.4v3.2M6 10.4V15.6M12 2.4v5.2M12 12.4v3.2"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle cx={6} cy={8} r={2.2} stroke={color} strokeWidth={1.5} />
      <Circle cx={12} cy={10} r={2.2} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

/** Rounded-square plus icon in the header, for adding a new workout. */
export function AddIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Rect x={2.6} y={2.6} width={12.8} height={12.8} rx={4} stroke={color} strokeWidth={1.5} />
      <Path d="M9 6.2v5.6M6.2 9h5.6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Two squares + a plus "square" — the CTA button's leading icon. */
export function StartIcon({ size = 26, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <Rect x={2} y={2} width={9} height={9} rx={2.5} stroke={color} strokeWidth={2.6} />
      <Path d="M19.5 2.6v7.8M15.6 6.5h7.8" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
      <Rect x={2} y={15} width={9} height={9} rx={2.5} stroke={color} strokeWidth={2.6} />
      <Rect x={15} y={15} width={9} height={9} rx={2.5} stroke={color} strokeWidth={2.6} />
    </Svg>
  );
}

/** 2x2 grid — "Übersicht" nav tab. */
export function NavGridIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Rect x={2.5} y={2.5} width={7} height={7} rx={1.8} stroke={color} strokeWidth={1.6} />
      <Rect x={12.5} y={2.5} width={7} height={7} rx={1.8} stroke={color} strokeWidth={1.6} />
      <Rect x={2.5} y={12.5} width={7} height={7} rx={1.8} stroke={color} strokeWidth={1.6} />
      <Rect x={12.5} y={12.5} width={7} height={7} rx={1.8} stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

/** Calendar — "Kalender" nav tab. */
export function NavCalendarIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Rect x={2.8} y={4} width={16.4} height={15.2} rx={4} stroke={color} strokeWidth={1.6} />
      <Path
        d="M7 2.6v3M15 2.6v3M7.2 11.6h7.6M7.2 15.2h4.4"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Checkmark trend card — "Verlauf" nav tab. */
export function NavHistoryIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Rect x={2.5} y={3.4} width={17} height={15.2} rx={4.4} stroke={color} strokeWidth={1.6} />
      <Path
        d="M6 14.6l3.6-4.2 2.6 2.4 3.8-4.6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Speech bubble — "Notizen" nav tab (rendered with a red unread dot by the caller). */
export function NavChatIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M3 9.4c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6s-2.7 6-6 6h-3.2L6 18.8v-3.9A6 6 0 013 9.4z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
