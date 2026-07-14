<script setup>
import {
  computed,
  ref,
  watch,
  inject,
  getCurrentInstance,
  onUnmounted,
  reactive,
  nextTick,
} from 'vue';
import { useWindowSize } from '@vueuse/core';
import { IMaskDirective as vImask } from 'vue-imask';
import LxTextInput from '@/components/TextInput.vue';
import LxValuePicker from '@/components/ValuePicker.vue';
import LxInfoWrapper from '@/components/InfoWrapper.vue';
import LxIcon from '@/components/Icon.vue';
import LxEmptyValue from '@/components/EmptyValue.vue';
import { getDisplayTexts, isDefined } from '@/utils/generalUtils';
import { capitalizeFirstLetter, generateUUID } from '@/utils/stringUtils';
import { registerBuilderInstance, unregisterBuilderInstance } from '@/utils/builderUtils';
import { logWarn } from '@/utils/devUtils';
import { pluralize } from '@/utils/formatUtils';
import { hasOverflow } from '@/utils/overflowUtils';
import useLx from '@/hooks/useLx';
import { DURATION_CONVERSION } from '@/constants';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  modelValue: { type: [Number, Object], default: null },
  disabled: { type: Boolean, default: false, group: 'mode', sequence: 2 },
  readOnly: { type: Boolean, default: false, group: 'mode', sequence: 1 },
  kind: { type: String, default: 'label', options: ['label', 'icon'], group: 'main', sequence: 1 }, // result kind: label, icon
  variant: {
    type: String,
    default: 'default',
    options: ['default', 'hours', 'days', 'months'],
    group: 'main',
    sequence: 2,
  },
  invalid: { type: Boolean, default: false },
  invalidationMessage: { type: String, default: null },
  labelId: { type: String, default: null },
  texts: { type: Object, default: () => ({}), group: 'additional', sequence: 100 },
  builderOptions: {
    type: Object,
    default: () => ({
      innerComponent: false,
      componentStack: null,
      schemaPath: null,
      useRegistry: false,
    }),
  },
});

