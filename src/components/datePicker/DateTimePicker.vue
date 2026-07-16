<script setup>
import { computed, inject, ref, getCurrentInstance, onUnmounted } from 'vue';
import { lxDateUtils } from '@/utils';
import useLx from '@/hooks/useLx';
import { getKindConfig } from '@/components/datePicker/kindConfig';
import { generateUUID } from '@/utils/stringUtils';
import LxDatePicker from '@/components/datePicker/DatePicker.vue';
import LxDayMonthPicker from '@/components/datePicker/DayMonthPicker.vue';
import LxEmptyValue from '@/components/EmptyValue.vue';
import { getDisplayTexts } from '@/utils/generalUtils';
import { registerBuilderInstance, unregisterBuilderInstance } from '@/utils/builderUtils';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  modelValue: { type: [String, Date], default: null },
  kind: {
    type: String,
    default: 'date',
    options: [
      'date',
      'time',
      'time-full',
      'date-time',
      'date-time-full',
      'month',
      'year',
      'month-year',
      'quarters',
      'day-month',
    ],
    group: 'main',
    sequence: 1,
  }, // 'date', 'time', 'time-full', 'date-time', 'date-time-full', 'month', 'year', 'month-year', 'quarters', 'day-month'
  placeholder: { type: String, default: null, group: 'main', sequence: 7 },
  tooltip: { type: String, default: null, group: 'main', sequence: 8 },
  minDate: { type: Date, default: null, group: 'main', sequence: 3 },
  maxDate: { type: Date, default: null, group: 'main', sequence: 4 },
  readOnly: { type: Boolean, default: false, group: 'mode', sequence: 1 },
  disabled: { type: Boolean, default: false, group: 'mode', sequence: 2 },
  invalid: { type: Boolean, default: false, sequence: 1 },
  invalidationMessage: { type: String, default: null, sequence: 2 },
  helperText: { type: String, default: null, group: 'main', sequence: 9 },
  helperTextKind: {
    type: String,
    default: 'label',
    options: ['label', 'icon'],
    group: 'main',
    sequence: 10,
  },
  clearIfNotExact: { type: Boolean, default: false, group: 'additional', sequence: 3 },
  locale: { type: Object, default: () => useLx().getGlobals()?.locale },
  specialDates: { type: Array, default: () => [] },
  dictionary: { type: Array, default: () => [] },
  variant: {
    type: String,
    default: 'default',
    options: ['default', 'picker', 'full', 'full-rows', 'full-columns'],
    group: 'main',
    sequence: 2,
  }, // 'default', 'picker', 'full', 'full-rows', 'full-columns'
  cadenceOfMinutes: { type: Number, default: 1, options: [1, 5, 15], group: 'main', sequence: 5 }, // 1, 5, 15
  cadenceOfSeconds: { type: Number, default: 1, options: [1, 5, 15], group: 'main', sequence: 6 }, // 1, 5, 15
  labelId: { type: String, default: null },
  builderOptions: {
    type: Object,
    default: () => ({ schemaPath: null, componentStack: null, useRegistry: false }),
  },
  texts: { type: Object, default: () => ({}), group: 'additional', sequence: 100 },
});

const textsDefault = {
  emptyValue: 'Nav norādīts',
  clear: 'Attīrīt',
  todayButton: 'Atgriezties uz šodienu',
  clearButton: 'Attīrīt vērtību',
  next: 'Nākamais',
  previous: 'Iepriekšējais',
  nextMonth: 'Nākamais mēnesis',
  previousMonth: 'Iepriekšējais mēnesis',
  nextYear: 'Nākamais gads',
  previousYear: 'Iepriekšējais gads',
  nextDecade: 'Nākamā dekāde',
  previousDecade: 'Iepriekšējā dekāde',
  scrollUp: 'Ritināt uz augšu',
  scrollDown: 'Ritināt uz leju',
  noSpecialDates: 'Šajā mēnesī nav ieplānotu notikumu',
  specialDatesButton: 'Atvērt notikumus',
  closeSpecialDatesButton: 'Aizvērt notikumus',
  bottomSheetClose: 'Paslēpt paneli',
  scrollUpDown: 'Ritināt uz augšu vai leju',
  dayPlaceholder: 'dd',
  monthPlaceholder: 'Mēnesis',
  notSelected: 'Nav izvēlēts',
  dayAdjustedAnnouncement: 'Diena mainīta uz {0}',
  dayClearedAnnouncement: 'Diena attīrīta, jo neeksistē izvēlētajā mēnesī',
  monthChangedAnnouncement: 'Mēnesis mainīts uz {0}',
  monthClearedAnnouncement: 'Mēnesis attīrīts, jo izvēlētā diena tajā neeksistē',
  helperTextLabel: 'Papildu informācija',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault, 'LxDateTimePicker'));

