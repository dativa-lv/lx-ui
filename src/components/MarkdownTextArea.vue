<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, inject } from 'vue';
import { useElementSize } from '@vueuse/core';
import PlaceholderData from '@/components/markdownExtensions/PlaceholderData';
import ImageComponent from '@/components/markdownExtensions/Image';
import HiddenIdNode from '@/components/markdownExtensions/Node';
import LxButton from '@/components/Button.vue';
import LxModal from '@/components/Modal.vue';
import LxIcon from '@/components/Icon.vue';
import LxTextInput from '@/components/TextInput.vue';
import LxDropDownMenu from '@/components/DropDownMenu.vue';
import LxFileUploader from '@/components/fileUploader/FileUploader.vue';
import LxForm from '@/components/forms/Form.vue';
import LxRow from '@/components/forms/Row.vue';
import LxToolbar from '@/components/Toolbar.vue';
import LxContentSwitcher from '@/components/ContentSwitcher.vue';
import LxRichTextDisplay from '@/components/RichTextDisplay.vue';
import LxLoader from '@/components/Loader.vue';
import { isUrl, isUri, generateUUID, isEmail, isPhone } from '@/utils/stringUtils';
import { checkArrayObjectProperty } from '@/utils/arrayUtils';
import { getDisplayTexts } from '@/utils/generalUtils';
import { formatValue, formatUrl } from '@/utils/formatUtils';
import { loadLibrary } from '@/utils/libLoader';

const props = defineProps({
  id: { type: String, default: () => generateUUID() },
  modelValue: { type: String, default: null },
  placeholder: { type: String, default: null },
  rows: { type: Number, default: 3 },
  maxlength: { type: Number, default: null },
  disabled: { type: Boolean, default: false },
  showColorPicker: { type: Boolean, default: false },
  invalid: { type: Boolean, default: false },
  invalidationMessage: { type: String, default: null },
  readOnly: { type: Boolean, default: false },
  showLinkEditor: { type: Boolean, default: true },
  tooltip: { type: String, default: null },
  showPlaceholderPicker: { type: Boolean, default: false },
  showImagePicker: { type: Boolean, default: false },
  showUnderlineToggle: { type: Boolean, default: false },
  showHeadingPicker: { type: Boolean, default: false },
  imageMaxSize: { type: Number, default: 3000000 }, // 3MB
  dictionary: { type: Object, default: null },
  labelId: { type: String, default: null },
  actionDefinitions: { type: Array, default: () => [] },
  texts: { type: Object, default: () => ({}) },
});

const emits = defineEmits(['update:modelValue', 'notification', 'preparedImage', 'actionClick']);

const textsDefault = {
  undo: 'Atcelt pēdējo darbību',
  redo: 'Atgriezt atcelto darbību',
  bold: 'Treknraksts',
  italic: 'Slīpraksts',
  underline: 'Pasvītrojums',
  strikethrough: 'Pārsvītrojums',
  color: 'Krāsas izvēle',
  clear: 'Notīrīt krāsu',
  heading: 'Virsraksta izmēra izvēle',
  headingH1: 'Virsraksts 1',
  headingH2: 'Virsraksts 2',
  headingH3: 'Virsraksts 3',
  headingH4: 'Virsraksts 4',
  headingH5: 'Virsraksts 5',
  headingH6: 'Virsraksts 6',
  bulleted: 'Saraksts bez numerācijas',
  numbered: 'Saraksts ar numerāciju',
  link: 'Saite',
  image: 'Attēls',
  templatePicker: 'Vietturi',
  modalLabel: 'Saites izveidošana',
  modalDescription: 'Pievienot saiti uz:',
  save: 'Saglabāt',
  close: 'Aizvērt',
  imageModalLabel: 'Attēla pievienošana',
  imageModalLinkDescription: 'Pievienot attēlu no URL:',
  imageModalAltDescription: 'Attēla alternatīvais nosaukums',
  imageModalTitleDescription: 'Attēla virsraksts',
  invalidImageLink: 'Ievadītais URL nav derīgs',
  chooseFile: 'Izvēlēties attēlu',
  imageModalFileDescription: 'Pievienot attēla datni',
  inputTypeUrl: 'Saite',
  inputTypeFile: 'Datne',
  invalidLinkMessage: 'Saite tika ievadīta nekorektā formā!',
};

