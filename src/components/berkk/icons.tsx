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

/** Filled ghost silhouette with cutout eyes (the gradient behind shows through) — the CTA button's leading mark. */
export function GhostIcon({ size = 26, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5,20 V11 A8,8 0 0 1 21,11 V20
           a2.667,2.667 0 0 1 -5.333,0
           a2.667,2.667 0 0 1 -5.333,0
           a2.667,2.667 0 0 1 -5.333,0
           Z
           M11.6,14 a1.6,1.6 0 1 0 -3.2,0 a1.6,1.6 0 1 0 3.2,0 Z
           M17.6,14 a1.6,1.6 0 1 0 -3.2,0 a1.6,1.6 0 1 0 3.2,0 Z"
        fill={color}
      />
    </Svg>
  );
}

/** Outline play triangle with rounded joins — the CTA button's leading mark. */
export function PlayIcon({ size = 24, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.5 5.2v13.6c0 .8.9 1.3 1.6.9l10.6-6.8c.6-.4.6-1.3 0-1.7L9.1 4.3c-.7-.4-1.6.1-1.6.9z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
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

/** Lightning bolt — the "Wie fühlst du dich?" energy card's leading icon. */
export function EnergyIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M11.2 2.2L4.4 11.1h5l-1 6.7 6.9-9.1h-5.1l1-6.5z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Chevron pointing left — the login screen's back button. */
export function ArrowLeftIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M11 3.6L5.4 9l5.6 5.4"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Arrow pointing right — the login CTA button's trailing icon. */
export function ArrowRightIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path d="M4 11h14M12.4 5.4L18 11l-5.6 5.6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Envelope — leading icon for the email field. */
export function MailIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Rect x={2} y={3.8} width={14} height={10.4} rx={2.4} stroke={color} strokeWidth={1.5} />
      <Path d="M2.6 4.8L9 9.8l6.4-5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Padlock — leading icon for the password field. */
export function LockIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Rect x={3.4} y={8} width={11.2} height={7.4} rx={2.4} stroke={color} strokeWidth={1.5} />
      <Path d="M5.8 8V5.6a3.2 3.2 0 016.4 0V8" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

/** Open eye — "show password" toggle. */
export function EyeIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M1.6 9S4.4 3.6 9 3.6 16.4 9 16.4 9 13.6 14.4 9 14.4 1.6 9 1.6 9z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Circle cx={9} cy={9} r={2.3} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

/** Eye with a strike-through — "hide password" toggle. */
export function EyeOffIcon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M2.4 2.4l13.2 13.2M7.3 7.4a2.3 2.3 0 003.2 3.2M5.1 5.2C3.1 6.4 1.6 9 1.6 9s2.8 5.4 7.4 5.4c1.4 0 2.6-.5 3.6-1.1M10.9 4.1c-.6-.2-1.2-.3-1.9-.3-4.6 0-7.4 5.4-7.4 5.4M16.4 9s-.8 1.6-2.4 3"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
