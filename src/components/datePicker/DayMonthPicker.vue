<script setup>
import { computed, ref, watch, nextTick } from 'vue';
import { useWindowSize } from '@vueuse/core';
import LxValuePicker from '@/components/ValuePicker.vue';
import LxInfoWrapper from '@/components/InfoWrapper.vue';
import LxIcon from '@/components/Icon.vue';
import { getMonthNames } from '@/utils/dateUtils';
import { maxDayOfMonth } from '@/components/datePicker/helpers';
import { capitalizeFirstLetter, generateUUID } from '@/utils/stringUtils';
import { getDisplayTexts } from '@/utils/generalUtils';
import { hasOverflow } from '@/utils/overflowUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  modelValue: { type: String, default: null }, // 'MM-dd' | null
  disabled: { type: Boolean, default: false },
  invalid: { type: Boolean, default: false },
  invalidationMessage: { type: String, default: null },
  clearIfNotExact: { type: Boolean, default: false },
  locale: { type: String, default: 'lv-LV' },
  placeholder: { type: String, default: null },
  tooltip: { type: String, default: null },
  helperText: { type: String, default: null },
  helperTextKind: { type: String, default: 'label', options: ['label', 'icon'] },
  texts: { type: Object, default: () => ({}) },
  labelledBy: { type: String, default: null },
});

const emits = defineEmits(['update:modelValue']);

const textsDefault = {
  dayPlaceholder: 'dd',
  monthPlaceholder: 'Mēnesis',
  notSelected: 'Nav izvēlēts',
};
const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const pad = (value) => String(value).padStart(2, '0');

const rootRef = ref(null);
const isResponsive = ref(false);
const { width: windowWidth } = useWindowSize();

async function updateResponsiveState() {
  // Measure in the row layout, so the check doesn't flip-flop once stacked.
  isResponsive.value = false;
  await nextTick();
  if (rootRef.value) isResponsive.value = hasOverflow(rootRef.value);
}
watch(windowWidth, updateResponsiveState, { immediate: true, flush: 'post' });

const selectedMonth = ref(null); // 'MM' | null
const selectedDay = ref(null); // 'dd' | null

function currentValue() {
  return selectedMonth.value && selectedDay.value
    ? `${selectedMonth.value}-${selectedDay.value}`
    : null;
}

function emitValue(nv) {
  if (nv === props.modelValue) return;
  emits('update:modelValue', nv);
}

function syncFromModel(value) {
  if (value === currentValue()) return;

  if (value === null || value === undefined || value === '') {
    selectedMonth.value = null;
    selectedDay.value = null;
    return;
  }

  const match = typeof value === 'string' ? value.match(/^(\d{2})-(\d{2})$/) : null;
  if (match) {
    const [, month, day] = match;
    const monthNum = Number(month);
    const dayNum = Number(day);
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= maxDayOfMonth(monthNum - 1)) {
      selectedMonth.value = month;
      selectedDay.value = day;
      return;
    }
  }

  selectedMonth.value = null;
  selectedDay.value = null;
  emitValue(null);
}
watch(() => props.modelValue, syncFromModel, { immediate: true });

const monthItems = computed(() =>
  getMonthNames(props.locale).map((m) => ({
    id: pad(m.orderIndex + 1),
    name: capitalizeFirstLetter(m.fullName),
  }))
);

// Day list is always 1..31 so a day can be picked before/independent of the month; validity reconciled below.
const dayItems = computed(() =>
  Array.from({ length: 31 }, (_, i) => ({ id: pad(i + 1), name: String(i + 1) }))
);

// Closest month to `fromMonth` that can hold `day`; ties prefer the previous month (Feb → January).
function closestMonthForDay(day, fromMonth) {
  const target = Number(day);
  const current = Number(fromMonth) - 1;
  let best = null;
  let bestDist = Infinity;
  for (let i = 0; i < 12; i += 1) {
    if (maxDayOfMonth(i) >= target) {
      const dist = Math.abs(i - current);
      // Strict `<` while iterating ascending keeps the earliest (previous) month on ties.
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
  }
  return best === null ? fromMonth : pad(best + 1);
}

// Month changed → keep month, adapt the day (clamp to month max, or clear if clearIfNotExact).
watch(selectedMonth, () => {
  if (!selectedMonth.value || !selectedDay.value) return;
  const max = maxDayOfMonth(Number(selectedMonth.value) - 1);
  if (Number(selectedDay.value) > max) {
    selectedDay.value = props.clearIfNotExact ? null : pad(max);
  }
});

// Day changed → keep day, adapt the month (shift to closest fitting month, or clear).
watch(selectedDay, () => {
  if (!selectedDay.value || !selectedMonth.value) return;
  const max = maxDayOfMonth(Number(selectedMonth.value) - 1);
  if (Number(selectedDay.value) > max) {
    selectedMonth.value = props.clearIfNotExact
      ? null
      : closestMonthForDay(selectedDay.value, selectedMonth.value);
  }
});

// Emit MM-dd when both parts are set (null otherwise).
watch([selectedMonth, selectedDay], () => emitValue(currentValue()));
</script>

<template>
  <div
    ref="rootRef"
    class="lx-day-month-picker"
    :class="{ 'lx-day-month-responsive': isResponsive }"
    :data-invalid="invalid ? '' : null"
  >
    <div class="lx-day-month-fields">
      <LxValuePicker
        :id="`${id}-day`"
        class="lx-day-month-day"
        variant="dropdown"
        selection-kind="single"
        nullable
        v-model="selectedDay"
        :items="dayItems"
        :disabled="disabled"
        :invalid="invalid"
        :placeholder="displayTexts.dayPlaceholder"
        :tooltip="tooltip"
        :labelId="labelledBy"
        :texts="texts"
      />
      <LxValuePicker
        :id="`${id}-month`"
        class="lx-day-month-month"
        variant="dropdown"
        selection-kind="single"
        nullable
        v-model="selectedMonth"
        :items="monthItems"
        :disabled="disabled"
        :invalid="invalid"
        :placeholder="displayTexts.monthPlaceholder"
        :tooltip="tooltip"
        :labelId="labelledBy"
        :texts="texts"
      />
      <LxInfoWrapper
        v-if="helperTextKind === 'icon' && helperText"
        class="lx-day-month-info"
        placement="top"
      >
        <LxIcon value="info" />
        <template #panel>
          <p class="lx-data">{{ helperText }}</p>
        </template>
      </LxInfoWrapper>
    </div>
    <!-- Shared message area: the invalidation message replaces inline helper text. -->
    <div v-if="invalid" class="lx-invalidation-message" :id="`${id}-invalidation-message`">
      {{ invalidationMessage }}
    </div>
    <p v-else-if="helperTextKind === 'label' && helperText" class="lx-day-month-helper">
      {{ helperText }}
    </p>
  </div>
</template>
