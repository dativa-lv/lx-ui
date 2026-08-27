import useLx from '@/hooks/useLx';
import { logWarn } from '@/utils/devUtils';

export function makeIntegerValidator(propName) {
  return (v, p) => {
    if (!Number.isInteger(Number(v))) {
      logWarn(
        `LxNumberInput [${p.id}]: "${propName}" cannot be a decimal, LxNumberInput only supports whole numbers`,
        useLx().getGlobals()?.environment
      );
      return false;
    }
    return true;
  };
}
