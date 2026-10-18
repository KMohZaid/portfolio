import { Footer } from "@/components/Footer";
import { HomeClientWrapper } from "@/components/HomeClientWrapper";
import { MouseSpotlight } from "@/components/MouseSpotlight";
import { AboutSection } from "@/components/sections/AboutSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { getAdminEmail, getSignedInUser } from "@/lib/blog/auth";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { OpenSourceSection } from "@/components/sections/OpenSourceSection";

export default async function HomePage() {
	const [user, adminEmail] = await Promise.all([getSignedInUser(), getAdminEmail()]);
	const initialAuthState = { signedIn: Boolean(user), authenticated: Boolean(adminEmail) };
	return (
		<div className="min-h-screen bg-background text-foreground">
			<MouseSpotlight />

			<HomeClientWrapper initialAuthState={initialAuthState}>
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