const displayTexts = computed(() => getDisplayTexts(props.texts, textsDefault));

const loading = ref(true);

const editor = ref(null);
const text = ref(null);
const maxlengthExceeded = ref(false);

const inputImage = ref();
const inputAlt = ref();
const inputTitle = ref();
const inputImageField = ref();

const imageLink = ref();

const editUrlModal = ref();
const inputLink = ref();
const inputLinkField = ref();
const markdownImageModal = ref();

const colorDropDown = ref();
const placeholderDropDown = ref();

const isNotLink = ref(false);
const isNotImage = ref(false);

const isModalOpen = ref(false);

const uploadedImage = ref();
const fileUploader = ref();
const allowedFileExtensions = ref(['image/*']);
const markdownWrapper = ref();
const imageModalInputType = ref('url');
const modalActionDefinitions = ref([
  {
    id: 'save',
    name: displayTexts.value.save,
    kind: 'primary',
  },
  {
    id: 'close',
    name: displayTexts.value.close,
    kind: 'secondary',
  },
]);

const rowId = inject('rowId', ref(null));

let headingCounter = 0;
let Editor = null;
let EditorContent = null;
let Heading = null;
let StarterKit = null;
let Placeholder = null;
let Link = null;
let Underline = null;
let CharacterCount = null;
let TextStyle = null;
let Color = null;
let Markdown = null;
let Plugin = null;

const model = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emits('update:modelValue', value);
  },
});

const isHeadingSelected = computed(() => editor.value.isActive('heading'));

const headingDefinitions = computed(() => [
  {
    id: 'Heading1',
    name: displayTexts.value.headingH1,
    active: editor.value.isActive('heading', { level: 1 }),
    level: 1,
  },
  {
    id: 'Heading2',
    name: displayTexts.value.headingH2,
    active: editor.value.isActive('heading', { level: 2 }),
    level: 2,
  },
  {
    id: 'Heading3',
    name: displayTexts.value.headingH3,
    active: editor.value.isActive('heading', { level: 3 }),
    level: 3,
  },
  {
    id: 'Heading4',
    name: displayTexts.value.headingH4,
    active: editor.value.isActive('heading', { level: 4 }),
    level: 4,
  },
  {
    id: 'Heading5',
    name: displayTexts.value.headingH5,
    active: editor.value.isActive('heading', { level: 5 }),
    level: 5,
  },
  {
    id: 'Heading6',
    name: displayTexts.value.headingH6,
    active: editor.value.isActive('heading', { level: 6 }),
    level: 6,
  },
]);

const isDisabled = computed(() => props.disabled);

const characterCount = computed(
  () => editor.value && editor.value.storage.characterCount.characters()
);

const isSelectionEmpty = computed(() => editor.value?.state?.selection?.empty);

const imageInputTypes = computed(() => [
  { id: 'url', name: displayTexts.value.inputTypeUrl },
  { id: 'fileUploader', name: displayTexts.value.inputTypeFile },
]);

const labelledBy = computed(() => props.labelId || rowId.value);

const formatActionsButtons = computed(() => {
  const baseActions = [
    { name: 'bold', icon: 'text-bold', command: 'toggleBold' },
    { name: 'italic', icon: 'text-italic', command: 'toggleItalic' },
    { name: 'underline', icon: 'text-underline', command: 'toggleUnderline' },
    {
      name: 'strikethrough',
      icon: 'text-strikethrough',
      command: 'toggleStrike',
      isActiveCheck: 'strike',
    },
  ];

  return baseActions.filter(
    (action) => !(action.name === 'underline' && !props.showUnderlineToggle)
  );
});

const listActionsButtons = computed(() => [
  {
    name: 'bulleted',
    icon: 'list-bulleted',
    command: 'toggleBulletList',
    isActiveCheck: 'bulletList',
  },
  {
    name: 'numbered',
    icon: 'list-numbered',
    command: 'toggleOrderedList',
    isActiveCheck: 'orderedList',
  },
]);

