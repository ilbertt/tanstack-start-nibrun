import { queryOptions } from '@tanstack/react-query';
import { listCallLogs } from '../server/calls';

export const callLogQueryKey = ['call-log'] as const;

export const callLogQueryOptions = queryOptions({
  queryKey: callLogQueryKey,
  queryFn: listCallLogs,
});
