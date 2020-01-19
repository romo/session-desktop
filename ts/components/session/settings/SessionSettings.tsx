import React from 'react';

import { SettingsHeader } from './SessionSettingsHeader';
import { SessionSettingListItem } from './SessionSettingListItem';
import { SessionButtonColor } from '../SessionButton';
import { SessionLinkedDeviceListItem } from './SessionLinkedDeviceListItem';

export enum SessionSettingCategory {
  General = 'general',
  Account = 'account',
  Privacy = 'privacy',
  Permissions = 'permissions',
  Notifications = 'notifications',
  Devices = 'devices',
}

export enum SessionSettingType {
  Toggle = 'toggle',
  Options = 'options',
  Button = 'button',
  Slider = 'slider',
}

export interface SettingsViewProps {
  category: SessionSettingCategory;
}

interface State {
  hasPassword: boolean | null;
  linkedPubKeys: Array<any>;
}

export class SettingsView extends React.Component<SettingsViewProps, State> {
  public settingsViewRef: React.RefObject<HTMLDivElement>;

  public constructor(props: any) {
    super(props);

    this.state = {
      hasPassword: null,
      linkedPubKeys: new Array(),
    };

    this.settingsViewRef = React.createRef();
    this.onPasswordUpdated = this.onPasswordUpdated.bind(this);

    this.hasPassword();
  }

  public componentWillMount() {
    const ourPubKey = window.textsecure.storage.user.getNumber();

    window.libloki.storage.getSecondaryDevicesFor(ourPubKey).then((pubKeys: any) => {
      this.setState({
        linkedPubKeys: pubKeys,
      });
    });
  }

  /* tslint:disable-next-line:max-func-body-length */
  public renderSettingInCategory(): JSX.Element {
    const { category } = this.props;
    if (category === SessionSettingCategory.Devices) {
      // special case for linked devices

      return this.renderLinkedDevicesCategory();
    }

    const { Settings } = window.Signal.Types;

    // Grab initial values from database on startup
    // ID corresponds to instalGetter parameters in preload.js
    // They are NOT arbitrary; add with caution
    const localSettings = [
      {
        id: 'theme-setting',
        title: window.i18n('themeToggleTitle'),
        description: 'Choose the theme best suited to you',
        hidden: true,
        comparisonValue: 'light',
        type: SessionSettingType.Toggle,
        category: SessionSettingCategory.General,
        setFn: window.toggleTheme,
        content: {},
      },
      {
        id: 'hide-menu-bar',
        title: window.i18n('hideMenuBarTitle'),
        description: window.i18n('hideMenuBarDescription'),
        hidden: !Settings.isHideMenuBarSupported(),
        type: SessionSettingType.Toggle,
        category: SessionSettingCategory.General,
        setFn: window.toggleMenuBar,
        content: {},
      },
      {
        id: 'spell-check',
        title: window.i18n('spellCheckTitle'),
        description: window.i18n('spellCheckDescription'),
        hidden: false,
        type: SessionSettingType.Toggle,
        category: SessionSettingCategory.General,
        setFn: window.toggleSpellCheck,
        content: {},
      },
      {
        id: 'link-preview-setting',
        title: window.i18n('linkPreviewsTitle'),
        description: window.i18n('linkPreviewDescription'),
        hidden: false,
        type: SessionSettingType.Toggle,
        category: SessionSettingCategory.General,
        setFn: window.toggleLinkPreview,
        content: {},
      },
      {
        id: 'notification-setting',
        title: window.i18n('notificationSettingsDialog'),
        type: SessionSettingType.Options,
        category: SessionSettingCategory.Notifications,
        setFn: () => {
          this.setOptionsSetting('notification-setting');
        },
        content: {
          options: {
            group: 'notification-setting',
            initalItem: window.getSettingValue('notification-setting') || 'message',
            items: [
              {
                label: window.i18n('nameAndMessage'),
                value: 'message',
              },
              {
                label: window.i18n('nameOnly'),
                value: 'name',
              },
              {
                label: window.i18n('noNameOrMessage'),
                value: 'count',
              },
              {
                label: window.i18n('disableNotifications'),
                value: 'off',
              },
            ],
          },
        },
      },
      {
        id: 'media-permissions',
        title: window.i18n('mediaPermissionsTitle'),
        description: window.i18n('mediaPermissionsDescription'),
        hidden: false,
        type: SessionSettingType.Toggle,
        category: SessionSettingCategory.Permissions,
        setFn: window.toggleMediaPermissions,
        content: {},
      },
      {
        id: 'message-ttl',
        title: window.i18n('messageTTL'),
        description: window.i18n('messageTTLSettingDescription'),
        hidden: false,
        type: SessionSettingType.Slider,
        category: SessionSettingCategory.Privacy,
        setFn: undefined,
        content: {
          defaultValue: 24,
        },
      },
      {
        id: 'set-password',
        title: window.i18n('setAccountPasswordTitle'),
        description: window.i18n('setAccountPasswordDescription'),
        hidden: this.state.hasPassword,
        type: SessionSettingType.Button,
        category: SessionSettingCategory.Privacy,
        setFn: undefined,
        content: {
          buttonText: window.i18n('setPassword'),
          buttonColor: SessionButtonColor.Primary,
        },
        onClick: () =>
          window.showPasswordDialog({
            action: 'set',
            onSuccess: this.onPasswordUpdated,
          }),
      },
      {
        id: 'change-password',
        title: window.i18n('changeAccountPasswordTitle'),
        description: window.i18n('changeAccountPasswordDescription'),
        hidden: !this.state.hasPassword,
        type: SessionSettingType.Button,
        category: SessionSettingCategory.Privacy,
        setFn: undefined,
        content: {
          buttonText: window.i18n('changePassword'),
          buttonColor: SessionButtonColor.Primary,
        },
        onClick: () =>
          window.showPasswordDialog({
            action: 'change',
            onSuccess: this.onPasswordUpdated,
          }),
      },
      {
        id: 'remove-password',
        title: window.i18n('removeAccountPasswordTitle'),
        description: window.i18n('removeAccountPasswordDescription'),
        hidden: !this.state.hasPassword,
        type: SessionSettingType.Button,
        category: SessionSettingCategory.Privacy,
        setFn: undefined,
        content: {
          buttonText: window.i18n('removePassword'),
          buttonColor: SessionButtonColor.Danger,
        },
        onClick: () =>
          window.showPasswordDialog({
            action: 'remove',
            onSuccess: this.onPasswordUpdated,
          }),
      },
    ];

    return (
      <>
        {this.state.hasPassword !== null &&
          localSettings.map(setting => {
            const { category } = this.props;
            const content = setting.content || undefined;
            const shouldRenderSettings = setting.category === category;
            const description = setting.description || '';

            const comparisonValue = setting.comparisonValue || null;
            const value = 
              window.getSettingValue(setting.id, comparisonValue) ||
              setting.content.defaultValue;

            const sliderFn =
              setting.type === SessionSettingType.Slider
                ? (settingValue: any) =>
                    window.setSettingValue(setting.id, settingValue)
                : () => null;

            const onClickFn =
              setting.onClick ||
              (() => {
                this.updateSetting(setting);
              });


            return (
              <div key={setting.id}>
                {shouldRenderSettings &&
                  !setting.hidden && (
                    <SessionSettingListItem
                      title={setting.title}
                      description={description}
                      type={setting.type}
                      value={value}
                      onClick={onClickFn}
                      onSliderChange={sliderFn}
                      content={content}
                    />
                  )}
              </div>
            );
          })}
      </>
    );
  }

