import { NextResponse } from "next/server";
import config from "@/config.json";

const USERNAME = config.personal.github_username;
const GITHUB_API = "https://api.github.com";

function githubHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		Accept: "application/vnd.github.v3+json",
		"User-Agent": "portfolio-app",
	};
	if (process.env.GITHUB_TOKEN) {
		headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
	}
	return headers;
}

function parseContributions(html: string): {
	weeks: number[][];
	total: number;
} {
	// Extract total contributions from page text
	const totalMatch = html.match(
		/([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/i,
	);
	const total = totalMatch ? parseInt(totalMatch[1].replace(/,/g, ""), 10) : 0;

	// Parse contribution cells - match data-date and data-level in either order
	const entries: { date: string; level: number }[] = [];
	const regex =
		/data-date="(\d{4}-\d{2}-\d{2})"[^>]*?data-level="(\d)"|data-level="(\d)"[^>]*?data-date="(\d{4}-\d{2}-\d{2})"/g;
	let match;

	while ((match = regex.exec(html)) !== null) {
		const date = match[1] || match[4];
		const level = parseInt(match[2] || match[3], 10);
		if (date) entries.push({ date, level });
	}

	if (entries.length === 0) return { weeks: [], total };

	entries.sort((a, b) => a.date.localeCompare(b.date));

	// Group into weeks (Sunday = start of week)
	const weeks: number[][] = [];
	let currentWeek: number[] = [];

	for (const entry of entries) {
		const d = new Date(entry.date + "T12:00:00Z");
		const dayOfWeek = d.getUTCDay(); // 0 = Sunday

		if (dayOfWeek === 0 && currentWeek.length > 0) {
			weeks.push(currentWeek);
			currentWeek = [];
		}
		currentWeek.push(entry.level);
	}

	if (currentWeek.length > 0) weeks.push(currentWeek);

	return { weeks, total };
}

function formatTimeAgo(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

	if (diffDays === 0) return "today";
	if (diffDays === 1) return "1 day ago";
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffDays < 30)
		return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
	return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? "s" : ""} ago`;
}

function parseSearchResults(items: any[]) {
	if (!Array.isArray(items)) return [];

	return items.slice(0, 8).map((item) => {
		const repo = (item.repository_url || "").replace(
			"https://api.github.com/repos/",
			"",
		);
		const isPR = !!item.pull_request;

		let type: string;
		if (isPR) {
			if (item.pull_request?.merged_at) type = "PR Merged";
			else if (item.state === "open") type = "PR Opened";
			else type = "PR Closed";
		} else {
			type = item.state === "open" ? "Issue Opened" : "Issue Closed";
		}

		return {
			repo,
			type,
			description: (item.title || "").substring(0, 120),
			date: formatTimeAgo(item.created_at),
			rawDate: item.created_at,
			url: item.html_url || `https://github.com/${repo}`,
		};
	});
}

function parseEvents(events: any[]) {
	if (!Array.isArray(events)) return [];

	return events
		.filter((e) => ["PushEvent", "CreateEvent"].includes(e.type))
		.slice(0, 10)
		.map((e) => {
			const repo = e.repo?.name || "";
			let type = "Contribution";
			let description = "";
			let url = `https://github.com/${repo}`;

			if (e.type === "PushEvent") {
				const commits = e.payload?.commits || [];
				const commitCount = commits.length || e.payload?.size || 0;
				if (commitCount === 0) {
					type = "Pushed";
					description = `Pushed to ${e.payload?.ref?.replace("refs/heads/", "") || "branch"}`;
				} else if (commitCount === 1) {
					type = "Committed";
					description = (commits[0]?.message || "").split("\n")[0];
					if (commits[0]?.sha) {
						url = `https://github.com/${repo}/commit/${commits[0].sha}`;
					}
				} else {
					type = "Pushed";
					description = `${commitCount} commits — ${(commits[0]?.message || "").split("\n")[0].substring(0, 80)}`;
					if (e.payload?.before && commits[commitCount - 1]?.sha) {
						url = `https://github.com/${repo}/compare/${e.payload.before.slice(0, 7)}...${commits[commitCount - 1].sha.slice(0, 7)}`;
					}
				}
			} else if (e.type === "CreateEvent") {
				type = "Created";
				description = `Created ${e.payload?.ref_type}${e.payload?.ref ? ` ${e.payload.ref}` : ""}`;
			}

			return {
				repo,
				type,
				description: description.substring(0, 120),
				date: formatTimeAgo(e.created_at),
				rawDate: e.created_at,
				url,
			};
		});
}

export async function GET() {
	try {
		const headers = githubHeaders();

		const sixYearsAgo = new Date();
		sixYearsAgo.setFullYear(sixYearsAgo.getFullYear() - 6);
		const since = sixYearsAgo.toISOString().split("T")[0];

		const [userRes, reposRes, searchRes, eventsRes, contribHtml] =
			await Promise.all([
				fetch(`${GITHUB_API}/users/${USERNAME}`, {
					headers,
					next: { revalidate: 3600 },
				}),
				fetch(
					`${GITHUB_API}/users/${USERNAME}/repos?per_page=100&sort=stars&direction=desc`,
					{ headers, next: { revalidate: 3600 } },
				),
				fetch(
					`${GITHUB_API}/search/issues?q=author:${USERNAME}+created:>${since}&sort=created&order=desc&per_page=20`,
					{ headers, next: { revalidate: 3600 } },
				),
				fetch(`${GITHUB_API}/users/${USERNAME}/events/public?per_page=30`, {
					headers,
					next: { revalidate: 3600 },
				}),
				fetch(`https://github.com/users/${USERNAME}/contributions`, {
					headers: { "User-Agent": "portfolio-app" },
					next: { revalidate: 3600 },
				})
					.then((r) => r.text())
					.catch(() => ""),
			]);

		const user = await userRes.json();
		const repos = await reposRes.json();
		const searchData = await searchRes.json();
		const events = await eventsRes.json();

		const totalStars = Array.isArray(repos)
			? repos.reduce(
					(acc: number, r: any) => acc + (r.stargazers_count || 0),
					0,
				)
			: 0;

		const { weeks, total: totalContributions } =
			parseContributions(contribHtml);

		// Merge search results (PRs/Issues, 6yr range) with events (Push/Create, ~90 days)
		const searchActivity = parseSearchResults(searchData.items || []);
		const eventActivity = parseEvents(events);
		// Deduplicate by URL, then sort all by date (newest first)
		const seenUrls = new Set(searchActivity.map((a) => a.url));
		const mergedActivity = [
			...searchActivity,
			...eventActivity.filter((a) => !seenUrls.has(a.url)),
		]
			.sort(
				(a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime(),
			)
			.slice(0, 10)
			.map(({ rawDate, ...rest }) => rest);

		return NextResponse.json(
			{
				stats: {
					contributions: totalContributions,
					publicRepos: user.public_repos || 0,
					stars: totalStars,
					followers: user.followers || 0,
				},
				contributionGraph: weeks,
				recentContributions: mergedActivity,
			},
			{
				headers: {
					"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
				},
			},
		);
	} catch (error) {
		console.error("GitHub API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch GitHub data" },
			{ status: 500 },
		);
	}
}
