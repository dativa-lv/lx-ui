import { EMPTY_VALUE } from '@/utils/format/constants';

export function formatValueDefault(value) {
  return value || EMPTY_VALUE;
}

export function formatValueArray(value) {
  return value?.map((o) => o.name).join(', ') || EMPTY_VALUE;
}

export function formatValueBool(value, texts = { yes: 'Jā', no: 'Nē' }) {
  if (value === null || value === undefined) return EMPTY_VALUE;
  return value === true ? texts.yes : texts.no;
}

export function formatFieldName(name) {
  return name || EMPTY_VALUE;
}