const emits = defineEmits(['update:modelValue']);
const { dateFormat, dateTimeFormat, dateTimeFullFormat } = useLx().getGlobals();

const localeComputed = computed(() => (props.locale?.locale ? props.locale?.locale : 'lv-LV'));
const localeFirstDay = computed(() =>
  props.locale?.firstDayOfTheWeek ? props.locale?.firstDayOfTheWeek : 2
);

const localeMasks = computed(() => {
  const dateFormatToUse = dateFormat || 'dd.MM.yyyy.';
  const dateTimeFormatToUse = dateTimeFormat || 'dd.MM.yyyy. HH:mm';
  const dateTimeFullFormatToUse = dateTimeFullFormat || 'dd.MM.yyyy. HH:mm:ss';

  const defaultMasks = {
    inputDateTime24hr: dateTimeFormatToUse,
    inputDateTimeFull24hr: dateTimeFullFormatToUse,
    input: dateFormatToUse,
    inputTime24hr: 'HH:mm',
    inputTimeFull24hr: 'HH:mm:ss',
    inputMonthYear: 'yyyy-MM',
    inputQuarters: 'yyyy-QQQ',
    inputYear: 'yyyy',
  };
  return props.locale?.masks ? props.locale.masks : defaultMasks;
});

// Central per-kind configuration (parse/emit/getName/mode/cssClass/panel/…).
const cfg = computed(() => getKindConfig(props.kind));

// Context passed to the kind's pure parse/emit/getName functions.
const kindCtx = computed(() => ({
  locale: localeComputed.value,
  masks: localeMasks.value,
}));

const getModelValue = () => cfg.value.parse(props.modelValue, kindCtx.value);

const emitModelValue = (value) => {
  emits('update:modelValue', value);
};

const setModelValue = (newValue) => {
  emitModelValue(cfg.value.emit(newValue, kindCtx.value));
};

const model = computed({
  get: getModelValue,
  set: setModelValue,
});

// Composite kinds (day-month) own the raw string model value directly, so they
// bypass the Date-based `model` above and pass the value straight through.
const rawModel = computed({
  get: () => props.modelValue,
  set: emitModelValue,
});

function getName() {
  if (props.modelValue === '') return null;
  return cfg.value.getName(props.modelValue, kindCtx.value);
}

const modelValueIso = computed(() => {
  let res = props.modelValue;
  if (
    ((props.kind === 'date' || props.kind === 'dateTime' || props.kind === 'date-time') &&
      props.modelValue?.length !== 5) ||
    (props.modelValue?.length !== 5 && props.kind === 'time')
  ) {
    res = lxDateUtils.formatJSON(lxDateUtils.parseDate(props.modelValue));
  } else if (props.kind === 'time') {
    res = lxDateUtils.formatJSON(props.modelValue);
  }
  return res;
});

