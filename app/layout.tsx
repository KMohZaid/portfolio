import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { CustomCursor } from "@/components/CustomCursor";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import config from "@/config.json";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
	weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
	weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
	title: config.site.title,
	description: config.site.description,
	keywords: config.site.keywords,
	authors: [{ name: config.personal.name }],
	openGraph: {
		title: `${config.personal.name} | ${config.personal.role}`,
		description: config.site.description,
		type: "website",
		url: config.site.url,
	},
	twitter: {
		card: "summary_large_image",
		site:
			config.social.twitter !== "none"
				? `@${config.social.twitter.split("/").pop()}`
				: undefined,
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${inter.variable} ${jetbrainsMono.variable}`}
		>
			<body
				className="font-sans antialiased cursor-none"
				suppressHydrationWarning
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem={false}
					storageKey="portfolio-theme"
				>
					<TooltipProvider>
						<CustomCursor />
						{children}
						<Toaster />
						<Sonner />
					</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
