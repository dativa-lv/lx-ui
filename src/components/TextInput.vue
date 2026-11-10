<script setup>
import { computed, onMounted, watch, ref, inject, nextTick } from 'vue';
import { lxDefineAsyncComponent } from '@/utils/dynamicImportUtils';
import { IMask, IMaskDirective as vImask } from 'vue-imask';
import { Money3Component } from 'v-money3';
import { computedAsync } from '@vueuse/core';

import { generateUUID, isEmail } from '@/utils/stringUtils';
import { flagMap } from '@/utils/flagUtils';
import { getDisplayTexts, isDefined, isNil, clampText } from '@/utils/generalUtils';
import { PHONE_MAX_LENGTH_BY_PREFIX } from '@/constants';
import { loadLibrary } from '@/utils/libLoader';
import { logWarn } from '@/utils/devUtils';
import useLx from '@/hooks/useLx';

import LxIcon from '@/components/Icon.vue';
import LxButton from '@/components/Button.vue';
import LxEmptyValue from '@/components/EmptyValue.vue';
import LxInfoWrapper from '@/components/InfoWrapper.vue';
import { useBuilderRegistration } from '@/utils/builderUtils';

const THOUSANDS_SEPARATOR = ' ';
const MIN_GROUPED_DIGITS = 5;
const GROUPED_MASKS = new Set(['integer', 'decimal']);

function groupThousands(integerPart, separator = THOUSANDS_SEPARATOR) {
  if (integerPart.replace('-', '').length < MIN_GROUPED_DIGITS) return integerPart;
  return integerPart.replace(/\B(?=(\d{3})+$)/g, separator);
}

class GroupedNumber extends IMask.MaskedNumber {
  // imask drops `mask` equal to the class, then sees a changed mask on every update and resets the value
  constructor(opts) {
    super({ ...opts, mask: GroupedNumber });
  }

  // eslint-disable-next-line no-underscore-dangle
  _insertThousandsSeparators(value) {
    const [integerPart, ...rest] = value.split(this.radix);
    return [groupThousands(integerPart, this.thousandsSeparator), ...rest].join(this.radix);
  }
}

const LxFlag = lxDefineAsyncComponent(() => import('@/components/Flag.vue'));
const LxAutoCompleteNew = lxDefineAsyncComponent(
  () => import('@/components/autoComplete/AutoCompleteNew.vue')
);

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  modelValue: { type: [Number, String], default: null },
  placeholder: { type: String, default: null, group: 'main', sequence: 4 },
  readOnly: { type: Boolean, default: false, group: 'mode', sequence: 1 },
  convertToString: { type: Boolean, default: true, group: 'additional', sequence: 2 },
  disabled: { type: Boolean, default: false, group: 'mode', sequence: 2 },
  uppercase: { type: Boolean, default: false, group: 'additional', sequence: 3 },
  required: { type: Boolean, default: null },
  invalid: { type: Boolean, default: false, sequence: 1 },
  invalidationMessage: { type: String, default: null, sequence: 2 },
  helperText: { type: String, default: null, group: 'main', sequence: 6 },
  helperTextKind: {
    type: String,
    default: 'label',
    options: ['label', 'icon'],
    group: 'main',
    sequence: 7,
  },
  maxlength: { type: [Number, String], default: null, group: 'main', sequence: 3 },
  tooltip: { type: String, default: null, group: 'main', sequence: 5 },
  mask: {
    type: String,
    default: null,
    validator(value) {
      return value
        ? // @ts-ignore next line
          [
            'default',
            'integer',
            'decimal',
            'gpslat',
            'time',
            'gpslon',
            'personCodeLv',
            'person-code-lv',
            'newbornId',
            'newborn-id',
            'currency',
            'email',
            'numeric',
            'custom',
          ].includes(value)
        : true;
    },
    options: [
      'default',
      'integer',
      'decimal',
      'gpslat',
      'time',
      'gpslon',
      'personCodeLv',
      'person-code-lv',
      'newbornId',
      'newborn-id',
      'currency',
      'email',
      'numeric',
      'custom',
    ],
    group: 'main',
    sequence: 2,
  },
  customMaskValue: {
    type: RegExp,
    default: /./,
  },
  scale: { type: [Number, String], default: 2, group: 'additional', sequence: 1 },
  signed: { type: Boolean, default: false, group: 'additional', sequence: 4 },
  kind: {
    type: String,
    default: 'default',
    options: ['default', 'search', 'password', 'phone'],
    group: 'main',
    sequence: 1,
  },
  labelId: { type: String, default: null },
  autocomplete: { type: String, default: 'off', group: 'additional', sequence: 5 },
  options: {
    type: Object,
    default: () => ({ phone: 'lv', locale: null, currency: null }),
    // TODO: add group as well
  },

  builderOptions: {
    type: Object,
    default: () => ({
      innerComponent: false,
      schemaPath: null,
      componentStack: null,
      useRegistry: false,
    }),
  },
  texts: { type: Object, default: () => ({}), group: 'additional', sequence: 100 },
});

