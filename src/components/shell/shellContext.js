import { inject } from 'vue';
import useLx from '@/hooks/useLx';
import { logError } from '@/utils/devUtils';

export const shellContextKey = Symbol('shellContext');

export function useShellContext() {
  const shellContext = inject(shellContextKey, null);

  if (!shellContext) {
    logError('LxShell: Shell context is not available', useLx().getGlobals()?.environment);
    return {};
  }

  return shellContext;
}