const colors = [
  { id: 'draft', color: 'lx-draft' },
  { id: 'new', color: 'lx-new' },
  { id: 'editing', color: 'lx-editing' },
  { id: 'edited', color: 'lx-edited' },
  { id: 'disabling', color: 'lx-disabling' },
  { id: 'inactive', color: 'lx-inactive' },
  { id: 'finishing', color: 'lx-finishing' },
  { id: 'finished', color: 'lx-finished' },
  { id: 'deleting', color: 'lx-deleting' },
  { id: 'red-full', color: 'lx-red' },
  { id: 'red', color: 'lx-red' },
  { id: 'green-full', color: 'lx-green' },
  { id: 'green', color: 'lx-green' },
  { id: 'orange-full', color: 'lx-orange' },
  { id: 'orange', color: 'lx-orange' },
  { id: 'purple-full', color: 'lx-purple' },
  { id: 'purple', color: 'lx-purple' },
  { id: 'blue-full', color: 'lx-blue' },
  { id: 'blue', color: 'lx-blue' },
  { id: 'yellow-full', color: 'lx-yellow' },
  { id: 'yellow', color: 'lx-yellow' },
  { id: 'black-full', color: 'lx-black' },
  { id: 'black', color: 'lx-black' },
];

const attributesComputed = computed(() => {
  const res = [];
  props.specialDates.forEach((element) => {
    const found = props.dictionary.find((el) => el?.id === element?.category);
    if (found) {
      const colorFind = colors.find((el) => el.id === found?.displayType)?.color;
      res.push({
        barColor: colorFind || 'blue',
        dates: element?.dates,
        popoverLabel: found?.name,
      });
    }
  });
  return res;
});

const mode = computed(() => cfg.value.mode);

// Kinds whose UI is a composite of plain selects (e.g. day-month) rather than
// the calendar-based LxDatePicker.
const isComposite = computed(() => cfg.value.panel === 'composite');

const rowId = inject('rowId', ref(null));
const labelledBy = computed(() => props.labelId || rowId.value);

if (props.builderOptions?.useRegistry) {
  const instance = getCurrentInstance();
  // Adds default texts to ensure they are available in the builder instance
  instance.type.props.texts.options = textsDefault;
  registerBuilderInstance({
    name: 'LxDateTimePicker',
    instance,
    props,
    builderName: props.builderOptions?.schemaPath,
    componentStack: props.builderOptions?.componentStack?.concat([
      { id: props?.id, name: 'LxDateTimePicker' },
    ]),
  });

  onUnmounted(() => {
    unregisterBuilderInstance(props?.id);
  });
}
</script>

<template>
  <div class="lx-field-wrapper" :data-id="id">
    <template v-if="readOnly">
      <p class="lx-data" :aria-labelledby="labelledBy">
        <time class="date-time-readonly" :datetime="modelValueIso">
          {{ getName() }}
          <LxEmptyValue
            v-if="model === null || model === undefined"
            :texts="{ emptyValue: displayTexts.emptyValue }"
          />
        </time>
      </p>
    </template>

    <template v-else>
      <div
        class="lx-date-time-picker-wrapper"
        :class="cfg.cssClass"
        :data-invalid="invalid ? '' : null"
        :data-disabled="disabled ? '' : null"
        :title="isComposite ? null : tooltip"
      >
        <LxDayMonthPicker
          v-if="isComposite"
          v-model="rawModel"
          :id="id"
          :disabled="disabled"
          :invalid="invalid"
          :invalidationMessage="invalidationMessage"
          :clearIfNotExact="clearIfNotExact"
          :locale="localeComputed"
          :placeholder="placeholder"
          :tooltip="tooltip"
          :helperText="helperText"
          :helperTextKind="helperTextKind"
          :texts="displayTexts"
          :labelled-by="labelledBy"
        />
        <LxDatePicker
          v-else
          :id="id"
          v-model="model"
          :mode="mode"
          :variant="variant"
          :masks="localeMasks"
          :placeholder="placeholder"
          :disabled="disabled"
          :invalid="invalid"
          :invalidationMessage="invalidationMessage"
          :helper-text="helperText"
          :helper-text-kind="helperTextKind"
          :min-date="minDate"
          :max-date="maxDate"
          :locale="localeComputed"
          :first-day-of-the-week="localeFirstDay"
          :special-dates-attributes="attributesComputed"
          :clearIfNotExact="clearIfNotExact"
          :cadenceOfMinutes="cadenceOfMinutes"
          :cadenceOfSeconds="cadenceOfSeconds"
          :texts="displayTexts"
          :labelled-by="labelledBy"
        />
      </div>
    </template>
  </div>
</template>