const textsDefault = {
  emptyValue: 'Nav norādīts',
  inputDaysPlaceholder: 'Ievadiet dienu skaitu',
  inputMonthsPlaceholder: 'Ievadiet mēnešu skaitu',
  inputYearsPlaceholder: 'Ievadiet gadu skaitu',
  inputTooltip: 'Dienu, mēnešu vai gadu ievade',
  dropdownPlaceholder: 'Izvēlieties vērtību',
  dropdownTooltip: 'Dienu, mēnešu vai gadu izvēle',
  noResults: 'Nav rezultāta',
  minutesPlural: 'minūtes',
  hoursPlural: 'stundas',
  daysPlural: 'dienas',
  monthsPlural: 'mēneši',
  yearsPlural: 'gadi',
  minutesSingular: 'minūte',
  hoursSingular: 'stunda',
  daysSingular: 'diena',
  monthsSingular: 'mēnesis',
  yearsSingular: 'gads',
  helperTextLabel: 'Papildu informācija',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const emits = defineEmits(['update:modelValue']);

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

const SEGMENTED_FIELDS_BY_VARIANT = {
  months: ['months', 'days', 'hours', 'minutes'],
  days: ['days', 'hours', 'minutes'],
  hours: ['hours', 'minutes'],
};

const SEGMENTED_FIELDS_CONFIG = {
  months: {
    maxLength: 2,
    textKeys: ['monthsSingular', 'monthsPlural'],
    unit: { name: 'month', fallback: 'Mēn' },
  },
  days: {
    maxLength: 3,
    textKeys: ['daysSingular', 'daysPlural'],
    unit: { name: 'day', fallback: 'D' },
  },
  hours: {
    maxLength: 2,
    textKeys: ['hoursSingular', 'hoursPlural'],
    unit: { name: 'hour', fallback: 'St' },
  },
  minutes: {
    maxLength: 2,
    textKeys: ['minutesSingular', 'minutesPlural'],
    unit: { name: 'minute', fallback: 'Min' },
  },
};

const durationInputWrapper = ref(null);

const isResponsive = ref(false);

async function updateResponsiveState() {
  isResponsive.value = false;

  if (props.variant === 'default' || props.readOnly) {
    return;
  }

  await nextTick();
  isResponsive.value = hasOverflow(durationInputWrapper.value);
}

const { width: windowWidth } = useWindowSize();

watch(
  [windowWidth, () => props.variant, () => props.kind, () => props.readOnly],
  updateResponsiveState,
  { immediate: true, flush: 'post' }
);

const isSegmentedVariant = computed(() => !!SEGMENTED_FIELDS_BY_VARIANT[props.variant]);

const singleInputKind = ref('default');
const singleInputMask = ref('integer');
const singleConvertToString = ref(false);
const singleInputMaxLength = ref(4);
const singleUnitOptions = ref([
  { id: 'days', name: capitalizeFirstLetter(displayTexts.value.daysPlural) },
  { id: 'months', name: capitalizeFirstLetter(displayTexts.value.monthsPlural) },
  { id: 'years', name: capitalizeFirstLetter(displayTexts.value.yearsPlural) },
]);

const singleValue = ref(null);
const singleUnit = ref('days');
const singlePlaceholder = ref('');

const singleUnitName = computed(() => {
  const selectedUnitType = singleUnitOptions.value.find((unit) => unit.id === singleUnit.value);
  return selectedUnitType ? selectedUnitType.name : '';
});

const result = ref('');

function updateSinglePlaceholder(unit) {
  if (unit === 'days') {
    singlePlaceholder.value = displayTexts.value.inputDaysPlaceholder;
  } else if (unit === 'months') {
    singlePlaceholder.value = displayTexts.value.inputMonthsPlaceholder;
  } else if (unit === 'years') {
    singlePlaceholder.value = displayTexts.value.inputYearsPlaceholder;
  }
}

function getResultPart(value, singularTextKey, pluralTextKey) {
  if (value <= 0) {
    return '';
  }

  const forms = {
    one: displayTexts.value[singularTextKey],
    other: displayTexts.value[pluralTextKey],
  };
  const unitText = pluralize(value, forms);

  return unitText ? `${value} ${unitText}` : '';
}

function clearSingleModelValue() {
  const currentValue = model.value;

  if (typeof currentValue === 'number') {
    model.value = null;
  } else if (
    typeof currentValue === 'object' &&
    isDefined(currentValue?.value) &&
    currentValue.value !== ''
  ) {
    model.value = {
      value: null,
      unit: singleUnit.value,
    };
  }
}

function calculateSingleResult() {
  if (
    singleValue.value === null ||
    singleValue.value === undefined ||
    singleValue.value === '' ||
    typeof singleValue.value !== 'number' ||
    Number.isNaN(singleValue.value)
  ) {
    result.value = '';
    clearSingleModelValue();
    return;
  }

  const { value } = singleValue;

  let years = 0;
  let months = 0;
  let days = 0;
  let daysResult = 0;

  switch (singleUnit.value) {
    case 'years':
      years = Math.floor(value);
      daysResult = Math.floor(value * DURATION_CONVERSION.DAYS_IN_YEAR_APPROX);
      break;

    case 'months':
      years = Math.floor(value / DURATION_CONVERSION.MONTHS_IN_YEAR);
      months = Math.floor(value % DURATION_CONVERSION.MONTHS_IN_YEAR);
      daysResult = Math.floor(value * DURATION_CONVERSION.DAYS_IN_MONTH_APPROX);
      break;

    case 'days': {
      years = Math.floor(value / DURATION_CONVERSION.DAYS_IN_YEAR_APPROX);
      const remainingDays = value % DURATION_CONVERSION.DAYS_IN_YEAR_APPROX;
      months = Math.floor(remainingDays / DURATION_CONVERSION.DAYS_IN_MONTH_APPROX);
      days = Math.floor(remainingDays % DURATION_CONVERSION.DAYS_IN_MONTH_APPROX);
      daysResult = Math.floor(value);
      break;
    }

    default:
      break;
  }

  result.value = [
    getResultPart(years, 'yearsSingular', 'yearsPlural'),
    getResultPart(months, 'monthsSingular', 'monthsPlural'),
    getResultPart(days, 'daysSingular', 'daysPlural'),
  ]
    .filter(Boolean)
    .join(', ');

  if ((model.value === null && singleValue.value) || typeof model.value === 'number') {
    model.value = daysResult;
  } else if (typeof model.value === 'object') {
    model.value = {
      value: singleValue.value,
      unit: singleUnit.value,
    };
  }
}

watch(
  () => singleUnit.value,
  (newValue) => {
    updateSinglePlaceholder(newValue);
  },
  { immediate: true }
);

watch(
  () => displayTexts,
  () => {
    updateSinglePlaceholder(singleUnit.value);
  },
  { deep: true, immediate: true }
);

watch([singleValue, singleUnit, () => props.variant], () => {
  if (props.variant === 'default') {
    calculateSingleResult();
  }
});

function isValueValid(value, maxLength, field) {
  if (value === '' || value === null || value === undefined) {
    return true;
  }

  const isLengthValid = maxLength ? String(value).length <= maxLength : true;
  const isValid = typeof value === 'number' && !Number.isNaN(value) && value >= 0 && isLengthValid;

  if (!isValid) {
    logWarn(
      `LxDayInput [${props.id}]: Value ${value} for ${field} is not valid, defaulting to null`,
      useLx().getGlobals()?.environment
    );
  }

  return isValid;
}

function updateSingleValues(newValue, oldValue) {
  if (
    typeof newValue === 'object' &&
    typeof oldValue === 'object' &&
    JSON.stringify(newValue) === JSON.stringify(oldValue)
  ) {
    return;
  }

  const incomingValue = typeof newValue === 'object' ? newValue?.value : newValue;
  const maxLength =
    typeof newValue === 'number' && singleUnit.value !== 'days' ? null : singleInputMaxLength.value;

  if (!isValueValid(incomingValue, maxLength, 'model')) {
    singleValue.value = null;
    result.value = '';
    model.value = null;
    return;
  }

  if (isDefined(newValue)) {
    if (typeof newValue === 'number' && singleUnit.value === 'days') {
      singleValue.value = newValue;
    }
    if (typeof newValue === 'object') {
      singleValue.value = newValue.value;
      singleUnit.value = newValue.unit;
    }
  } else {
    singleValue.value = null;
  }
}

const segmentedValues = reactive({
  months: null,
  days: null,
  hours: null,
  minutes: null,
});

function getSegmentedTooltipPart(field) {
  const value = segmentedValues[field];
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const [singularTextKey, pluralTextKey] = SEGMENTED_FIELDS_CONFIG[field]?.textKeys ?? [];

  return getResultPart(value, singularTextKey, pluralTextKey);
}

const tooltipText = computed(() => {
  if (isSegmentedVariant.value) {
    return (SEGMENTED_FIELDS_BY_VARIANT[props.variant] ?? [])
      .map(getSegmentedTooltipPart)
      .filter(Boolean)
      .join(', ');
  }

  return singleValue.value ? `${singleValue.value} ${singleUnitName.value}` : '';
});

const computedTitle = computed(() => (props.kind === 'label' ? tooltipText.value : ''));

const infoText = computed(() => {
  if (props.kind !== 'icon') {
    return '';
  }

  if (result.value) {
    return props.readOnly ? tooltipText.value : result.value;
  }

  return props.readOnly ? '' : displayTexts.value.noResults;
});

function normalizeSegmentedValue(value, field) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);

  if (!isValueValid(numberValue, SEGMENTED_FIELDS_CONFIG[field]?.maxLength, field)) {
    return null;
  }

  return numberValue;
}

