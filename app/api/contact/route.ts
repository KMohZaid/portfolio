import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { contactSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Validate request body
		const validatedData = contactSchema.parse(body);

		// TODO: Implement email sending (e.g., using Resend, SendGrid)
		// For now, just log and return success
		console.log("Contact form submission:", validatedData);

		// Simulate email sending
		await new Promise((resolve) => setTimeout(resolve, 500));

		return NextResponse.json(
			{
				message: "Message sent successfully!",
				data: validatedData,
			},
			{ status: 200 },
		);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: "Validation failed",
					details: error.errors,
				},
				{ status: 400 },
			);
		}

		console.error("Contact API error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