const textsDefault = {
  emptyValue: 'Nav norādīts',
  showPassword: 'Rādīt paroli',
  hidePassword: 'Paslēpt paroli',
  helperTextLabel: 'Papildinformācija',
  clearSearch: 'Notīrīt meklēšanu',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault, 'LxTextInput'));

const emits = defineEmits(['update:modelValue']);

// Russia (+7) and Kazakhstan (+7) share the same country code
// The United States (+1) shares its code with Canada and many Caribbean nations.

const flags = flagMap;

const input = ref();
const searchInput = ref();
const valueRaw = ref();
const isUpdatingMask = ref(false);
let shouldFocusSearchInput = false;

// LxAutoComplete loads on demand; focus it once mounted
watch(searchInput, (component) => {
  if (component && shouldFocusSearchInput) {
    shouldFocusSearchInput = false;
    component.focus();
  }
});

function focus() {
  if (props.kind === 'search') {
    if (searchInput.value) searchInput.value.focus();
    else shouldFocusSearchInput = true;
  } else if (input.value !== null && input.value !== undefined) input.value.focus();
}

const minValueComp = computed(() => 10 ** Number(props.maxlength || 20) - 1);

function findBestPrefix(value) {
  const prefixes = Array.from(PHONE_MAX_LENGTH_BY_PREFIX.keys()).sort(
    (a, b) => b.length - a.length
  );
  return prefixes.find((p) => value?.startsWith(p)) ?? null;
}

const maxLengthValue = computed(() => {
  const baseMax = isDefined(props.maxlength) ? Number(props.maxlength) : null;
  if (props.kind === 'phone') {
    if (isDefined(baseMax)) {
      return baseMax;
    }
    const resultingLength = PHONE_MAX_LENGTH_BY_PREFIX.get(findBestPrefix(valueRaw.value));
    return resultingLength ?? null;
  }
  if ((props.mask === 'integer' || props.mask === 'decimal') && props.signed) {
    if (baseMax == null) {
      return null;
    }
    return baseMax + 1;
  }
  if (isDefined(baseMax)) {
    return baseMax;
  }

  return null;
});

const inputMaxLength = computed(() => {
  if (!isDefined(maxLengthValue.value) || !GROUPED_MASKS.has(props.mask)) {
    return maxLengthValue.value;
  }
  const max = Number(maxLengthValue.value);
  return max >= MIN_GROUPED_DIGITS ? max + Math.floor((max - 1) / 3) : max;
});