const colorPickerColors = [
  { name: 'black', var: 'var(--color-data)' },
  { name: 'red', var: 'var(--color-red)' },
  { name: 'orange', var: 'var(--color-orange)' },
  { name: 'yellow', var: 'var(--color-yellow)' },
  { name: 'green', var: 'var(--color-green)' },
  { name: 'teal', var: 'var(--color-teal)' },
  { name: 'blue', var: 'var(--color-blue)' },
  { name: 'purple', var: 'var(--color-purple)' },
  { name: 'label', var: 'var(--color-label)' },
];

function shouldKeepToolbarFocus(target) {
  return target instanceof Element
    ? Boolean(
        target.closest('.lx-component-toolbar, .lx-dropdown-panel-wrapper, .lx-dropdown-panel')
      )
    : false;
}

function focus(event) {
  if (!editor.value || isModalOpen.value || shouldKeepToolbarFocus(event?.target)) {
    return;
  }
  editor.value.commands.focus();
}

function runToolbarCommand(commandBuilder) {
  if (!editor.value) {
    return;
  }

  commandBuilder(editor.value.chain()).run();
}

function restoreToolbarActionFocus(actionId) {
  nextTick(() => {
    const wrapper = markdownWrapper.value;
    if (!wrapper) {
      return;
    }

    const actionButton =
      wrapper.querySelector(`[id="${props.id}-action-${actionId}"]`) ||
      wrapper.querySelector(`.lx-component-toolbar [id$="-action-${actionId}"]`);

    if (actionButton instanceof HTMLElement) {
      actionButton.focus();
    }
  });
}

function concatEscapedWords(words) {
  const escapedWords = words.map((word) => word?.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));
  const joinedWords = escapedWords.join('|');
  return joinedWords;
}

function createEditorExtensions() {
  const CustomHeadingWithAutoId = Heading.extend({
    levels: [1, 2, 3, 4, 5, 6],

    onCreate() {
      headingCounter = 0;
    },

    addAttributes() {
      return {
        ...this.parent?.(),
        id: {
          default: null,
          parseHTML: (element) => {
            // When parsing existing content, maintain the counter
            const currentId = element.getAttribute('id');
            if (currentId && currentId.startsWith('markdown-section-')) {
              const num = Number.parseInt(currentId.split('-').pop(), 10);
              headingCounter = Math.max(headingCounter, num);
            }
            return currentId;
          },

          renderHTML: (attributes) => {
            if (!attributes.id) {
              headingCounter += 1;
              return { id: `markdown-section-${props.id}-${headingCounter}` };
            }
            return { id: attributes.id };
          },
        },
      };
    },
  });

  const ext = [
    Markdown,
    StarterKit.configure({
      heading: false,
    }),
    TextStyle,
    Color,
    ImageComponent.configure({
      allowBase64: true,
    }),
    CustomHeadingWithAutoId,
    HiddenIdNode,
    Underline,

    Link.configure({
      autolink: false,
      validate: (href) => /^[a-z][a-z0-9+.-]*:/i.test(href),
    }),

    Placeholder.configure({
      placeholder: props.placeholder,
    }),

    CharacterCount.configure({}),
  ];

  if (checkArrayObjectProperty(props.dictionary, 'value')) {
    const words = props.dictionary.map((item) => item.value);
    const joinedWords = concatEscapedWords(words);

    ext.push(
      PlaceholderData.configure({
        regexWords: joinedWords,
        dictionary: props.dictionary,
      })
    );
  }

  const getCharCount = (node) =>
    editor.value?.storage?.characterCount?.characters({ node }) ?? node.textContent.length;

  const plug = new Plugin({
    filterTransaction: (transaction, state) => {
      const max = props.maxlength;

      if (!transaction.docChanged || !max) {
        return true;
      }

      const newSize = getCharCount(transaction.doc);

      if (newSize <= max) {
        return true;
      }

      const isPaste = Boolean(transaction.getMeta('paste'));

      if (isPaste) {
        return true;
      }

      return getCharCount(state.doc) > max && newSize <= getCharCount(state.doc);
    },
    appendTransaction: (_, __, newState) => {
      const max = props.maxlength;

      if (!max) {
        return null;
      }

      const currentSize = getCharCount(newState.doc);
      if (currentSize <= max) {
        return null;
      }

      for (let targetChars = max; targetChars >= 0; targetChars -= 1) {
        let charCount = 0;
        let cutPos = null;

        newState.doc.descendants((node, pos) => {
          if (cutPos !== null) return false;
          if (node.isText) {
            const remaining = targetChars - charCount;
            if (remaining <= 0) {
              cutPos = pos;
              return false;
            }
            if (remaining <= node.text.length) {
              cutPos = pos + remaining;
              return false;
            }
            charCount += node.text.length;
          }
          return true;
        });

        if (cutPos === null) {
          return null;
        }

        const tr = newState.tr.delete(cutPos, newState.doc.content.size);
        if (getCharCount(tr.doc) <= max) {
          return tr;
        }
      }

      return null;
    },
  });

  editor.value = new Editor({
    content: model.value,
    editable: !isDisabled.value,
    extensions: ext,
    injectCSS: false,
  });

  editor.value.registerPlugin(plug);

  loading.value = false;

  editor.value.on('update', () => {
    text.value = editor.value.storage.markdown.getMarkdown();
    emits('update:modelValue', text.value);
  });
}

