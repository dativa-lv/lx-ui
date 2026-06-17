import useLx from '@/hooks/useLx';
import { logWarn } from '@/utils/devUtils';

export function makeIntegerValidator(propName) {
  return (v, p) => {
    if (!Number.isInteger(Number(v))) {
      logWarn(
        `LxNumberSlider [${p.id}]: "${propName}" cannot be a decimal, LxNumberSlider only supports whole numbers`,
        useLx().getGlobals()?.environment
      );
      return false;
    }
    return true;
  };
}