function updateSegmentedValues(value, key) {
  const entries = key
    ? [[key, value.detail?.unmaskedValue ?? value.target.value]]
    : Object.keys(segmentedValues).map((field) => [field, value?.[field]]);

  entries.forEach(([field, fieldValue]) => {
    if (field in segmentedValues) {
      segmentedValues[field] = normalizeSegmentedValue(fieldValue, field);
    }
  });
}

watch(
  () => model.value,
  (newValue, oldValue) => {
    if (newValue === oldValue) {
      return;
    }

    switch (props.variant) {
      case 'default':
        updateSingleValues(newValue, oldValue);
        break;
      case 'months':
      case 'days':
      case 'hours':
        updateSegmentedValues(newValue);
        break;
      default:
        break;
    }
  },
  { immediate: true }
);

const rowId = inject('rowId', ref(null));
const labelledBy = computed(() => props.labelId || rowId.value);

if (props.builderOptions?.useRegistry) {
  const instance = getCurrentInstance();
  // Adds default texts to ensure they are available in the builder instance
  instance.type.props.texts.options = textsDefault;
  registerBuilderInstance({
    name: 'LxDayInput',
    instance,
    props,
    builderName: props.builderOptions?.schemaPath,
    componentStack: props.builderOptions?.componentStack?.concat([
      { id: props?.id, name: 'LxDayInput' },
    ]),
  });

  onUnmounted(() => {
    unregisterBuilderInstance(props?.id);
  });
}