function clearModalVariables() {
  inputImage.value = null;
  inputAlt.value = null;
  inputTitle.value = null;
  uploadedImage.value = null;
}

function closeImageModal() {
  markdownImageModal.value.close();
  clearModalVariables();
}

function openImage() {
  markdownImageModal.value.open();
  isModalOpen.value = true;
}

function getImageSource() {
  let src = null;
  let alt = '';
  let title = '';
  let width = null;
  let height = null;
  let isBase64 = false;

  const file = fileUploader.value?.getFiles()[0];
  if (file) {
    if (file.meta?.exif?.['Image Height']?.description) {
      height = file.meta.exif['Image Height'].description;
    }
    if (file.meta?.exif?.['Image Width']?.description) {
      width = file.meta.exif['Image Width'].description;
    }
  }

  if (imageLink.value) {
    src = imageLink.value;
  } else if (uploadedImage.value) {
    src = uploadedImage.value[0].content;
    alt = uploadedImage.value[0].name;
    title = uploadedImage.value[0].name;
    isBase64 = true;
  }

  return { src, alt, title, width, height, isBase64 };
}

function emitNotification(message) {
  emits('notification', message);
}

function createImageLoader(base64, width, height, loaderClass, alt, title, aspect) {
  const id = generateUUID();
  editor.value
    .chain()
    .focus()
    .createHiddenIdNode({ class: loaderClass, id, width, height, aspect })
    .run();
  emits('preparedImage', base64, id, alt, title);
}

function repleaceImageLoader(src, id, alt, title) {
  editor.value
    .chain()
    .swapToImage({
      id,
      src,
      alt,
      title,
    })
    .run();
}

function removeImageLoader(id) {
  editor.value.chain().focus().removeNode(id).run();
}

function removeAllImageLoaders() {
  editor.value.chain().focus().removeAllNodes().run();
}

function formatSize(size) {
  return Number(size?.replace('px', ''));
}

function updateAltText(alt, isBase64) {
  return alt === '' || (isBase64 && inputAlt.value) ? inputAlt.value : alt;
}

function updateTitleText(title, isBase64) {
  return title === '' || (isBase64 && inputTitle.value) ? inputTitle.value : title;
}

function isBase64Image(src) {
  return /^data:image\/.{0,11};base64,/.test(src);
}

function formatImageUrl(src) {
  const idx = src.indexOf('?');
  const formattedUrl = formatUrl(src.slice(0, idx === -1 ? undefined : idx));
  return isUrl(formattedUrl) ? formattedUrl : null;
}

function calculateAspectRatio(width, height) {
  return formatSize(width) / formatSize(height) || 4 / 3;
}