const inputMask = computed(() => {
  if (props.kind === 'phone')
    return {
      mask: /^(?:\(\+|\+)?[\d()-]*$/,
    };

  switch (props.mask) {
    case 'integer':
      return {
        mask: GroupedNumber,
        thousandsSeparator: THOUSANDS_SEPARATOR,
        scale: 0,
        lazy: false,
        min: props.signed ? 0 - minValueComp.value : 0,
        max: Number.MAX_SAFE_INTEGER,
        format: () => '',
      };
    case 'decimal':
      return {
        mask: GroupedNumber,
        thousandsSeparator: THOUSANDS_SEPARATOR,
        scale: props.scale,
        min: props.signed ? 0 - minValueComp.value : 0,
        radix: ',',
        mapToRadix: [',', '.'],
        format: () => '',
      };
    case 'personCodeLv':
    case 'person-code-lv':
      return {
        mask: '000000-00000',
        lazy: true,
      };
    case 'newbornId':
    case 'newborn-id':
      return {
        mask: '00000000000/000000000000',
        lazy: true,
      };
    case 'gpslat':
      return {
        mask: Number,
        scale: 5,
        lazy: false,
        max: 90,
        min: -90,
        radix: ',',
        mapToRadix: [',', '.'],
        format: () => '',
      };
    case 'gpslon':
      return {
        mask: Number,
        scale: 5,
        lazy: false,
        max: 180,
        min: -180,
        radix: ',',
        mapToRadix: [',', '.'],
        format: () => '',
      };
    case 'time':
      return {
        mask: '00:00',
        scale: 0,
        lazy: false,
      };
    case 'email':
      return {
        mask: /^\S*$/,
      };
    case 'numeric':
      return {
        mask: /^\d+$/,
      };
    case 'custom':
      return {
        mask: props.customMaskValue,
      };
    default:
      return {
        mask: /./,
      };
  }
});

const isDecimalLikeMask = computed(() => ['decimal', 'gpslat', 'gpslon'].includes(props.mask));

function convertValue(v) {
  if (!props.convertToString) {
    if (
      props.mask === 'integer' ||
      props.mask === 'decimal' ||
      props.mask === 'gpslat' ||
      props.mask === 'gpslon' ||
      props.mask === 'numeric'
    ) {
      return v?.length ? Number(v) : null;
    }
  }
  return v;
}

const model = computed({
  get() {
    return props.modelValue;
  },
  set(valueVal) {
    emits('update:modelValue', valueVal);
  },
});

const lastVal = ref();

function rewriteValue(regEx, oldVal, newVal) {
  if (!regEx.test(newVal[newVal.length - 1])) {
    if (lastVal.value !== oldVal) {
      lastVal.value = newVal;
      model.value = oldVal;
    }
  }
}

function onAccept(e) {
  if (isUpdatingMask.value) {
    return;
  }

  const maskRef = e.detail;
  let v = maskRef.unmaskedValue;

  v = convertValue(v);

  valueRaw.value = maskRef.value;
  if (isDecimalLikeMask.value || maskRef.value.slice(-1) !== ',') {
    model.value = v;
  }
}

function maskUpdate() {
  const mask = input?.value?.maskRef;
  if (mask) {
    isUpdatingMask.value = true;
    if (isNil(model.value)) {
      mask.value = '';
    } else {
      mask.typedValue = model.value;
      // Ref: https://github.com/uNmAnNeR/imaskjs/issues/61#issuecomment-391050350
    }
    isUpdatingMask.value = false;
  }
}

const maxLengthComp = computed(() =>
  isDefined(props.maxlength) ? 10 ** Number(props.maxlength) - 1 : null
);

const { environment, currency: globalCurrency } = useLx().getGlobals() ?? {};

const currencySymbol = computed(() => {
  const currencyCode = props.options?.currency || globalCurrency || 'EUR';

  try {
    return new Intl.NumberFormat('lv-LV', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
    })
      .formatToParts(0)
      .find((part) => part.type === 'currency').value;
  } catch {
    logWarn(
      `LxTextInput [${props.id}]: currency "${currencyCode}" is not a valid ISO 4217 code`,
      environment
    );
    return currencyCode;
  }
});

const config = computed(() => ({
  prefix: '',
  suffix: ` ${currencySymbol.value}`,
  thousands:
    Math.trunc(Math.abs(Number(model.value) || 0)).toString().length >= MIN_GROUPED_DIGITS
      ? THOUSANDS_SEPARATOR
      : '',
  decimal: ',',
  precision: 2,
  disableNegative: !props.signed,
  disabled: false,
  min: null,
  max: maxLengthComp.value,
  setMaxIfBigger: false,
  allowBlank: false,
  minimumNumberOfCharacters: 0,
  shouldRound: true,
  focusOnRight: false,
}));

const currencyInput = ref();

// v-money3 binds its options only on mount, so the input is re-keyed by separator; restore focus and cursor
watch(
  () => config.value.thousands,
  async () => {
    const el = currencyInput.value?.$el;
    if (!el || el !== document.activeElement) return;
    const fromEnd = el.value.length - el.selectionEnd;
    await nextTick();
    const newEl = currencyInput.value?.$el;
    if (!newEl) return;
    newEl.focus();
    const pos = Math.max(0, newEl.value.length - fromEnd);
    newEl.setSelectionRange(pos, pos);
  }
);

