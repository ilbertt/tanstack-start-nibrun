import { createServerFn } from "@tanstack/react-start";

export const getServerTime = createServerFn({ method: "GET" }).handler(() => ({
	now: new Date().toISOString(),
}));