function determineLoaderClass(width, height, containerElementSize) {
  if ((height && formatSize(height) < 30) || (width && formatSize(width) < 30)) {
    return { loaderClass: 'image-loader no-loader', height, width };
  }
  if ((height && formatSize(height) < 100) || (width && formatSize(width) < 100)) {
    return { loaderClass: 'image-loader small', height, width };
  }
  if (width && formatSize(width) > containerElementSize.width.value) {
    return {
      loaderClass: 'image-loader large',
      height: 'auto',
      width: `${containerElementSize.width.value - 35}px`,
    };
  }
  return { loaderClass: 'image-loader default', height, width };
}

function setImage() {
  const { src, alt, title, width, height, isBase64 } = getImageSource();
  const containerElementSize = useElementSize(markdownWrapper);
  const aspect = calculateAspectRatio(width, height);
  const {
    loaderClass,
    height: loaderHeight,
    width: loaderWidth,
  } = determineLoaderClass(width, height, containerElementSize);

  if (!src) {
    emitNotification('noImageGiven');
    return;
  }

  const updatedAlt = updateAltText(alt, isBase64);
  const updatedTitle = updateTitleText(title, isBase64);

  const loaderId = generateUUID();

  createImageLoader(src, loaderWidth, loaderHeight, loaderClass, updatedAlt, updatedTitle, aspect);

  if (isBase64Image(src)) {
    repleaceImageLoader(src, loaderId, updatedAlt, updatedTitle);
    closeImageModal();
    return;
  }

  if (isNotImage.value) {
    emitNotification('imageNotFound');
    return;
  }

  const formattedUrl = formatImageUrl(src);
  if (!formattedUrl) {
    emitNotification('invalidAdress');
    return;
  }

  repleaceImageLoader(formattedUrl, loaderId, updatedAlt, updatedTitle);
  closeImageModal();
}

async function loadTiptap() {
  const lib = await loadLibrary('tiptap');

  Editor = lib.Editor;
  EditorContent = lib.EditorContent;
  Heading = lib.Heading;
  StarterKit = lib.StarterKit;
  Placeholder = lib.Placeholder;
  Link = lib.Link;
  Underline = lib.Underline;
  CharacterCount = lib.CharacterCount;
  TextStyle = lib.TextStyle;
  Color = lib.Color;
  Markdown = lib.Markdown;
  Plugin = lib.Plugin;
}

async function updateEditorExtensions() {
  await loadTiptap();
  editor.value.destroy();
  createEditorExtensions();
}

function setLink() {
  isNotLink.value = false;
  const url = inputLink;
  if (!isUri(url.value)) {
    isNotLink.value = true;
    return;
  }

  // check known uri schemes and url structure
  const urlScheme = url.value.split(':')[0].toLowerCase();
  let isValid = false;
  if (urlScheme === 'http' || urlScheme === 'https') {
    isValid = isUrl(url.value);
  } else if (urlScheme === 'mailto') {
    isValid = isEmail(url.value.replace(/^mailto:/i, ''));
  } else if (urlScheme === 'tel') {
    isValid = isPhone(url.value.replace(/^tel:/i, ''));
  } else {
    isValid = true;
  }
  if (!isValid) {
    isNotLink.value = true;
    return;
  }

  const formatedUrl = formatValue(url.value, 'link');
  // empty
  if (url.value === '' || url.value === undefined || url.value === null) {
    editUrlModal.value.close();
    runToolbarCommand((chain) => chain.extendMarkRange('link').unsetLink());
    restoreToolbarActionFocus('link');
    inputLink.value = '';
    return;
  }

  // update link
  editUrlModal.value.close();
  runToolbarCommand((chain) => chain.extendMarkRange('link').setLink({ href: formatedUrl }));
  restoreToolbarActionFocus('link');
  inputLink.value = '';
}

function checkIfOpen() {
  if (isModalOpen.value) {
    editUrlModal.value.close();
  } else {
    isModalOpen.value = !isModalOpen.value;
    editUrlModal.value.open();
  }
}

function handleEditUrlModalClose() {
  isModalOpen.value = false;
}

function handleEditUrlActionClick(action) {
  switch (action) {
    case 'save':
      setLink();
      break;
    case 'close':
      checkIfOpen();
      break;

    default:
      break;
  }
}