function formatCurrencyReadOnly(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return value + config.value.suffix;
  const [integerPart, fractionPart] = number.toFixed(config.value.precision).split('.');
  return `${groupThousands(integerPart)}${config.value.decimal}${fractionPart}${config.value.suffix}`;
}

// Workaround to show readonly values masked
const forcedMaskedValue = computed(() => {
  if (model.value === null || model.value === '') {
    return '';
  }

  const value = String(model.value);
  switch (props.mask) {
    case 'personCodeLv':
    case 'person-code-lv':
      return `${value.substring(0, 6)}-${value.substring(6)}`;
    case 'newbornId':
    case 'newborn-id':
      return value[11] === '/' ? value : `${value.substring(0, 11)}/${value.substring(11)}`;
    case 'integer':
      return groupThousands(value);
    case 'decimal': {
      const [integerPart, fractionPart] = value.split('.');
      return isNil(fractionPart)
        ? groupThousands(integerPart)
        : `${groupThousands(integerPart)},${fractionPart}`;
    }
    case 'currency':
      return formatCurrencyReadOnly(value);
    case 'gpslat':
      return value.replace('.', ',');
    case 'gpslon':
      return value.replace('.', ',');
    case 'time':
      return value.length > 2 ? `${value.substring(0, 2)}:${value.substring(2)}` : value;
    default:
      return value;
  }
});

const hidePassword = ref(true);

function showPasswordChange() {
  hidePassword.value = !hidePassword.value;
}

function onBlur() {
  if (props.mask === 'decimal' && model.value === '-0') {
    model.value = '0';
  } else if (props.mask === 'decimal' && model.value === 0 && valueRaw.value === '-0') {
    valueRaw.value = '0';
  }
}

function isReadOnlyEmail() {
  return props.mask === 'email' && props.readOnly && isEmail(model.value);
}

const matchedFlags = computed(() => {
  const result = [];
  let longestKey = null;
  // Find only the longest matching key to avoid showing multiple flags for shared prefixes (e.g., +1)
  Object.keys(flags)?.forEach((key) => {
    if (valueRaw.value?.toString()?.startsWith(key)) {
      if (longestKey === null || key.length > longestKey.length) {
        longestKey = key;
      }
    }
  });
  if (longestKey) {
    const value = flags[longestKey];
    if (Array.isArray(value)) {
      value.forEach((val) => result.push(val));
    } else {
      result.push(value);
    }
  }

  return result;
});

const rowId = inject('rowId', ref(null));
const labelledBy = computed(() => props.labelId || rowId.value);
const rowRequired = inject('rowRequired', ref(null));
const ariaRequired = computed(() => {
  const value = isNil(props.required) ? rowRequired.value : props.required;
  return value ? true : null;
});

const hasHelperText = computed(() => isDefined(props.helperText) && props.helperText !== '');
const helperTextClamped = computed(() => clampText(props.helperText));
const invalidationMessageClamped = computed(() => clampText(props.invalidationMessage));
const showInvalidationMessage = computed(
  () => props.invalid && props.invalidationMessage && !props.readOnly
);
const showInlineHelper = computed(
  () => hasHelperText.value && props.helperTextKind === 'label' && !props.invalid
);
const showInfoHelper = computed(
  () => hasHelperText.value && props.helperTextKind === 'icon' && !props.invalid
);
const describedBy = computed(() => {
  const ids = [];
  if ((showInlineHelper.value || showInfoHelper.value) && !props.readOnly) {
    ids.push(`${props.id}-helper`);
  }
  if (showInvalidationMessage.value) ids.push(`${props.id}-invalidation-message`);
  return ids.length ? ids.join(' ') : null;
});

const sanitizedEmail = computedAsync(async () => {
  if (isEmail(model.value)) {
    const lib = await loadLibrary('sanitizeUrl');
    return lib.sanitizeUrl(`mailto:${model.value}`);
  }
  return '';
}, null);

