import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
	if (typeof window === "undefined") {
		return new QueryClient();
	}

	browserQueryClient ??= new QueryClient();
	return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={getQueryClient()}>
			{children}
		</QueryClientProvider>
	);
}