function handleMarkdownImageActionClick(action) {
  switch (action) {
    case 'save':
      setImage();
      break;
    case 'close':
      closeImageModal();
      break;

    default:
      break;
  }
}

function chooseColor(color) {
  switch (color) {
    case 'draft':
    case 'new':
      return 'placeholder-new';
    case 'editing':
    case 'edited':
      return 'placeholder-edit';
    case 'disabling':
    case 'inactive':
      return 'placeholder-delete';
    case 'finishing':
    case 'finished':
      return 'placeholder-finished';
    case 'red':
      return 'placeholder-red';
    case 'green':
      return 'placeholder-green';
    case 'blue':
      return 'placeholder-blue';
    case 'purple':
      return 'placeholder-purple';
    case 'orange':
      return 'placeholder-orange';
    case 'yellow':
      return 'placeholder-yellow';
    default:
      return 'placeholder-label';
  }
}

function postPlaceholder(content) {
  runToolbarCommand((chain) => chain.deleteSelection().setPlaceholderData({ content }));
  placeholderDropDown.value?.closeMenu();
  restoreToolbarActionFocus('placeholder');
}

function setColor(color) {
  runToolbarCommand((chain) => chain.setColor(color.var));
  colorDropDown.value?.closeMenu();
  restoreToolbarActionFocus('color');
}

function onError(id, error) {
  emitNotification(error);
}

const toolbarActions = computed(() => {
  const actionsDefault = [];

  actionsDefault.push(
    {
      id: 'undo',
      name: displayTexts.value.undo,
      icon: 'undo',
      groupId: 'undoRedo',
      area: 'left',
      disabled: !editor.value.can().undo(),
    },
    {
      id: 'redo',
      name: displayTexts.value.redo,
      icon: 'redo',
      groupId: 'undoRedo',
      area: 'left',
      disabled: !editor.value.can().redo(),
    },
    ...formatActionsButtons.value.map((button) => ({
      id: button.name,
      name: displayTexts.value[button.name],
      icon: button.icon,
      groupId: 'format1',
      area: 'left',
      disabled: isSelectionEmpty.value,
      active: editor.value.isActive(button.isActiveCheck || button.name),
    }))
  );

  if (props.showColorPicker) {
    actionsDefault.push({
      id: 'color',
      kind: 'slot',
      groupId: 'format1',
      area: 'left',
    });
  }

  if (props.showHeadingPicker) {
    const headingsGroupId = 'headings';

    const mainButton = {
      id: 'heading',
      name: displayTexts.value.heading,
      icon: 'text-heading',
      groupId: 'format2',
      nestedGroupId: headingsGroupId,
      area: 'left',
      disabled: isSelectionEmpty.value,
      active: isHeadingSelected.value,
    };

    const headings = headingDefinitions.value.map((heading) => ({
      id: heading.id,
      name: heading.name,
      groupId: headingsGroupId,
      active: heading.active,
    }));

    actionsDefault.push(mainButton, ...headings);
  }

  listActionsButtons.value.forEach((button) => {
    actionsDefault.push({
      id: button.name,
      name: displayTexts.value[button.name],
      icon: button.icon,
      groupId: 'format2',
      area: 'left',
      active: editor.value.isActive(button.isActiveCheck),
    });
  });

  if (props.showLinkEditor) {
    actionsDefault.push({
      id: 'link',
      name: displayTexts.value.link,
      icon: 'link',
      groupId: 'insertion',
      area: 'left',
      disabled: isSelectionEmpty.value,
      active: editor.value.isActive('link'),
    });
  }

  if (props.showImagePicker) {
    actionsDefault.push({
      id: 'image',
      name: displayTexts.value.image,
      icon: 'image',
      groupId: 'insertion',
      area: 'left',
      disabled: !isSelectionEmpty.value,
      active: editor.value.isActive('image'),
    });
  }

  if (props.showPlaceholderPicker) {
    actionsDefault.push({
      id: 'placeholder',
      kind: 'slot',
      groupId: 'placeholder',
      area: 'left',
    });
  }

  const actionsExtra = props.actionDefinitions.map((a) => ({ ...a, extra: true }));

  return [...actionsDefault, ...actionsExtra];
});

