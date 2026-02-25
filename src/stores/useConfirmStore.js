export default {
  state: () => ({
    isOpen: false,
    confirmDialogState: {},
  }),
  actions: {
    /**
     * @typedef {'default' | 'question' | 'info' | 'warning' | 'error' | 'success' | 'custom'} DialogKind
     */
    /**
     * Used for pushing dismissible confirmation dialog.
     *
     *
     * @param {string} title
     * @param {string} message
     * @param {string} primaryLabel
     * @param {string} [secondaryLabel]
     * @param {Function} [primaryCallback]
     * @param {Function} [secondaryCallback]
     * @param {boolean} [escEnabled=true] - Defaults to true.
     * @param {boolean|null} [primaryBusy=null] - Primary button busy: `true` = busy, `false` = not busy, `null` = use fallback `confirmPrimaryButtonBusy`. Defaults to null.
     * @param {boolean|null} [secondaryBusy=null] - Secondary button busy: `true` = busy, `false` = not busy, `null` = use fallback `confirmSecondaryButtonBusy`. Defaults to null.
     * @param {Function|null} [closeCallback=null] - Callback invoked when the modal closes (close icon, backdrop, Esc); if null, nothing runs. May be async. Defaults to null.
     * @param {DialogKind|null} [kind=null] - The kind of confirmation dialog. Defaults to null.
     * @param {string|null} [id=null] - The ID of the confirmation dialog. Defaults to null.
     */
    push(
      title,
      message,
      primaryLabel,
      secondaryLabel,
      primaryCallback,
      secondaryCallback,
      escEnabled = true,
      primaryBusy = null,
      secondaryBusy = null,
      closeCallback = null,
      kind = null,
      id = null
    ) {
      this.confirmDialogState = {
        title,
        message,
        primaryLabel,
        secondaryLabel,
        primaryCallback,
        secondaryCallback,
        escEnabled,
        primaryBusy,
        secondaryBusy,
        closeCallback,
        kind,
        id,
      };
      this.isOpen = true;
    },
    /**
     * Creates a dismissible confirmation dialog:
     * @param {string} title
     * @param {string} message
     * @param {Function} primaryCallback - may be async
     * @param {DialogKind|null} [kind=null] - The kind of confirmation dialog. Defaults to null.
     */
    pushSimple(title, message, primaryCallback, kind = null) {
      this.push(
        title,
        message,
        null,
        null,
        primaryCallback,
        () => this.confirm(),
        true,
        null,
        null,
        null,
        kind,
        null
      );
    },
    /**
     * Used for pushing dismissible confirmation dialog.
     * @param {Object} options - Push parameters as an object
     * @param {string} options.title
     * @param {string} options.message
     * @param {string} options.primaryLabel
     * @param {string} [options.secondaryLabel]
     * @param {Function} [options.primaryCallback]
     * @param {Function} [options.secondaryCallback]
     * @param {boolean} [options.escEnabled=true] - Defaults to true.
     * @param {boolean|null} [options.primaryBusy=null] - Primary button busy: `true` = busy, `false` = not busy, `null` = use fallback `confirmPrimaryButtonBusy`. Defaults to null.
     * @param {boolean|null} [options.secondaryBusy=null] - Secondary button busy: `true` = busy, `false` = not busy, `null` = use fallback `confirmSecondaryButtonBusy`. Defaults to null.
     * @param {Function|null} [options.closeCallback=null] - Callback invoked when the modal closes (close icon, backdrop, Esc); if null, nothing runs. May be async. Defaults to null.
     * @param {DialogKind|null} [options.kind=null] - The kind of confirmation dialog. Defaults to null.
     * @param {string|null} [options.id=null] - The ID of the confirmation dialog. Defaults to null.
     */
    pushObject(options) {
      this.push(
        options?.title,
        options?.message,
        options?.primaryLabel,
        options?.secondaryLabel,
        options?.primaryCallback,
        options?.secondaryCallback,
        options?.escEnabled,
        options?.primaryBusy,
        options?.secondaryBusy,
        options?.closeCallback,
        options?.kind,
        options?.id
      );
    },
    /**
     * forcePush - For backward compatibility / edge-cases only.
     * Creates a non-dismissible confirmation dialog:
     * - disableClosing = true (no close icon)
     * @deprecated Consider using standard `push()` method for new implementations unless non-dismissible behavior is specifically required.
     * @param {string} title
     * @param {string} message
     * @param {string} primaryLabel
     * @param {string} [secondaryLabel]
     * @param {Function} [primaryCallback]
     * @param {Function} [secondaryCallback]
     * @param {boolean} [escEnabled=true] - Defaults to true.
     * @param {boolean|null} [primaryBusy=null] - Primary button busy: `true` = busy, `false` = not busy, `null` = use fallback `confirmPrimaryButtonBusy`. Defaults to null.
     * @param {boolean|null} [secondaryBusy=null] - Secondary button busy: `true` = busy, `false` = not busy, `null` = use fallback `confirmSecondaryButtonBusy`. Defaults to null.
     * @param {Function|null} [closeCallback=null] - Callback invoked when the modal closes (close icon, backdrop, Esc); if null, nothing runs. May be async. Defaults to null.
     * @param {DialogKind|null} [kind=null] - The kind of confirmation dialog. Defaults to null.
     * @param {string|null} [id=null] - The ID of the confirmation dialog. Defaults to null.
     */
    forcePush(
      title,
      message,
      primaryLabel,
      secondaryLabel,
      primaryCallback,
      secondaryCallback,
      escEnabled = true,
      primaryBusy = null,
      secondaryBusy = null,
      closeCallback = null,
      kind = null,
      id = null
    ) {
      this.confirmDialogState = {
        title,
        message,
        primaryLabel,
        secondaryLabel,
        primaryCallback,
        secondaryCallback,
        escEnabled,
        primaryBusy,
        secondaryBusy,
        closeCallback,
        disableClosing: true,
        kind,
        id,
      };
      this.isOpen = true;
    },
    /**
     * pushSimpleForce - For backward compatibility / edge-cases only.
     * Creates a non-dismissible confirmation dialog:
     * - disableClosing = true (no close icon)
     *
     * @deprecated Consider using standard `push()` method for new implementations unless non-dismissible behavior is specifically required.
     *
     * @param {string} title
     * @param {string} message
     * @param {Function} primaryCallback - may be async
     * @param {DialogKind|null} [kind=null] - The kind of confirmation dialog. Defaults to null.
     */
    pushSimpleForce(title, message, primaryCallback, kind = null) {
      this.forcePush(
        title,
        message,
        null,
        null,
        primaryCallback,
        () => this.confirm(),
        true,
        null,
        null,
        null,
        kind,
        null
      );
    },
    async confirm(callback) {
      if (callback) {
        await callback();
      }
      this.isOpen = false;
    },
  },
};