const inputMode = computed(() => {
  if (props.kind === 'phone') return 'tel';
  switch (props.mask) {
    case 'email':
      return 'email';
    case 'phone':
      return 'tel';
    case 'decimal':
    case 'currency':
      return 'decimal';
    case 'integer':
    case 'gpslat':
    case 'gpslon':
    case 'time':
    case 'personCodeLv':
    case 'person-code-lv':
    case 'newbornId':
    case 'newborn-id':
    case 'numeric':
      return 'numeric';
    default:
      return 'text';
  }
});

watch(
  () => model.value,
  (newVal, oldVal) => {
    if (props.mask === 'email' && newVal !== oldVal) {
      if (newVal?.length > oldVal?.length && !oldVal?.includes('@')) {
        rewriteValue(/[a-zA-Z0-9\u00C0-\u017E.!@#$%&'*+/=?^_`{|}~-]/, oldVal, newVal);
      } else if (
        newVal?.length > oldVal?.length &&
        oldVal?.includes('@') &&
        oldVal?.slice(-1) === '.' &&
        oldVal?.lastIndexOf('.') > oldVal?.indexOf('@')
      ) {
        rewriteValue(/[a-zA-Z0-9\u00C0-\u017E-]/, oldVal, newVal);
      } else if (newVal?.length > oldVal?.length && oldVal?.includes('@')) {
        rewriteValue(/[a-zA-Z0-9\u00C0-\u017E-.]/, oldVal, newVal);
      }
    }
  }
);

function isDecimalOrInteger() {
  return props.mask === 'decimal' || props.mask === 'integer';
}

function isInvalidSignedLength(newValue) {
  return (
    isDecimalOrInteger() &&
    props.maxlength &&
    props.signed &&
    ((newValue?.toString()?.charAt(0) === '-' &&
      newValue?.toString().length > Number(props.maxlength) + 1) ||
      (newValue?.toString()?.charAt(0) !== '-' &&
        newValue?.toString().length > Number(props.maxlength)))
  );
}

function revertToOldValue(oldValue) {
  model.value = oldValue;
  valueRaw.value = oldValue?.toString().replace('.', ',');
}

function isExceedingMaxLength(newValue) {
  return maxLengthValue.value && newValue?.toString().length > Number(maxLengthValue.value);
}

function formatTimeValue(newValue) {
  let res = '';
  const strValue = newValue?.toString();
  if (strValue?.length === 1) res = `${strValue}_:__`;
  else if (strValue?.length === 2) res = `${strValue}:__`;
  else if (strValue?.length === 3) res = `${strValue.slice(0, 2)}:${strValue.slice(2)}_`;

  return res === valueRaw.value ? valueRaw.value : model.value;
}

function formatCurrencyValue(newValue) {
  const res = `${newValue}${config.value.suffix}`;
  return res?.replace('.', ',') === valueRaw.value ? valueRaw.value : model.value?.toString();
}

function formatPhoneValue(newValue) {
  const res = newValue?.toString()?.replace(/[()-]/g, '');
  return res === valueRaw.value ? valueRaw.value : model.value?.toString();
}

function updateValueRaw(newValue) {
  if (isNil(newValue)) {
    valueRaw.value = '';
    return;
  }
  if (isDecimalLikeMask.value) {
    valueRaw.value = model.value?.toString().replace('.', ',');
  } else if (props.mask === 'time') {
    valueRaw.value = formatTimeValue(newValue);
  } else if (props.mask === 'currency') {
    valueRaw.value = formatCurrencyValue(newValue);
  } else if (props.kind === 'phone') {
    valueRaw.value = formatPhoneValue(newValue);
  } else {
    valueRaw.value = model.value?.toString();
  }
}

watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    if (isInvalidSignedLength(newValue)) {
      revertToOldValue(oldValue);
      return;
    }

    if (isExceedingMaxLength(newValue)) {
      model.value = oldValue;
      return;
    }

    if (convertValue(newValue) === convertValue(oldValue)) {
      valueRaw.value =
        props.mask === 'decimal' ? newValue?.toString()?.replace('.', ',') : newValue?.toString();
    } else {
      updateValueRaw(newValue);
    }

    if (isNil(newValue)) {
      nextTick(() => maskUpdate());
    }
  },
  { immediate: true }
);

watch(
  () => props.readOnly,
  (newValue) => {
    if (!newValue) maskUpdate();
  }
);

