import { lxDefineAsyncComponent } from '@/utils/dynamicImportUtils';

/* shell */
export const LxShell = lxDefineAsyncComponent(() => import('@/components/shell/Shell.vue'));
export const LxShellHeaderButtons = lxDefineAsyncComponent(
  () => import('@/components/shell/ShellHeaderButtons.vue')
);

/* forms */
export const LxRow = lxDefineAsyncComponent(() => import('@/components/forms/Row.vue'));
export const LxSection = lxDefineAsyncComponent(() => import('@/components/forms/Section.vue'));
export const LxForm = lxDefineAsyncComponent(() => import('@/components/forms/Form.vue'));

/* components */
export const LxAppendableList = lxDefineAsyncComponent(
  () => import('@/components/forms/AppendableList.vue')
);
export const LxAppendableListSimple = lxDefineAsyncComponent(
  () => import('@/components/forms/AppendableListSimple.vue')
);
export const LxAutoComplete = lxDefineAsyncComponent(() => import('@/components/AutoComplete.vue'));
export const LxAvatar = lxDefineAsyncComponent(() => import('@/components/Avatar.vue'));
export const LxButton = lxDefineAsyncComponent(() => import('@/components/Button.vue'));
export const LxCamera = lxDefineAsyncComponent(() => import('@/components/Camera.vue'));
export const LxCard = lxDefineAsyncComponent(() => import('@/components/Card.vue'));
export const LxChat = lxDefineAsyncComponent(() => import('@/components/chat/Chat.vue'));
export const LxCheckbox = lxDefineAsyncComponent(() => import('@/components/Checkbox.vue'));
export const LxConfirmButton = lxDefineAsyncComponent(
  () => import('@/components/ConfirmButton.vue')
);
export const LxContentSwitcher = lxDefineAsyncComponent(
  () => import('@/components/ContentSwitcher.vue')
);
export const LxDataBlock = lxDefineAsyncComponent(() => import('@/components/DataBlock.vue'));
export const LxDataGrid = lxDefineAsyncComponent(() => import('@/components/DataGrid.vue'));
export const LxDataVisualizer = lxDefineAsyncComponent(
  () => import('@/components/DataVisualizer.vue')
);
export const LxDateTimePicker = lxDefineAsyncComponent(
  () => import('@/components/datePicker/DateTimePicker.vue')
);
export const LxDateTimeRange = lxDefineAsyncComponent(
  () => import('@/components/datePicker/DateTimeRange.vue')
);
export const LxDialog = lxDefineAsyncComponent(() => import('@/components/Dialog.vue'));
export const LxDropDownMenu = lxDefineAsyncComponent(() => import('@/components/DropDownMenu.vue'));
export const LxEmptyState = lxDefineAsyncComponent(() => import('@/components/EmptyState.vue'));
export const LxEmptyValue = lxDefineAsyncComponent(() => import('@/components/EmptyValue.vue'));
export const LxErrorPage = lxDefineAsyncComponent(() => import('@/components/ErrorPage.vue'));
export const LxExpander = lxDefineAsyncComponent(() => import('@/components/Expander.vue'));
export const LxFileUploader = lxDefineAsyncComponent(
  () => import('@/components/fileUploader/FileUploader.vue')
);
export const LxFileViewer = lxDefineAsyncComponent(() => import('@/components/FileViewer.vue'));
export const LxFilters = lxDefineAsyncComponent(() => import('@/components/Filters.vue'));
export const LxFlag = lxDefineAsyncComponent(() => import('@/components/Flag.vue'));
export const LxIcon = lxDefineAsyncComponent(() => import('@/components/Icon.vue'));
export const LxIllustration = lxDefineAsyncComponent(() => import('@/components/Illustration.vue'));
export const LxInfoBox = lxDefineAsyncComponent(() => import('@/components/InfoBox.vue'));
export const LxInfoWrapper = lxDefineAsyncComponent(() => import('@/components/InfoWrapper.vue'));
export const LxLink = lxDefineAsyncComponent(() => import('@/components/Link.vue'));
export const LxList = lxDefineAsyncComponent(() => import('@/components/list/List.vue'));
export const LxListItem = lxDefineAsyncComponent(() => import('@/components/list/ListItem.vue'));
export const LxLoader = lxDefineAsyncComponent(() => import('@/components/Loader.vue'));
export const LxLoaderView = lxDefineAsyncComponent(() => import('@/components/LoaderView.vue'));
export const LxMap = lxDefineAsyncComponent(() => import('@/components/Map.vue'));
export const LxMarkdownTextArea = lxDefineAsyncComponent(
  () => import('@/components/MarkdownTextArea.vue')
);
export const LxMasterDetail = lxDefineAsyncComponent(() => import('@/components/MasterDetail.vue'));
export const LxModal = lxDefineAsyncComponent(() => import('@/components/Modal.vue'));
export const LxModalForm = lxDefineAsyncComponent(() => import('@/components/ModalForm.vue'));
export const LxNotification = lxDefineAsyncComponent(() => import('@/components/Notification.vue'));
export const LxNumberInput = lxDefineAsyncComponent(() => import('@/components/NumberInput.vue'));
export const LxPlaceholder = lxDefineAsyncComponent(
  () => import('@/components/forms/Placeholder.vue')
);
export const LxPersonDisplay = lxDefineAsyncComponent(
  () => import('@/components/PersonDisplay.vue')
);
export const LxQr = lxDefineAsyncComponent(() => import('@/components/Qr.vue'));
export const LxQrScanner = lxDefineAsyncComponent(() => import('@/components/QrScanner.vue'));
export const LxRating = lxDefineAsyncComponent(() => import('@/components/Rating.vue'));
export const LxRadioButton = lxDefineAsyncComponent(() => import('@/components/RadioButton.vue'));
export const LxRichTextDisplay = lxDefineAsyncComponent(
  () => import('@/components/RichTextDisplay.vue')
);
export const LxSearchableText = lxDefineAsyncComponent(
  () => import('@/components/SearchableText.vue')
);
export const LxSiteMap = lxDefineAsyncComponent(() => import('@/components/SiteMap.vue'));
export const LxStack = lxDefineAsyncComponent(() => import('@/components/Stack.vue'));
export const LxStateDisplay = lxDefineAsyncComponent(() => import('@/components/StateDisplay.vue'));
export const LxSteps = lxDefineAsyncComponent(() => import('@/components/Steps.vue'));
export const LxTabControl = lxDefineAsyncComponent(() => import('@/components/TabControl.vue'));
export const LxTextArea = lxDefineAsyncComponent(() => import('@/components/TextArea.vue'));
export const LxTextInput = lxDefineAsyncComponent(() => import('@/components/TextInput.vue'));
export const LxTile = lxDefineAsyncComponent(() => import('@/components/Tile.vue'));
export const LxToggle = lxDefineAsyncComponent(() => import('@/components/Toggle.vue'));
export const LxToolbar = lxDefineAsyncComponent(() => import('@/components/Toolbar.vue'));
export const LxToolbarGroup = lxDefineAsyncComponent(() => import('@/components/ToolbarGroup.vue'));
export const LxTooltip = lxDefineAsyncComponent(() => import('@/components/Tooltip.vue'));
export const LxValuePicker = lxDefineAsyncComponent(() => import('@/components/ValuePicker.vue'));
export const LxViewLayout = lxDefineAsyncComponent(() => import('@/components/ViewLayout.vue'));
export const LxVisualPicker = lxDefineAsyncComponent(() => import('@/components/VisualPicker.vue'));
export const LxWidget = lxDefineAsyncComponent(() => import('@/components/Widget.vue'));
export const LxDurationInput = lxDefineAsyncComponent(
  () => import('@/components/DurationInput.vue')
);
export const LxDrawPad = lxDefineAsyncComponent(() => import('@/components/DrawPad.vue'));
export const LxLogoDisplay = lxDefineAsyncComponent(() => import('@/components/LogoDisplay.vue'));
export const LxBadge = lxDefineAsyncComponent(() => import('@/components/Badge.vue'));
export const LxAccessibilitySettings = lxDefineAsyncComponent(
  () => import('@/components/AccessibilitySettings.vue')
);
export const LxSearchView = lxDefineAsyncComponent(() => import('@/components/SearchView.vue'));

// Other components you plan to publish go here
