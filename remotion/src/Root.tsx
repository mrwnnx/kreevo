import { Composition } from "remotion";
import { KreevoIntro } from "./KreevoIntro";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="KreevoIntro"
      component={KreevoIntro}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        title: "Kreevo",
        tagline: "Design Challenges & Leagues",
      }}
    />
  );
};