watch(
  () => [props.mask, input.value],
  (newValue) => {
    const [newMask, newInputValue] = newValue;

    if (newMask && newInputValue?.value) {
      if (newMask !== 'currency') {
        maskUpdate();
      }
    }
  },
  { immediate: true }
);

onMounted(() => {
  maskUpdate();
  if (isDecimalLikeMask.value) {
    valueRaw.value = props.modelValue?.toString()?.replace('.', ',');
  } else {
    valueRaw.value = props.modelValue?.toString();
  }

  if (
    model.value &&
    maxLengthValue.value &&
    model.value.toString().length > Number(maxLengthValue.value)
  ) {
    model.value = model.value.toString().substring(0, Number(maxLengthValue.value));
  }
});

useBuilderRegistration('LxTextInput', props, { texts: textsDefault, skipInnerComponent: true });

const searchInputMask = computed(() =>
  props.mask && !['default', 'currency'].includes(props.mask) ? inputMask.value : null
);

watch(
  () => props.kind === 'search' && props.mask === 'currency',
  (isUnsupported) => {
    if (!isUnsupported) return;
    logWarn(
      `LxTextInput [${props.id}]: mask "currency" is not supported with kind "search" and is ignored`,
      environment
    );
  },
  { immediate: true }
);
const searchMask = computed(() =>
  searchInputMask.value ? IMask.createMask(searchInputMask.value) : null
);

function unmaskSearchText(text) {
  if (!searchMask.value) return text;
  searchMask.value.resolve(text);
  return searchMask.value.unmaskedValue;
}

function maskSearchValue(value) {
  if (!searchMask.value) return String(value);
  searchMask.value.unmaskedValue = String(value);
  return searchMask.value.value;
}

// Kept while it matches the model, so half-typed masked text is not reformatted
const searchTyped = ref(null);

const searchText = computed(() => {
  const value = isNil(props.modelValue) ? '' : String(props.modelValue);
  if (searchTyped.value !== null) {
    const typedValue = convertValue(unmaskSearchText(searchTyped.value));
    if ((isNil(typedValue) ? '' : String(typedValue)) === value) return searchTyped.value || null;
  }
  return value === '' ? null : maskSearchValue(value);
});

function onSearchInput(text) {
  searchTyped.value = text;
  const value = convertValue(unmaskSearchText(text));
  const current = isNil(props.modelValue) ? '' : String(props.modelValue);
  if ((isNil(value) ? '' : String(value)) !== current) emits('update:modelValue', value);
}

const searchTexts = computed(() => ({
  emptyValue: displayTexts.value.emptyValue,
  helperTextLabel: displayTexts.value.helperTextLabel,
  clear: displayTexts.value.clearSearch,
}));

const dataState = computed(() =>
  JSON.stringify({
    readOnly: props.readOnly,
    kind: props.kind,
    hidePassword: hidePassword.value,
  })
);