const INPUT_MASK = {
  mask: Number,
  scale: 0,
  min: 0,
};

function getUnitLabel(unitKey) {
  const locale = useLx().getGlobals()?.locale?.locale || 'lv-LV';
  const { name, fallback } = SEGMENTED_FIELDS_CONFIG[unitKey].unit;

  try {
    const unitLabel = new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: name,
      unitDisplay: 'short',
    })
      .formatToParts(1)
      .find((part) => part.type === 'unit')?.value;

    return capitalizeFirstLetter(unitLabel?.replace(/\./g, '') || fallback);
  } catch {
    return fallback;
  }
}

const segmentedUnits = computed(() =>
  Object.fromEntries(
    Object.keys(SEGMENTED_FIELDS_CONFIG).map((unitKey) => [unitKey, getUnitLabel(unitKey)])
  )
);

const segmentedInputs = computed(() => ({
  months: {
    show: props.variant === 'months',
    id: `${props.id}-months`,
    value: segmentedValues.months,
    mask: INPUT_MASK,
    placeholder: '0',
    maxlength: SEGMENTED_FIELDS_CONFIG.months.maxLength,
    unit: segmentedUnits.value.months,
  },
  days: {
    show: props.variant === 'months' || props.variant === 'days',
    id: `${props.id}-days`,
    value: segmentedValues.days,
    mask: INPUT_MASK,
    placeholder: '0',
    maxlength: SEGMENTED_FIELDS_CONFIG.days.maxLength,
    unit: segmentedUnits.value.days,
  },
  hours: {
    show: props.variant === 'months' || props.variant === 'days' || props.variant === 'hours',
    id: `${props.id}-hours`,
    value: segmentedValues.hours,
    mask: INPUT_MASK,
    placeholder: '0',
    maxlength: SEGMENTED_FIELDS_CONFIG.hours.maxLength,
    unit: segmentedUnits.value.hours,
  },
  minutes: {
    show: props.variant === 'months' || props.variant === 'days' || props.variant === 'hours',
    id: `${props.id}-minutes`,
    value: segmentedValues.minutes,
    mask: INPUT_MASK,
    placeholder: '0',
    maxlength: SEGMENTED_FIELDS_CONFIG.minutes.maxLength,
    unit: segmentedUnits.value.minutes,
  },
}));

const segmentedFields = computed(() => SEGMENTED_FIELDS_BY_VARIANT[props.variant] ?? []);

function calculateSegmentedResult() {
  const monthCount = segmentedFields.value.includes('months') ? segmentedValues.months ?? 0 : 0;
  const dayCount = segmentedFields.value.includes('days') ? segmentedValues.days ?? 0 : 0;
  const hourCount = segmentedFields.value.includes('hours') ? segmentedValues.hours ?? 0 : 0;
  const minuteCount = segmentedFields.value.includes('minutes') ? segmentedValues.minutes ?? 0 : 0;

  let totalMinutes =
    monthCount *
      DURATION_CONVERSION.DAYS_IN_MONTH_APPROX *
      DURATION_CONVERSION.HOURS_IN_DAY *
      DURATION_CONVERSION.MINUTES_IN_HOUR +
    dayCount * DURATION_CONVERSION.HOURS_IN_DAY * DURATION_CONVERSION.MINUTES_IN_HOUR +
    hourCount * DURATION_CONVERSION.MINUTES_IN_HOUR +
    minuteCount;

  const minutesInDay = DURATION_CONVERSION.HOURS_IN_DAY * DURATION_CONVERSION.MINUTES_IN_HOUR;
  const minutesInMonth = DURATION_CONVERSION.DAYS_IN_MONTH_APPROX * minutesInDay;
  const minutesInYear = DURATION_CONVERSION.DAYS_IN_YEAR_APPROX * minutesInDay;

  const years = Math.floor(totalMinutes / minutesInYear);
  totalMinutes -= years * minutesInYear;

  const months = Math.floor(totalMinutes / minutesInMonth);
  totalMinutes -= months * minutesInMonth;

  const days = Math.floor(totalMinutes / minutesInDay);
  totalMinutes -= days * minutesInDay;

  const hours = Math.floor(totalMinutes / DURATION_CONVERSION.MINUTES_IN_HOUR);
  const minutes = totalMinutes - hours * DURATION_CONVERSION.MINUTES_IN_HOUR;

  result.value = [
    getResultPart(years, 'yearsSingular', 'yearsPlural'),
    getResultPart(months, 'monthsSingular', 'monthsPlural'),
    getResultPart(days, 'daysSingular', 'daysPlural'),
    getResultPart(hours, 'hoursSingular', 'hoursPlural'),
    getResultPart(minutes, 'minutesSingular', 'minutesPlural'),
  ]
    .filter(Boolean)
    .join(', ');

  const segmentedModelValue = Object.fromEntries(
    Object.entries(segmentedValues).filter(([key]) => segmentedFields.value.includes(key))
  );

  model.value = segmentedModelValue;
}

