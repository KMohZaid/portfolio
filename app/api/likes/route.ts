import { NextResponse } from "next/server";

const COUNTAPI_BASE = process.env.COUNTAPI_BASE!;
const COUNTER_SLUG = process.env.COUNTER_SLUG!;

function authHeaders(): Record<string, string> {
	const token = process.env.COUNTAPI_TOKEN;
	if (!token) return {};
	return { Authorization: `Bearer ${token}` };
}

// GET /api/likes — returns { count }
export async function GET() {
	try {
		const res = await fetch(`${COUNTAPI_BASE}/${COUNTER_SLUG}`, {
			headers: authHeaders(),
			next: { revalidate: 60 },
		});
		const data = await res.json();
		return NextResponse.json({ count: data.data?.up_count ?? 0 });
	} catch (error) {
		console.error("Likes GET error:", error);
		return NextResponse.json({ count: 0 });
	}
}

// POST /api/likes — increment like (cookie check is done client-side)
export async function POST() {
	try {
		const res = await fetch(`${COUNTAPI_BASE}/${COUNTER_SLUG}/up`, {
			headers: authHeaders(),
		});
		const data = await res.json();
		return NextResponse.json({
			count: data.data?.up_count ?? 0,
			hasLiked: true,
		});
	} catch (error) {
		console.error("Likes POST error:", error);
		return NextResponse.json(
			{ error: "Failed to record like" },
			{ status: 500 },
		);
	}
}
