import { defineAsyncComponent } from 'vue';

/* shell */
export const LxShell = defineAsyncComponent(() => import('@/components/shell/Shell.vue'));

/* forms */
export const LxRow = defineAsyncComponent(() => import('@/components/forms/Row.vue'));
export const LxSection = defineAsyncComponent(() => import('@/components/forms/Section.vue'));
export const LxForm = defineAsyncComponent(() => import('@/components/forms/Form.vue'));

/* components */
export const LxAppendableList = defineAsyncComponent(() =>
  import('@/components/forms/AppendableList.vue')
);
export const LxAutoComplete = defineAsyncComponent(() => import('@/components/AutoComplete.vue'));
export const LxButton = defineAsyncComponent(() => import('@/components/Button.vue'));
export const LxCamera = defineAsyncComponent(() => import('@/components/Camera.vue'));
export const LxCard = defineAsyncComponent(() => import('@/components/Card.vue'));
export const LxCheckbox = defineAsyncComponent(() => import('@/components/Checkbox.vue'));
export const LxContentSwitcher = defineAsyncComponent(() =>
  import('@/components/ContentSwitcher.vue')
);
export const LxDataBlock = defineAsyncComponent(() => import('@/components/DataBlock.vue'));
export const LxDataGrid = defineAsyncComponent(() => import('@/components/DataGrid.vue'));
export const LxDataVisualizer = defineAsyncComponent(() =>
  import('@/components/DataVisualizer.vue')
);
export const LxDateTimePicker = defineAsyncComponent(() =>
  import('@/components/datePicker/DateTimePicker.vue')
);
export const LxDateTimeRange = defineAsyncComponent(() =>
  import('@/components/datePicker/DateTimeRange.vue')
);
export const LxDialog = defineAsyncComponent(() => import('@/components/Dialog.vue'));
export const LxDropDown = defineAsyncComponent(() => import('@/components/Dropdown.vue'));
export const LxDropDownMenu = defineAsyncComponent(() => import('@/components/DropDownMenu.vue'));
export const LxEmptyState = defineAsyncComponent(() => import('@/components/EmptyState.vue'));
export const LxErrorPage = defineAsyncComponent(() => import('@/components/ErrorPage.vue'));
export const LxExpander = defineAsyncComponent(() => import('@/components/Expander.vue'));
export const LxFileUploader = defineAsyncComponent(() =>
  import('@/components/fileUploader/FileUploader.vue')
);
export const LxFileViewer = defineAsyncComponent(() => import('@/components/FileViewer.vue'));
export const LxFilterBuilder = defineAsyncComponent(() => import('@/components/FilterBuilder.vue'));
export const LxFilters = defineAsyncComponent(() => import('@/components/Filters.vue'));
export const LxFlag = defineAsyncComponent(() => import('@/components/Flag.vue'));
export const LxFormBuilder = defineAsyncComponent(() =>
  import('@/components/forms/FormBuilder.vue')
);
export const LxIcon = defineAsyncComponent(() => import('@/components/Icon.vue'));
export const LxIllustration = defineAsyncComponent(() => import('@/components/Illustration.vue'));
export const LxInfoBox = defineAsyncComponent(() => import('@/components/InfoBox.vue'));
export const LxInfoWrapper = defineAsyncComponent(() => import('@/components/InfoWrapper.vue'));
export const LxLink = defineAsyncComponent(() => import('@/components/Link.vue'));
export const LxList = defineAsyncComponent(() => import('@/components/list/List.vue'));
export const LxListItem = defineAsyncComponent(() => import('@/components/list/ListItem.vue'));
export const LxLoader = defineAsyncComponent(() => import('@/components/Loader.vue'));
export const LxLoaderView = defineAsyncComponent(() => import('@/components/LoaderView.vue'));
export const LxMap = defineAsyncComponent(() => import('@/components/Map.vue'));
export const LxMarkdownTextArea = defineAsyncComponent(() =>
  import('@/components/MarkdownTextArea.vue')
);
export const LxMasterDetail = defineAsyncComponent(() => import('@/components/MasterDetail.vue'));
export const LxModal = defineAsyncComponent(() => import('@/components/Modal.vue'));
export const LxModalForm = defineAsyncComponent(() => import('@/components/ModalForm.vue'));
export const LxNotification = defineAsyncComponent(() => import('@/components/Notification.vue'));
export const LxNumberSlider = defineAsyncComponent(() => import('@/components/NumberSlider.vue'));
export const LxPlaceholder = defineAsyncComponent(() =>
  import('@/components/forms/Placeholder.vue')
);
export const LxPersonDisplay = defineAsyncComponent(() => import('@/components/PersonDisplay.vue'));
export const LxQr = defineAsyncComponent(() => import('@/components/Qr.vue'));
export const LxQrScanner = defineAsyncComponent(() => import('@/components/QrScanner.vue'));
export const LxRating = defineAsyncComponent(() => import('@/components/Rating.vue'));
export const LxRadioButton = defineAsyncComponent(() => import('@/components/RadioButton.vue'));
export const LxRichTextDisplay = defineAsyncComponent(() =>
  import('@/components/RichTextDisplay.vue')
);
export const LxSearchableText = defineAsyncComponent(() =>
  import('@/components/SearchableText.vue')
);
export const LxSiteMap = defineAsyncComponent(() => import('@/components/SiteMap.vue'));
export const LxStack = defineAsyncComponent(() => import('@/components/Stack.vue'));
export const LxStateDisplay = defineAsyncComponent(() => import('@/components/StateDisplay.vue'));
export const LxSteps = defineAsyncComponent(() => import('@/components/Steps.vue'));
export const LxTabControl = defineAsyncComponent(() => import('@/components/TabControl.vue'));
export const LxTextArea = defineAsyncComponent(() => import('@/components/TextArea.vue'));
export const LxTextInput = defineAsyncComponent(() => import('@/components/TextInput.vue'));
export const LxTile = defineAsyncComponent(() => import('@/components/Tile.vue'));
export const LxToggle = defineAsyncComponent(() => import('@/components/Toggle.vue'));
export const LxToolbar = defineAsyncComponent(() => import('@/components/Toolbar.vue'));
export const LxToolbarGroup = defineAsyncComponent(() => import('@/components/ToolbarGroup.vue'));
export const LxTooltip = defineAsyncComponent(() => import('@/components/Tooltip.vue'));
export const LxValuePicker = defineAsyncComponent(() => import('@/components/ValuePicker.vue'));
export const LxViewBuilder = defineAsyncComponent(() =>
  import('@/components/forms/ViewBuilder.vue')
);
export const LxViewLayout = defineAsyncComponent(() => import('@/components/ViewLayout.vue'));
export const LxVisualPicker = defineAsyncComponent(() => import('@/components/VisualPicker.vue'));
export const LxWidget = defineAsyncComponent(() => import('@/components/Widget.vue'));
export const LxDayInput = defineAsyncComponent(() => import('@/components/DayInput.vue'));
export const LxDrawPad = defineAsyncComponent(() => import('@/components/DrawPad.vue'));
export const LxLogoDisplay = defineAsyncComponent(() => import('@/components/LogoDisplay.vue'));
export const LxBadge = defineAsyncComponent(() => import('@/components/Badge.vue'));

// Other components you plan to publish go here
