import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { HeroSection } from "./sections/hero-section";
import { StorySection } from "./sections/story-section";
import { FeaturesSection } from "./sections/features-section";
import { HowItWorksSection } from "./sections/how-it-works-section";
import { SocialProofSection } from "./sections/social-proof-section";
import { CTASection } from "./sections/cta-section";
import { FooterSection } from "./sections/footer-section";

interface LandingPageProps {
  onSignIn: () => void;
}

export function LandingPage({ onSignIn }: LandingPageProps) {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <Animated.ScrollView
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      className="flex-1 bg-bg-canvas"
    >
      <HeroSection onSignIn={onSignIn} scrollY={scrollY} />
      <StorySection scrollY={scrollY} />
      <FeaturesSection scrollY={scrollY} />
      <HowItWorksSection scrollY={scrollY} />
      <SocialProofSection />
      <CTASection onSignIn={onSignIn} />
      <FooterSection />
    </Animated.ScrollView>
  );
}
