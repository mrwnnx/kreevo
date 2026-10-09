import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Mirrors the light theme tokens in src/app/globals.css
const colors = {
  background: "#ffffff",
  foreground: "oklch(0.12 0.008 265)",
  muted: "oklch(0.50 0.010 265)",
};

export type KreevoIntroProps = {
  title: string;
  tagline: string;
};

export const KreevoIntro: React.FC<KreevoIntroProps> = ({ title, tagline }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 200 } });
  const taglineIn = spring({ frame: frame - 20, fps, config: { damping: 200 } });
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', system-ui, sans-serif",
        opacity: fadeOut,
      }}
    >
      <div
        style={{
          fontSize: 180,
          fontWeight: 700,
          letterSpacing: -6,
          color: colors.foreground,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0])}px)`,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 56,
          color: colors.muted,
          opacity: taglineIn,
          transform: `translateY(${interpolate(taglineIn, [0, 1], [20, 0])}px)`,
        }}
      >
        {tagline}
      </div>
    </AbsoluteFill>
  );
};