watch(
  [segmentedValues, () => props.variant],
  () => {
    if (isSegmentedVariant.value) {
      calculateSegmentedResult();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="lx-field-wrapper" :data-id="id">
    <div
      ref="durationInputWrapper"
      class="lx-duration-input-wrapper"
      :class="[
        `lx-duration-kind-${kind}`,
        `lx-duration-variant-${variant}`,
        { 'lx-duration-responsive': isResponsive },
        { 'lx-read-only': readOnly },
      ]"
    >
      <div class="lx-duration-container">
        <p v-if="readOnly" class="lx-data" :title="computedTitle" :aria-labelledby="labelledBy">
          <LxEmptyValue v-if="!result" :texts="{ emptyValue: displayTexts.emptyValue }" />
          <span v-else>{{ result }}</span>
        </p>

        <div v-else-if="variant === 'default'" class="lx-duration-fields">
          <LxTextInput
            :id="`${id}-value`"
            v-model="singleValue"
            :mask="singleInputMask"
            :kind="singleInputKind"
            :maxlength="singleInputMaxLength"
            :convertToString="singleConvertToString"
            :disabled="disabled"
            :placeholder="singlePlaceholder"
            :tooltip="displayTexts.inputTooltip"
            :invalid="invalid"
            :labelId="labelledBy"
            :builderOptions="{ innerComponent: true }"
          />
          <LxValuePicker
            :id="`${id}-unit`"
            v-model="singleUnit"
            :items="singleUnitOptions"
            :placeholder="displayTexts.dropdownPlaceholder"
            :tooltip="displayTexts.dropdownTooltip"
            :disabled="disabled"
            :invalid="invalid"
            :labelId="labelledBy"
            variant="dropdown"
          />
        </div>

        <div v-else-if="isSegmentedVariant" class="lx-duration-fields">
          <template v-for="(input, key) in segmentedInputs" :key="key">
            <div
              v-if="input.show"
              class="lx-input-wrapper"
              :class="[
                `lx-duration-input-${key}`,
                { 'lx-invalid': invalid },
                { 'lx-disabled': disabled },
              ]"
            >
              <div class="pseudo-input" />
              <input
                type="text"
                autocomplete="off"
                class="lx-input-area"
                :class="[{ 'lx-invalid': invalid }, { 'input-active': false }]"
                :id="input.id"
                :value="input.value"
                v-imask="input.mask"
                @accept="updateSegmentedValues($event, key)"
                :placeholder="input.placeholder"
                :maxlength="input.maxlength"
                :disabled="disabled"
                :readonly="false"
                :aria-invalid="invalid"
                :aria-errormessage="invalid ? `${id}-invalidation-message` : null"
                :aria-label="input.unit"
                :aria-labelledby="labelledBy"
                :aria-describedby="
                  invalid
                    ? `${id}-lx-input-description ${id}-invalidation-message`
                    : `${id}-lx-input-description`
                "
              />
              <div class="lx-duration-unit">{{ input.unit }}</div>
              <div v-if="invalid" class="lx-input-icon-wrapper">
                <LxIcon customClass="lx-invalidation-icon" value="invalid" />
              </div>
            </div>
          </template>
        </div>

        <div v-if="infoText" class="lx-duration-result-icon">
          <LxInfoWrapper placement="top" :label="displayTexts.helperTextLabel">
            <LxIcon value="info" />

            <template #panel>
              <p class="lx-data">{{ infoText }}</p>
            </template>
          </LxInfoWrapper>
        </div>

        <div v-if="result && !readOnly && kind === 'label'" class="lx-duration-result-label">
          {{ result }}
        </div>
      </div>

      <div
        v-if="invalid && !readOnly"
        class="lx-invalidation-message"
        :id="`${id}-invalidation-message`"
      >
        {{ invalidationMessage }}
      </div>
    </div>
  </div>
</template>
