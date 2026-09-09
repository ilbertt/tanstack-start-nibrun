import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { callLogQueryKey, callLogQueryOptions } from '../queries/calls';
import { recordCall } from '../server/calls';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  const queryClient = useQueryClient();
  const calls = useQuery({
    ...callLogQueryOptions,
    enabled: typeof window !== 'undefined',
  });
  const record = useMutation({
    mutationFn: recordCall,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: callLogQueryKey }),
  });

  function logCall() {
    record.mutate();
  }

  return (
    <main>
      <h1>TanStack Start on Nibrun</h1>
      <p>
        Each server-function call is logged in SQLite and the full log is read with TanStack Query.
      </p>
      <button disabled={record.isPending} onClick={logCall} type="button">
        {record.isPending ? 'Calling server...' : 'Call server function'}
      </button>
      <section aria-labelledby="call-log-heading">
        <h2 id="call-log-heading">Call log</h2>
        {calls.isPending ? <p>Loading call log...</p> : null}
        {calls.error ? <p role="alert">Unable to load the call log.</p> : null}
        {calls.data?.length === 0 ? <p>No calls yet.</p> : null}
        {calls.data?.length ? (
          <ol>
            {calls.data.map((call) => (
              <li key={call.id}>
                <time dateTime={call.created_at}>{call.created_at}</time>
              </li>
            ))}
          </ol>
        ) : null}
      </section>
    </main>
  );
}
