<script setup>
import { computed, onMounted, watch, ref } from 'vue';
import LxRow from '@/components/forms/Row.vue';
import { generateUUID } from '@/utils/stringUtils';
import LxPlaceholder from '@/components/forms/Placeholder.vue';
import { useVuelidate } from '@vuelidate/core';
import { required, helpers, minValue, maxValue, minLength, maxLength } from '@vuelidate/validators';
import { lxFormatUtils, lxDevUtils } from '@/utils';
import useLx from '@/hooks/useLx';

import LxFormBuilderItem from '@/components/forms/FormBuilderItem.vue';
import LxStack from '@/components/Stack.vue';
import { getDisplayTexts } from '@/utils/generalUtils';
import { getOtherSelectComponent } from '@/components/forms/formBuilderOtherSelect';

/**
 * Component for building forms.
 *
 * @property {String} id - The unique identifier for the form builder component. If not provided, a UUID will be generated.
 * @property {Object} modelValue - The values of the forms input components.
 * @property {Object} schema - Determines rows layout.
 * @property {Boolean} readOnly - Determines whether the form is read-only.
 * @property {String} mode - Determines whether the form will be built from modelValue or schema. Can be 'default', 'no-schema' or 'mixed'.
 * @property {Object} texts - The object containing text translations for the form.
 *
 * @function validateModel - Validates the model against the schema.
 *
 * @example
 * <FormBuilder
 *   id="form-builder"
 *   v-model="formData"
 *   :schema="formSchema"
 *   :read-only="isReadOnly"
 *   mode="default"
 *   :texts="formTexts"
 * />
 */
const props = defineProps({
  /**
   * The unique identifier for the form builder component.
   * @type {String}
   * @default generateUUID()
   * @since 1.1.0
   */
  id: { type: String, default: () => generateUUID() },
  /**
   * The values of the forms input components.
   * @type {Object}
   * @default null
   * @since 1.1.0
   */
  modelValue: { type: Object, default: null },
  /**
   * Determines rows layout.
   * @type {Object}
   * @default null
   * @since 1.1.0
   */
  schema: { type: Object, default: null },
  /**
   * Determines whether the form is read-only.
   * @type {boolean}
   * @default false
   * @since 1.1.0
   */
  readOnly: { type: Boolean, default: false },
  /**
   * Determines whether the form will be built from modelValue or schema.
   *
   * @type {String}
   * @default 'default'
   * @since 1.1.3
   */
  mode: { type: String, default: 'default' }, // 'default' || 'no-schema' || 'mixed' || 'view-builder'
  /**
   * Determines invalidation messages for the form.
   *
   * @type {Object}
   * @default null
   * @since 1.9.0
   */
  validations: { type: Object, default: null },
  /**
   * The object containing text translations for the form.
   * @type {Object}
   * @default {}
   * @since 1.1.0
   */
  texts: { type: Object, default: () => {} },
  builderOptions: {
    type: Object,
    default: () => ({
      schemaPath: null,
      componentStack: null,
      useRegistry: false,
    }),
  },
});

