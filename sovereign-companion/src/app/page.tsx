import Background from "@/components/layout/Background";
import ParticleField from "@/components/landing/ParticleField";
import HeroSection from "@/components/landing/HeroSection";

export default function LandingPage() {
  return (
    <main className="relative flex-1 overflow-hidden">
      <Background />
      <ParticleField />
      <HeroSection />
    </main>
  );
}
