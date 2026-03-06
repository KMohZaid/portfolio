import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TypewriterTextProps {
	texts: string[];
	className?: string;
}

export const TypewriterText = ({
	texts,
	className = "",
}: TypewriterTextProps) => {
	const [currentTextIndex, setCurrentTextIndex] = useState(0);
	const [displayText, setDisplayText] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		const currentFullText = texts[currentTextIndex];
		const typingSpeed = isDeleting ? 50 : 100;

		const timeout = setTimeout(() => {
			if (!isDeleting) {
				if (displayText.length < currentFullText.length) {
					setDisplayText(currentFullText.slice(0, displayText.length + 1));
				} else {
					setTimeout(() => setIsDeleting(true), 2000);
				}
			} else {
				if (displayText.length > 0) {
					setDisplayText(displayText.slice(0, -1));
				} else {
					setIsDeleting(false);
					setCurrentTextIndex((prev) => (prev + 1) % texts.length);
				}
			}
		}, typingSpeed);

		return () => clearTimeout(timeout);
	}, [displayText, isDeleting, currentTextIndex, texts]);

	return (
		<span className={className}>
			{displayText}
			<motion.span
				animate={{ opacity: [1, 0] }}
				transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
				className="inline-block w-0.5 h-6 bg-primary ml-1 align-middle"
			/>
		</span>
	);
};