defineExpose({ focus });
</script>
<template>
  <div
    class="lx-field-wrapper"
    data-component="lx-text-input"
    :data-id="id"
    :data-state="dataState"
  >
    <LxAutoCompleteNew
      v-if="kind === 'search'"
      ref="searchInput"
      :id="id"
      :class="{ 'lx-uppercase': uppercase }"
      kind="search"
      searchTrigger="input"
      :modelValue="searchText"
      :searchString="searchText"
      :placeholder="placeholder"
      :tooltip="tooltip"
      :readOnly="readOnly"
      :disabled="disabled"
      :required="required"
      :invalid="invalid"
      :invalidationMessage="invalidationMessage"
      :helperText="helperText"
      :helperTextKind="helperTextKind"
      :queryMaxLength="maxLengthValue"
      :inputMask="searchInputMask"
      :inputMode="inputMode"
      :labelId="labelId"
      :texts="searchTexts"
      @update:searchString="onSearchInput"
    />
    <template v-else>
      <p
        v-if="readOnly && props.kind !== 'password'"
        class="lx-data"
        :class="{ 'lx-uppercase': uppercase }"
        :aria-labelledby="labelledBy"
      >
        <a v-if="isReadOnlyEmail()" class="lx-text-input-link" :href="sanitizedEmail">{{
          model
        }}</a>
        <template v-else>
          {{ forcedMaskedValue }}
          <LxEmptyValue
            v-if="
              model === null ||
              model === undefined ||
              (typeof model === 'string' && model?.trim() === '')
            "
            :texts="{ emptyValue: displayTexts.emptyValue }"
          />
        </template>
      </p>
      <div
        class="lx-text-input-wrapper lx-input-wrapper"
        :class="[
          { 'password-mask': kind === 'password' },
          { 'lx-invalid': invalid },
          { 'lx-disabled': disabled },
        ]"
        :data-invalid="invalid ? '' : null"
        v-if="!readOnly"
      >
        <div v-if="invalid" class="lx-invalidation-icon-wrapper">
          <LxIcon customClass="lx-invalidation-icon" value="invalid" />
        </div>

        <div v-if="kind === 'phone'" class="lx-input-flag-wrapper">
          <div
            v-if="matchedFlags?.length > 0"
            :class="[{ 'multiple-flags': matchedFlags?.length > 1 }]"
          >
            <LxFlag
              v-for="flag in matchedFlags"
              :key="flag"
              :value="flag"
              :locale="options?.locale"
            />
          </div>

          <div v-else>
            <LxFlag :value="options?.phone" :locale="options?.locale" />
          </div>
        </div>

        <div class="pseudo-input" />
        <input
          v-if="mask !== 'currency'"
          v-imask="inputMask"
          ref="input"
          :type="props.kind === 'password' && hidePassword ? 'password' : 'text'"
          :autocomplete="autocomplete"
          class="lx-text-input lx-input-area"
          :class="[
            { 'lx-invalid': invalid },
            { 'lx-phone-input': kind === 'phone' },
            { 'lx-uppercase': uppercase },
          ]"
          :id="id"
          :value="valueRaw"
          :placeholder="placeholder"
          :aria-invalid="invalid"
          :aria-label="placeholder"
          :disabled="disabled"
          :maxlength="inputMaxLength"
          v-tooltip="tooltip"
          :aria-labelledby="labelledBy"
          :aria-required="ariaRequired"
          :aria-errormessage="showInvalidationMessage ? `${id}-invalidation-message` : null"
          :aria-describedby="describedBy"
          :inputmode="inputMode"
          @accept="onAccept"
          @blur="onBlur"
        />

        <div v-if="showInfoHelper" class="lx-input-helper-wrapper">
          <LxInfoWrapper placement="top" :disabled="disabled" :label="displayTexts.helperTextLabel">
            <LxIcon customClass="lx-helper-icon" value="info" />
            <template #panel>
              <p class="lx-data">{{ helperTextClamped }}</p>
            </template>
          </LxInfoWrapper>
        </div>

        <LxButton
          :id="hidePassword ? `${id}-show-password` : `${id}-hide-password`"
          variant="icon-only"
          kind="ghost"
          :icon="hidePassword ? 'visible' : 'hidden'"
          :disabled="disabled"
          :label="hidePassword ? displayTexts.showPassword : displayTexts.hidePassword"
          v-if="props.kind === 'password'"
          @click="showPasswordChange()"
        />

        <Money3Component
          v-if="mask === 'currency'"
          ref="currencyInput"
          :key="config.thousands"
          v-model="model"
          v-bind="config"
          :disabled="disabled"
          v-tooltip="tooltip"
          :placeholder="placeholder"
          :aria-invalid="invalid"
          :aria-required="ariaRequired"
          :aria-errormessage="showInvalidationMessage ? `${id}-invalidation-message` : null"
          :aria-describedby="describedBy"
          class="lx-text-input lx-input-area"
          :class="[{ 'lx-invalid': invalid }]"
        />
      </div>

      <div
        class="lx-invalidation-message"
        v-if="showInvalidationMessage"
        :id="`${id}-invalidation-message`"
      >
        {{ invalidationMessageClamped }}
      </div>
      <div class="lx-helper-text" v-if="showInlineHelper && !readOnly" :id="`${id}-helper`">
        {{ helperTextClamped }}
      </div>
      <div class="lx-invisible" v-else-if="showInfoHelper && !readOnly" :id="`${id}-helper`">
        {{ helperTextClamped }}
      </div>
    </template>
  </div>
</template>