function toolbarActionClick(id, value) {
  const formatAction = formatActionsButtons.value.find((action) => action.name === id);
  const headingAction = headingDefinitions.value.find((action) => action.id === id);
  const listAction = listActionsButtons.value.find((action) => action.name === id);

  if (id === 'undo') {
    runToolbarCommand((chain) => chain.undo());
  } else if (id === 'redo') {
    runToolbarCommand((chain) => chain.redo());
  } else if (formatAction) {
    runToolbarCommand((chain) => chain[formatAction.command]());
  } else if (headingAction) {
    runToolbarCommand((chain) => chain.unsetLink().toggleHeading({ level: headingAction.level }));
  } else if (listAction) {
    runToolbarCommand((chain) => chain[listAction.command]());
  } else if (id === 'link') {
    checkIfOpen();
  } else if (id === 'image') {
    openImage();
  } else {
    emits('actionClick', id, value);
  }
}

watch(inputImage, (n) => {
  const fn = formatUrl(n);
  imageLink.value = isUrl(fn) ? fn : null;
});

watch(
  () => model.value,
  (newText) => {
    const textInEditor = editor.value?.storage.markdown.getMarkdown();
    if (newText !== textInEditor) {
      editor.value?.commands.setContent(newText, false);
    }
    loading.value = false;
    if (props.maxlength) {
      const remainingCount = props.maxlength - (characterCount.value || 0);
      maxlengthExceeded.value = remainingCount < 0;
    }
  }
);

watch(isDisabled, (disabled) => {
  editor.value.setEditable(!disabled);
});

watch(
  [
    () => props.dictionary,
    () => props.maxlength,
    () => props.placeholder,
    () => props.imageAllowBase64,
    () => props.imageAllowInline,
    () => props.imageResizable,
  ],
  () => {
    updateEditorExtensions();
  }
);

onMounted(async () => {
  await loadTiptap();
  createEditorExtensions();
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});

function getPlainText() {
  return editor.value?.getText() || '';
}

defineExpose({ removeImageLoader, removeAllImageLoaders, repleaceImageLoader, getPlainText });
</script>

