import { createFileRoute } from "@tanstack/react-router";
import { countCallLogs } from "../db/calls";

export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: async () =>
				Response.json({ calls: await countCallLogs(), status: "ok" }),
		},
	},
});