  public hasPassword() {
    const hashPromise = window.Signal.Data.getPasswordHash();

    hashPromise.then((hash: any) => {
      this.setState({
        hasPassword: !!hash,
      });
    });
  }

  public render() {
    const { category } = this.props;

    return (
      <div className="session-settings">
        <SettingsHeader category={category} />
        <div ref={this.settingsViewRef} className="session-settings-list">
          {this.renderSettingInCategory()}
        </div>
      </div>
    );
  }

  public updateSetting(item: any) {
    // If there's a custom afterClick function,
    // execute it instead of automatically updating settings
    if (item.setFn) {
      item.setFn();
    } else {
      if (item.type === SessionSettingType.Toggle) {
        // If no custom afterClick function given, alter values in storage here
        // Switch to opposite state
        const newValue = ! window.getSettingValue(item.id);
        window.setSettingValue(item.id, newValue);
      }
    }
  }

  public setOptionsSetting(settingID: string) {
    const selectedValue = $(`#${settingID} .session-radio input:checked`).val();
    window.setSettingValue(settingID, selectedValue);
  }

  public onPasswordUpdated(action: string) {
    if (action === 'set') {
      this.setState({
        hasPassword: true,
      });
    }

    if (action === 'remove') {
      this.setState({
        hasPassword: false,
      });
    }
  }


  private getPubkeyName(pubKey: string | null) {
    if (!pubKey) {
      return {};
    }

    const secretWords = window.mnemonic.pubkey_to_secret_words(pubKey);
    const conv = window.ConversationController.get(pubKey);
    const deviceAlias = conv ? conv.getNickname() : 'Unnamed Device';

    return { deviceAlias, secretWords };
  }

  private renderLinkedDevicesCategory(): JSX.Element {
    const { linkedPubKeys } = this.state;

            /*const li = $('<li>').html(name);
        if (window.lokiFeatureFlags.multiDeviceUnpairing) {
          const link = $('<a>')
            .text('Unpair')
            .attr('href', '#');
          link.on('click', () => this.requestUnpairDevice(x));
          li.append(' - ');
          li.append(link);
        }*/

    if (linkedPubKeys && linkedPubKeys.length > 0) {
      //this.$('#startPairing').attr('disabled', true);
      const items = linkedPubKeys.map((pubkey: any) => {
        const { deviceAlias, secretWords } = this.getPubkeyName(pubkey);
        const description = `${secretWords} ${window.shortenPubkey(pubkey)}`;

        return (
          <SessionLinkedDeviceListItem onClick={() => {}} title={deviceAlias} key={pubkey}  description={description} />
        );
      });

      return (
        <div>
        {items}
        </div>);
    } else {
      //this.$('#startPairing').removeAttr('disabled');
      //this.$('#pairedPubKeys').append('<li>No paired devices</li>');

      return (<li>No paired devices</li>);
    }
  }
}
