import { Hono } from "hono";

import { commentsCommands } from "./content/comments/comments.commands";
import { commentsQueries } from "./content/comments/comments.queries";
import { contentCommands } from "./content/content.commands";
import { contentQueries } from "./content/content.queries";
import { likesCommands } from "./content/likes/likes.commands";
import { likesQueries } from "./content/likes/likes.queries";
import { shareCommands } from "./content/share/share.commands";
import { shareQueries } from "./content/share/share.queries";
import type { BlogBindings } from "./environment";
import { healthRoute } from "./infra/health.route";
import { corsAndSecurity, createRequestId } from "./middleware/auth";

const app = new Hono<{
  Bindings: BlogBindings;
  Variables: { userId: string; requestId: string };
}>();

app.use("*", corsAndSecurity);
app.use("*", createRequestId);

app.route("/content", contentCommands);
app.route("/content", contentQueries);
app.route("/comments", commentsCommands);
app.route("/comments", commentsQueries);
app.route("/likes", likesCommands);
app.route("/likes", likesQueries);
app.route("/shares", shareCommands);
app.route("/shares", shareQueries);
app.route("/health", healthRoute);

app.notFound((c) => c.json({ error: "Not Found" }, 404));

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

export default app;
