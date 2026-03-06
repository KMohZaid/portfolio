import { Footer } from "@/components/Footer";
import { GridBackground } from "@/components/GridBackground";
import { HomeClientWrapper } from "@/components/HomeClientWrapper";
import { MouseSpotlight } from "@/components/MouseSpotlight";
import { AboutSection } from "@/components/sections/AboutSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { OpenSourceSection } from "@/components/sections/OpenSourceSection";

export default function HomePage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<GridBackground />
			<MouseSpotlight />

			<HomeClientWrapper>
				<main className="relative z-10">
					<HeroSection />
					<AboutSection />
					<ExperienceSection />
					<OpenSourceSection />
					<ContactSection />
					<Footer />
				</main>
			</HomeClientWrapper>
		</div>
	);
}