<template>
  <div :id="props.id" class="lx-field-wrapper" ref="markdownWrapper">
    <!--eslint-disable-next-line vuejs-accessibility/click-events-have-key-events-->
    <div
      v-if="!readOnly"
      class="lx-markdown-text-area-wrapper"
      :data-disabled="isDisabled ? '' : null"
      :data-invalid="invalid ? '' : null"
      @click="focus($event)"
    >
      <LxToolbar
        v-if="editor"
        :disabled="isDisabled"
        :actionDefinitions="toolbarActions"
        @actionClick="toolbarActionClick"
      >
        <template #color>
          <LxDropDownMenu ref="colorDropDown" :disabled="isSelectionEmpty || isDisabled">
            <LxButton
              :id="`${props.id}-action-color`"
              icon="color"
              kind="ghost"
              variant="icon-only"
              tabindex="-1"
              :label="displayTexts.color"
              :disabled="isSelectionEmpty || isDisabled"
              :active="editor.isActive('textStyle')"
            />
            <template #panel>
              <ul class="lx-color-list">
                <li
                  v-for="color in colorPickerColors"
                  :key="color.name"
                  :class="[
                    'lx-color-item',
                    color.name,
                    { 'lx-selected': editor.isActive('textStyle', { color: color.var }) },
                  ]"
                  tabindex="0"
                  @click="setColor(color)"
                  @keydown.enter.prevent="setColor(color)"
                >
                  <div></div>
                </li>
              </ul>
            </template>
          </LxDropDownMenu>
        </template>
        <template #placeholder>
          <LxDropDownMenu
            ref="placeholderDropDown"
            :disabled="isDisabled || !checkArrayObjectProperty(dictionary, 'value')"
          >
            <LxButton
              :id="`${props.id}-action-placeholder`"
              icon="tag"
              kind="ghost"
              variant="icon-only"
              tabindex="-1"
              :label="displayTexts.templatePicker"
              :disabled="isDisabled || !checkArrayObjectProperty(dictionary, 'value')"
              :active="editor.isActive('backgroundColor')"
            />
            <template #panel>
              <div
                class="lx-markdown-tag-item"
                v-for="item in dictionary"
                :key="item.id"
                :title="item?.description"
                tabindex="0"
                @click="postPlaceholder(item.value)"
                @keydown.enter.prevent="postPlaceholder(item.value)"
              >
                <p class="lx-data">{{ item?.name }}</p>
                <div>
                  <p :class="`${chooseColor(item.displayType)}`" class="lx-data">
                    {{ item?.value }}
                  </p>
                </div>
              </div>
            </template>
          </LxDropDownMenu>
        </template>
      </LxToolbar>
      <LxModal
        ref="editUrlModal"
        :label="displayTexts.modalLabel"
        size="s"
        kind="native"
        :button-secondary-is-cancel="false"
        :action-definitions="modalActionDefinitions"
        @close="handleEditUrlModalClose"
        @action-click="handleEditUrlActionClick"
      >
        <p class="lx-description">{{ displayTexts.modalDescription }}</p>
        <LxTextInput
          ref="inputLinkField"
          v-model="inputLink"
          :invalid="isNotLink"
          :invalidation-message="displayTexts.invalidLinkMessage"
        />
      </LxModal>
      <LxModal
        ref="markdownImageModal"
        id="imageModal"
        :label="displayTexts.imageModalLabel"
        size="s"
        :button-secondary-is-cancel="false"
        :action-definitions="modalActionDefinitions"
        @close="clearModalVariables()"
        @action-click="handleMarkdownImageActionClick"
      >
        <LxContentSwitcher :items="imageInputTypes" v-model="imageModalInputType" />
        <LxForm :show-header="false" :show-footer="false">
          <LxRow
            :label="displayTexts.imageModalLinkDescription"
            v-if="imageModalInputType === 'url'"
          >
            <LxTextInput
              id="inputImageField"
              ref="inputImageField"
              v-model="inputImage"
              :invalid="isNotImage"
              :invalidation-message="displayTexts.invalidImageLink"
            />
          </LxRow>

          <LxRow
            :label="displayTexts.imageModalFileDescription"
            v-if="imageModalInputType === 'fileUploader'"
          >
            <LxFileUploader
              ref="fileUploader"
              v-model="uploadedImage"
              data-type="content"
              :disabled="isDisabled"
              :draggable="true"
              :allowedFileExtensions="allowedFileExtensions"
              :maxFileSize="imageMaxSize"
              @onError="onError"
            />
          </LxRow>

          <LxRow :label="displayTexts.imageModalAltDescription">
            <LxTextInput id="inputAltField" v-model="inputAlt" />
          </LxRow>

          <LxRow :label="displayTexts.imageModalTitleDescription">
            <LxTextInput id="inputTitleField" v-model="inputTitle" />
          </LxRow>
        </LxForm>
      </LxModal>

      <div
        class="lx-input-wrapper"
        :class="[{ 'lx-invalid': invalid }, { 'lx-disabled': disabled }]"
      >
        <div class="pseudo-input" />

        <EditorContent
          v-if="EditorContent && editor"
          class="lx-markdown-text-area lx-input-area"
          :style="{ 'min-height': `${rows * 2.2}rem` }"
          :editor="editor"
          :title="tooltip"
          role="textbox"
          :aria-invalid="invalid"
          :aria-labelledby="labelledBy"
        />

        <div v-if="invalid" class="lx-invalidation-icon-wrapper">
          <LxIcon customClass="lx-invalidation-icon" value="invalid" />
        </div>
      </div>

      <div
        v-if="editor && maxlength"
        class="lx-text-length"
        :class="[{ 'lx-exceeded': maxlengthExceeded }]"
      >
        {{ characterCount }}/{{ maxlength }}
      </div>
      <div class="lx-invalidation-message" v-if="invalid && !readOnly">
        {{ invalidationMessage }}
      </div>
    </div>

    <article id="test-id-loader" v-if="loading" class="lx-article">
      <LxLoader :loading="loading" />
    </article>

    <LxRichTextDisplay v-if="readOnly" :id="props.id" :value="model" />
  </div>
</template>
