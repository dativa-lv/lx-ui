<script setup>
import LxFlag from '@/components/Flag.vue';
import LxEmptyValue from '@/components/EmptyValue.vue';
import { getDisplayTexts } from '@/utils/generalUtils';
import { computed } from 'vue';

const props = defineProps({
  value: {
    type: Object,
    default: null,
  },
  idAttribute: {
    type: [Array, String],
    default: 'id',
  },
  nameAttribute: {
    type: String,
    default: 'name',
  },
  locale: {
    type: String,
    default: null,
  },
  meaningful: {
    type: Boolean,
    default: true,
  },
  texts: { type: Object, default: () => ({}) },
});

const textsDefault = {
  emptyValue: 'Nav norādīts',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const idAttribute = computed(() => {
  if (Array.isArray(props.idAttribute)) {
    throw new Error('LxFlagItemDisplay: "idAttributeName" cannot be an array');
  }
  return props.idAttribute;
});

function attributeExists(value, attribute) {
  return value[attribute] && value[attribute].trim() !== '';
}

const flagTitle = computed(() => {
  if (attributeExists(props.value, props.nameAttribute)) {
    return props.value[props.nameAttribute];
  }
  return '';
});
</script>
<template>
  <div class="lx-item-display lx-aligned-row">
    <template v-if="attributeExists(value, idAttribute) || attributeExists(value, nameAttribute)">
      <LxFlag
        v-if="attributeExists(value, idAttribute)"
        :value="value[idAttribute]"
        :title="flagTitle"
        size="s"
        :locale="locale"
        :meaningful="meaningful"
      />
      <span class="lx-data" v-if="attributeExists(value, nameAttribute)">
        {{ value[nameAttribute] }}
      </span>
    </template>
    <LxEmptyValue
      class="empty-flag-value"
      v-else
      :texts="{ emptyValue: displayTexts.emptyValue }"
    />
  </div>
</template>
