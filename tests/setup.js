import { config } from '@vue/test-utils';
import { vTooltip } from '@/directives/tooltip';

config.global.directives = {
  ...config.global.directives,
  tooltip: vTooltip,
};
