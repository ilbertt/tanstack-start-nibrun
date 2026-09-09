import { createServerFn } from '@tanstack/react-start';
import { createCallLog, listCallLogs as readCallLogs } from '../db/calls';

export const recordCall = createServerFn({ method: 'POST' }).handler(() =>
  createCallLog(new Date().toISOString()),
);

export const listCallLogs = createServerFn({ method: 'GET' }).handler(readCallLogs);
