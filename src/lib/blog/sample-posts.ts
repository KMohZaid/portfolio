import type { BlogPost } from "./types";

const date = "2026-01-15T12:00:00.000Z";

export const samplePosts: BlogPost[] = [
  {
    _id: "sample-python-usefulness",
    title: "Why Python Remains Useful",
    slug: "why-python-remains-useful",
    excerpt: "Python is valuable not because it is the fastest language, but because it makes many kinds of useful work approachable.",
    status: "published",
    createdAt: date,
    updatedAt: date,
    publishedAt: date,
    content: { type: "doc", content: [
      { type: "paragraph", content: [{ type: "text", text: "Python earns its place by reducing the distance between an idea and a working tool. Its readable syntax helps teams communicate intent, while a broad ecosystem makes it practical for automation, data analysis, web services, and machine learning." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Optimize for the whole task" }] },
      { type: "paragraph", content: [{ type: "text", text: "Raw execution speed is only one part of engineering cost. For scripts, internal tools, and data workflows, development time, maintenance, and available libraries often matter more. When performance becomes a constraint, profile first and move only measured hot paths to faster implementations." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "A practical default, not a universal answer" }] },
      { type: "paragraph", content: [{ type: "text", text: "Python is not ideal for every latency-sensitive or resource-constrained system. The useful lesson is to choose a language based on the job: Python is a strong default when clarity, ecosystem, and iteration speed are central requirements." }] },
    ] },
  },
  {
    _id: "sample-idempotency",
    title: "A Practical Guide to Idempotency",
    slug: "a-practical-guide-to-idempotency",
    excerpt: "Idempotency turns retries from a source of duplicate side effects into a safe part of reliable systems.",
    status: "published",
    createdAt: date,
    updatedAt: date,
    publishedAt: date,
    content: { type: "doc", content: [
      { type: "paragraph", content: [{ type: "text", text: "An operation is idempotent when repeating it has the same effect as doing it once. This property is essential when clients retry after a timeout: the server may have completed the first request even though its response never arrived." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Use a stable request key" }] },
      { type: "paragraph", content: [{ type: "text", text: "For operations that create side effects, accept an idempotency key scoped to the account and operation. Store the key alongside the result in the same transaction as the work. If the same key arrives again, return the stored result instead of repeating the side effect." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Design for expiration and conflicts" }] },
      { type: "paragraph", content: [{ type: "text", text: "Define how long keys remain valid, reject reuse with a different request body, and enforce uniqueness in the database. These details make retry behavior predictable and prevent concurrent duplicate requests from racing past application-only checks." }] },
    ] },
  },
  {
    _id: "sample-transactions",
    title: "Transactions: Make Related Changes All-or-Nothing",
    slug: "transactions-all-or-nothing",
    excerpt: "Transactions protect invariants when one logical operation must update several rows together.",
    status: "published",
    createdAt: date,
    updatedAt: date,
    publishedAt: date,
    content: { type: "doc", content: [
      { type: "paragraph", content: [{ type: "text", text: "A transaction groups database changes so they either all commit or none do. This matters whenever partial success would leave the system in a state that violates a business rule, such as decrementing inventory without recording an order." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Keep invariants near the data" }] },
      { type: "paragraph", content: [{ type: "text", text: "Application code can coordinate several writes, but a process can fail between them. A database transaction narrows that failure window and lets constraints enforce rules such as non-negative balances or unique identifiers. Prefer a short transaction that checks and updates relevant records together." }] },
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Transactions do not replace good boundaries" }] },
      { type: "paragraph", content: [{ type: "text", text: "Do not hold a transaction open while waiting on email, a payment provider, or a slow network call. Commit durable state first, then use an outbox or retryable job for external side effects. If payments are added later, keep payment records and provider reconciliation separate from blog post data." }] },
    ] },
  },
];