const textsDefault = {
  required: 'Šis lauks ir obligāts',
  minimum: 'Vērtībai jābūt lielākai vai vienādai ar {0}',
  exclusiveMinimum: 'Vērtībai jābūt lielākai par {0}',
  maximum: `Vērtībai jābūt mazākai vai vienādai ar {0}`,
  exclusiveMaximum: 'Vērtībai jābūt mazākai par {0}',
  multipleOf: 'Vērtībai jādalās ar skaitli {0}',
  minLength: 'Vērtības garumam jābūt lielākam par {0}',
  maxLength: 'Vērtības garumam jābūt mazākam par {0}',
  pattern: 'Vērtība neatbilst regulārajai izteiksmei {0}',
  minItems: 'Jāizvēlas vismaz {0} vērtības',
  maxItems: 'Jāizvēlas ne vairāk kā {0} vērtības',
  uniqueItems: 'Izvēlētās vērtības nav unikālas',
  minProperties: 'Objektam jābūt vismaz {0} atribūtiem',
  maxProperties: 'Objektam jābut ne vairāk kā {0} atribūtiem',
  addElement: 'Pievienot elementu',
  deleteElement: 'Dzēst elementu',
  saveElement: 'Pievienot elementu sarakstam',
  addObject: 'Pievienot objektu',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const emits = defineEmits(['update:modelValue', 'rowActionClick', 'emit', 'filterBuilderFilter']);

const model = computed({
  get() {
    if (!props.modelValue) return {};
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

function isRequiredRow(rowIndex) {
  return !!props.schema?.required?.some((x) => x === rowIndex);
}

const isSchemaValid = computed(() => {
  try {
    lxFormatUtils.objectClone(props.schema);
  } catch (e) {
    return false;
  }
  return true;
});

function isNotDate(row) {
  return (
    row?.format !== 'date' &&
    row?.format !== 'time' &&
    row?.format !== 'date-time' &&
    row?.format !== 'year' &&
    row?.format !== 'month' &&
    row?.format !== 'month-year' &&
    row?.format !== 'quarters'
  );
}

function stringSelect(row) {
  if (
    (row?.type === 'string' &&
      row?.lx?.kind !== 'multiline' &&
      !row?.lx?.variant &&
      isNotDate(row) &&
      !row?.enum) ||
    (row?.type === 'number' && !row?.lx?.variant && isNotDate(row) && !row?.enum)
  )
    return 'textInputDefault';
  if (row?.type === 'string' && row?.lx?.kind === 'multiline') return 'textArea';
  if (row?.type === 'string' && !isNotDate(row)) return 'dateTimePicker';
  return '';
}

function arraySelect(row) {
  if (row?.type === 'array' && row?.lx?.displayType === 'list') return 'arrayList';
  if (row?.type === 'array' && row?.lx?.displayType === 'listModal') return 'arrayListModal';
  if (row?.type === 'array' && row?.lx?.displayType === 'table') return 'arrayTable';
  if (row?.type === 'array' && row?.lx?.displayType === 'tableModal') return 'arrayTableModal';
  if (Array.isArray(row?.lx?.items) || row?.enum) {
    return 'valuePicker';
  }
  if (row?.items?.properties && row?.type === 'array') return 'appendableList';
  if (row?.type === 'array' && row?.items?.type !== 'object' && row?.items)
    return 'smallAppendableList';
  return '';
}

function objectSelect(row, name) {
  if (row?.lx?.displayType === 'map' && row?.type === 'object') return 'map';
  if (
    row?.type === 'object' &&
    model.value?.[name] !== undefined &&
    model.value?.[name] !== null &&
    row?.lx?.displayType === 'modal'
  )
    return 'objectList';
  if (row?.type === 'object' && !model.value?.[name] && row?.lx?.displayType === 'modal')
    return 'objectButton';
  if (row?.type === 'object' && model.value?.[name] !== undefined && model.value?.[name] !== null)
    return 'dataBlock';
  return '';
}

function otherSelect(row) {
  return getOtherSelectComponent(row);
}

function getStringComponent(row) {
  const selected = stringSelect(row);
  if (selected) return selected;
  return null;
}

function shouldUseArraySelect(row) {
  return (row?.type === 'string' && (row?.lx?.variant || row?.enum)) || row?.type === 'array';
}

function getArrayComponent(row) {
  const selected = arraySelect(row);
  if (selected !== '') return selected;
  return null;
}

function getObjectComponent(row, name) {
  const selected = objectSelect(row, name);
  if (selected !== '') return selected;
  return null;
}

function logUnrenderedProperty(name) {
  if (!name) return;

  lxDevUtils.log(
    `Property '${name}' couldn't be rendered`,
    useLx().getGlobals()?.environment,
    'warn'
  );
}

function componentSelect(row, name) {
  if (row?.lx?.wrapper === 'placeholder') return 'lxPlaceholder';
  const otherComponent = otherSelect(row);
  if (otherComponent) return otherComponent;

  const stringComponent = getStringComponent(row);
  if (stringComponent) return stringComponent;

  if (row?.type === 'integer') return 'textInputInteger';

  if (row?.type === 'boolean') return 'toggle';

  if (shouldUseArraySelect(row)) {
    const arrayComponent = getArrayComponent(row);
    if (arrayComponent) return arrayComponent;
  }
  const objectComponent = getObjectComponent(row, name);
  if (objectComponent) return objectComponent;

  logUnrenderedProperty(name);
  return 'lxPlaceholder';
}

// Used for adding default values defined in schema to the modelValue
function addDefaultValues() {
  const res = { ...props.modelValue };
  if (props.schema?.properties) {
    Object.entries(props.schema?.properties)?.forEach(([key, value]) => {
      if (value?.lx?.displayType === 'dateTimeRange') {
        if (res[key] === undefined || res[key] === null) {
          res[key] = {};
        }
      }
      if (value?.default !== undefined) {
        if (
          res[key] === undefined ||
          res[key] === null ||
          (Array.isArray(res[key]) && res[key]?.length === 0)
        ) {
          res[key] = value?.default;
        }
      }
      if (value?.properties && value?.lx?.displayType === 'stack') {
        res[key] = res[key] || {};
        Object.entries(value?.properties)?.forEach(([key1, value1]) => {
          if (value1?.lx?.displayType === 'dateTimeRange') {
            if (res[key][key1] === undefined || res[key][key1] === null) {
              res[key][key1] = {};
            }
          }
          if (value1?.default !== undefined) {
            if (
              res[key][key1] === undefined ||
              res[key][key1] === null ||
              (Array.isArray(res[key][key1]) && res[key][key1]?.length === 0)
            ) {
              res[key][key1] = value1?.default;
            }
          }
          if (value1?.properties && value1?.lx?.displayType === 'stack') {
            res[key][key1] = res[key][key1] || {};
          }
        });
      }
    });
  }
  model.value = res;
}
// Generates primitive schema based on the modelValue
const schemaGenerator = computed(() => {
  const res = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {},
  };
  Object.entries(model.value)?.forEach(([key, value]) => {
    if (typeof value === 'string') res.properties[key] = { type: 'string' };
    else if (typeof value === 'boolean') res.properties[key] = { type: 'boolean' };
    else if (typeof value === 'number') res.properties[key] = { type: 'number' };
    else if (Array.isArray(value) && typeof value[0] === 'object') {
      res.properties[key] = { type: 'array', items: { type: 'object', properties: {} } };
      Object.entries(value[0])?.forEach(([key1, value1]) => {
        if (key1 !== '_lx_appendableKey') {
          if (typeof value1 === 'string')
            res.properties[key].items.properties[key1] = { type: 'string' };
          else if (typeof value1 === 'boolean')
            res.properties[key].items.properties[key1] = { type: 'boolean' };
        }
      });
    } else {
      res.properties[key] = { lx: { wrapper: 'placeholder' } };
    }
  });
  return res;
});

const mixedSchema = computed(() => {
  const res = lxFormatUtils.objectClone(schemaGenerator.value);
  if (props.mode === 'mixed') {
    try {
      if (props.schema?.hasOwnProperty('required')) res.required = props.schema?.required;
      Object.entries(schemaGenerator.value?.properties)?.forEach(([key]) => {
        if (props.schema?.properties?.hasOwnProperty(key)) {
          res.properties[key] = props.schema?.properties[key];
        }
      });
      Object.entries(props.schema?.properties)?.forEach(([key, value]) => {
        if (!res?.properties?.hasOwnProperty(key)) {
          res.properties[key] = value;
        }
      });
      return res;
    } catch (err) {
      lxDevUtils.log(err, useLx().getGlobals()?.environment, 'warn');
    }
  }
  return res;
});

const displaySchema = computed(() => {
  try {
    if (props.mode === 'no-schema') return schemaGenerator.value;
    if (props.mode === 'mixed') return mixedSchema.value;
  } catch (err) {
    lxDevUtils.log(err, useLx().getGlobals()?.environment, 'warn');
  }
  return props.schema;
});

// Sorts the schema based on the order property for propper rendering sequence
const orderedObject = computed(() => {
  if (props.mode === 'no-schema') return schemaGenerator.value?.properties;
  if (displaySchema.value?.properties) {
    const inputObject = lxFormatUtils.objectClone(displaySchema.value?.properties);
    const arrayRepresentation = Object.entries(inputObject);
    const sortedArray = arrayRepresentation.sort((a, b) => {
      const orderA = a[1]?.lx?.order ? a[1].lx.order : 1000;
      const orderB = b[1]?.lx?.order ? b[1].lx.order : 1000;
      return orderA - orderB;
    });

    const sortedObject = Object.fromEntries(sortedArray);
    return sortedObject;
  }
  return {};
});

function componentEmit(emitName, key, value = undefined, additionalParams = undefined) {
  emits('emit', emitName, key, value, additionalParams);
}

function replaceErrorMessage(message, value) {
  return message.replace('{0}', value);
}

function rowActionClicked(action, value, schemaName, index) {
  emits('rowActionClick', action, value, schemaName, index);
}

function isNumber(type) {
  return type === 'number' || type === 'integer';
}

function ensureRuleContainer(res, key) {
  if (!res[key]) {
    res[key] = {};
  }
  return res[key];
}

function setRule(res, key, ruleName, validator) {
  ensureRuleContainer(res, key)[ruleName] = validator;
}

function addRequiredRules(schema, res) {
  schema?.required?.forEach((property) => {
    setRule(
      res,
      property,
      'required',
      helpers.withMessage(() => displayTexts.value.required, required)
    );
  });
}

function createExclusiveMinimumValidator(param) {
  return helpers.withParams(
    { type: 'exclusiveMinimum', value: param },
    (targetValue) => targetValue > param
  );
}

function createExclusiveMaximumValidator(param) {
  return helpers.withParams(
    { type: 'exclusiveMaximum', value: param },
    (targetValue) => targetValue < param
  );
}

function createMultipleOfValidator(param) {
  return helpers.withParams(
    { type: 'multipleOf', value: param },
    (targetValue) => targetValue % param === 0
  );
}

function createPatternValidator(param) {
  return helpers.withParams({ type: 'pattern', value: param }, (targetValue) =>
    new RegExp(param).test(targetValue)
  );
}

function addNumberRules(res, key, value) {
  if (!isNumber(value?.type)) {
    return;
  }

  if (value?.minimum !== undefined) {
    setRule(
      res,
      key,
      'minValue',
      helpers.withMessage(
        ({ $params }) => replaceErrorMessage(displayTexts.value.minimum, $params.min),
        minValue(value.minimum)
      )
    );
  }

  if (value?.exclusiveMinimum !== undefined) {
    setRule(
      res,
      key,
      'exclusiveMinimum',
      helpers.withMessage(
        () => replaceErrorMessage(displayTexts.value.exclusiveMinimum, value.exclusiveMinimum),
        createExclusiveMinimumValidator(value.exclusiveMinimum)
      )
    );
  }

  if (value?.maximum !== undefined) {
    setRule(
      res,
      key,
      'maxValue',
      helpers.withMessage(
        ({ $params }) => replaceErrorMessage(displayTexts.value.maximum, $params.max),
        maxValue(value.maximum)
      )
    );
  }

  if (value?.exclusiveMaximum !== undefined) {
    setRule(
      res,
      key,
      'exclusiveMaximum',
      helpers.withMessage(
        () => replaceErrorMessage(displayTexts.value.exclusiveMaximum, value.exclusiveMaximum),
        createExclusiveMaximumValidator(value.exclusiveMaximum)
      )
    );
  }

  if (value?.multipleOf !== undefined) {
    setRule(
      res,
      key,
      'multipleOf',
      helpers.withMessage(
        () => replaceErrorMessage(displayTexts.value.multipleOf, value.multipleOf),
        createMultipleOfValidator(value.multipleOf)
      )
    );
  }
}

function addStringRules(res, key, value) {
  if (value?.type !== 'string') {
    return;
  }

  if (value?.minLength !== undefined) {
    setRule(
      res,
      key,
      'minLength',
      helpers.withMessage(
        ({ $params }) => replaceErrorMessage(displayTexts.value.minLength, $params.min),
        minLength(value.minLength)
      )
    );
  }

  if (value?.maxLength !== undefined) {
    setRule(
      res,
      key,
      'maxLength',
      helpers.withMessage(
        ({ $params }) => replaceErrorMessage(displayTexts.value.maxLength, $params.max),
        maxLength(value.maxLength)
      )
    );
  }

  if (value?.pattern) {
    setRule(
      res,
      key,
      'pattern',
      helpers.withMessage(
        () => replaceErrorMessage(displayTexts.value.pattern, value.pattern),
        createPatternValidator(value.pattern)
      )
    );
  }
}

function createUniqueItemsValidator(targetValue) {
  return new Set(targetValue)?.size === targetValue?.length;
}

function addArrayRules(res, key, value) {
  if (value?.type !== 'array') {
    return;
  }

  if (value?.minItems !== undefined) {
    setRule(
      res,
      key,
      'minItems',
      helpers.withMessage(
        ({ $params }) => replaceErrorMessage(displayTexts.value.minItems, $params.min),
        minLength(value.minItems)
      )
    );
  }

  if (value?.maxItems !== undefined) {
    setRule(
      res,
      key,
      'maxItems',
      helpers.withMessage(
        ({ $params }) => replaceErrorMessage(displayTexts.value.maxItems, $params.max),
        maxLength(value.maxItems)
      )
    );
  }

  if (value?.uniqueItems) {
    setRule(
      res,
      key,
      'uniqueItems',
      helpers.withMessage(() => displayTexts.value.uniqueItems, createUniqueItemsValidator)
    );
  }
}

function addRulesForProperty(res, key, value) {
  addNumberRules(res, key, value);
  addStringRules(res, key, value);
  addArrayRules(res, key, value);
}

function addPropertyRules(schema, res, buildRulesFn) {
  if (!schema?.properties) {
    return;
  }

  Object.entries(schema.properties).forEach(([key, value]) => {
    if (value?.type === 'object' && value?.properties) {
      res[key] = buildRulesFn(value);
      return;
    }

    addRulesForProperty(res, key, value);
  });
}

function createMinPropertiesValidator(param) {
  return helpers.withParams(
    { type: 'minProperties', value: param },
    (targetValue) => Object.keys(targetValue).length >= param
  );
}

function createMaxPropertiesValidator(param) {
  return helpers.withParams(
    { type: 'maxProperties', value: param },
    (targetValue) => Object.keys(targetValue).length <= param
  );
}

function addObjectBoundaryRules(schema, res) {
  if (schema?.minProperties !== undefined && schema?.type === 'object') {
    res.minProperties = helpers.withMessage(
      () => replaceErrorMessage(displayTexts.value.minProperties, schema.minProperties),
      createMinPropertiesValidator(schema.minProperties)
    );
  }

  if (schema?.maxProperties !== undefined && schema?.type === 'object') {
    res.maxProperties = helpers.withMessage(
      () => replaceErrorMessage(displayTexts.value.maxProperties, schema.maxProperties),
      createMaxPropertiesValidator(schema.maxProperties)
    );
  }
}

// Creates rule for 'modelValue' validation based on the provided schema
function buildRules(schema) {
  const res = {};
  addRequiredRules(schema, res);
  addPropertyRules(schema, res, buildRules);
  addObjectBoundaryRules(schema, res);
  return res;
}

const rules = computed(() => {
  if (!props.schema) return { modelClone: {} };
  return { modelClone: buildRules(props.schema) };
});

const vv = ref();

/**
 * Validates the model based on the provided rules in schema prop.
 *
 * @return {Array} An array of validation errors, if any.
 */
function validateModel() {
  const res = [];
  if (props.mode !== 'no-schema') {
    const modelClone = lxFormatUtils.objectClone(model.value);
    vv.value = useVuelidate(rules, { modelClone }, { $autoDirty: true });
    vv.value.value.modelClone.$touch();

    const errorsArray = vv.value.value?.$errors;
    errorsArray?.forEach((x) => {
      const item = {};
      item.propertyPath = x.$propertyPath;
      item.validator = x.$validator;
      item.message = x.$message;
      item.value = x.$params;
      res.push(item);
    });
  }
  return res;
}

function clearValidations() {
  vv.value.value.modelClone.$reset();
}

watch(
  () => props.schema,
  () => {
    if (props.mode !== 'no-schema' && props.mode !== 'view-builder') addDefaultValues();
  }
);

onMounted(() => {
  if (props.mode !== 'no-schema' && props.mode !== 'view-builder') addDefaultValues();
});

defineExpose({ validateModel, clearValidations, componentSelect });
</script>

<template>
  <template v-if="isSchemaValid">
    <template v-for="(row, name) in orderedObject" :key="name">
      <LxPlaceholder v-if="componentSelect(row, name) === 'lxPlaceholder'" class="lx-placeholder" />
      <LxRow
        v-else-if="row?.lx?.displayType !== 'section'"
        :label="
          displaySchema?.properties[name]?.title ? displaySchema?.properties[name]?.title : name
        "
        :rowSpan="displaySchema?.properties[name]?.lx?.rowSpan"
        :columnSpan="displaySchema?.properties[name]?.lx?.columnSpan"
        :required="isRequiredRow(name)"
        :inputId="`${id}-${name}`"
        :id="`${id}-${name}-wrapper`"
        :actionDefinitions="displaySchema?.properties[name]?.lx?.rowActionDefinitions"
        :builderOptions="{
          schemaPath: `${builderOptions?.schemaPath}.${name}`,
          componentStack: builderOptions?.componentStack?.concat([
            { id: `${id}-${name}-wrapper`, name: 'LxRow' },
          ]),
          useRegistry: builderOptions?.useRegistry,
        }"
        @actionClick="(a, b, c) => rowActionClicked(b, c, name, undefined)"
      >
        <template #info v-if="row?.description">{{ row?.description }}</template>
        <LxStack
          v-if="componentSelect(row, name) === 'stack'"
          :id="`${id}-${name}`"
          :orientation="row?.lx?.orientation"
          :kind="row?.lx?.kind"
          :mode="row?.lx?.mode"
          :horizontalAlignment="row?.lx?.horizontalAlignment"
          :verticalAlignment="row?.lx?.verticalAlignment"
          :horizontalConfig="row?.lx?.horizontalConfig"
          :verticalConfig="row?.lx?.verticalConfig"
        >
          <template
            v-for="(item, itemName) in displaySchema?.properties[name]?.properties"
            :key="itemName"
          >
            <LxStack
              v-if="componentSelect(item, itemName) === 'stack'"
              :id="`${id}-${itemName}`"
              :orientation="item?.lx?.orientation"
              :kind="item?.lx?.kind"
              :mode="item?.lx?.mode"
              :horizontalAlignment="item?.lx?.horizontalAlignment"
              :verticalAlignment="item?.lx?.verticalAlignment"
              :horizontalConfig="item?.lx?.horizontalConfig"
              :verticalConfig="item?.lx?.verticalConfig"
            >
              <template
                v-for="(nestedItem, nestedItemName) in displaySchema?.properties[name]?.properties[
                  itemName
                ]?.properties"
                :key="nestedItemName"
              >
                <LxFormBuilderItem
                  v-if="model[name]"
                  :id="`${id}-${nestedItemName}`"
                  v-model="model[name][itemName]"
                  :readOnly="readOnly"
                  :row="nestedItem"
                  :name="nestedItemName"
                  :displaySchema="displaySchema?.properties[name]?.properties[itemName]"
                  :vv="vv"
                  :orderedObject="orderedObject?.[name]?.properties?.[itemName]?.properties"
                  :texts="displayTexts"
                  :parentName="`${name}.${itemName}`"
                  :validations="validations?.[name]?.[itemName]"
                  @rowActionClick="(a, b, c, d) => rowActionClicked(a, b, c, d)"
                  @emit="(a, b, c, d) => componentEmit(a, b, c, d)"
                  @filterBuilderFilter="emits('filterBuilderFilter')"
                />
              </template>
            </LxStack>
            <LxFormBuilderItem
              v-else
              :id="id"
              v-model="model[name]"
              :readOnly="readOnly"
              :row="item"
              :name="itemName"
              :displaySchema="displaySchema?.properties[name]"
              :vv="vv"
              :orderedObject="orderedObject?.[name]?.properties"
              :parentName="name"
              :texts="displayTexts"
              :validations="validations?.[name]"
              @rowActionClick="(a, b, c, d) => rowActionClicked(a, b, c, d)"
              @emit="(a, b, c, d) => componentEmit(a, b, c, d)"
              @filterBuilderFilter="emits('filterBuilderFilter')"
            />
          </template>
        </LxStack>
        <LxFormBuilderItem
          v-else
          :id="id"
          v-model="model"
          :readOnly="readOnly"
          :row="row"
          :name="name"
          :displaySchema="displaySchema"
          :schema="schema"
          :vv="vv"
          :orderedObject="orderedObject"
          :texts="displayTexts"
          :validations="validations"
          :builderOptions="{
            componentStack: builderOptions?.componentStack?.concat([
              { id: `${id}-${name}-wrapper`, name: 'LxRow' },
            ]),
            useRegistry: builderOptions?.useRegistry,
            schemaPath: `${builderOptions?.schemaPath}`,
          }"
          @rowActionClick="(a, b, c, d) => rowActionClicked(a, b, c, d)"
          @emit="(a, b, c, d) => componentEmit(a, b, c, d)"
          @filterBuilderFilter="emits('filterBuilderFilter')"
        />
      </LxRow>
    </template>
  </template>
</template>
