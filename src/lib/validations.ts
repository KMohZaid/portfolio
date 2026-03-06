import { z } from "zod";

// Contact Form
export const contactSchema = z.object({
	name: z.string().min(1, "Name is required").max(100),
	email: z.string().email("Invalid email address"),
	message: z.string().min(10, "Message must be at least 10 characters"),
	subject: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
