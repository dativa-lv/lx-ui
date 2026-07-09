# createLx Guide

`createLx` is the LX/UI Vue plugin.
Install it once in the application entry file to give LX/UI components access to application-level settings and optional preload configuration.

## Basic Usage

```js
import { createApp } from 'vue';
import { createLx } from '@dativa-lv/lx-ui';
import App from '@/App.vue';

const app = createApp(App);

app.use(createLx, {
  systemId: 'portal',
  authSessionKey: AUTH_KEY_TOKEN_SESSION,
  authUrl: APP_CONFIG.authUrl,
  authClientId: APP_CONFIG.clientId,
  publicUrl: APP_CONFIG.publicUrl,
  environment: APP_CONFIG.environment,
});
```

## Capabilities

`createLx` provides the following capabilities:

- Installs LX/UI through Vue's standard `app.use()` plugin API.
- Stores the provided options as LX/UI global properties.
- Makes the global properties available to LX/UI internals through `useLx().getGlobals()`.
- Preloads frequently used async component chunks through `preload.components`.
- Preloads shell mode chunks through `preload.shellModes`.
- Logs warnings for unknown shell mode preload keys or component references whose async loader cannot be detected.

## Options

`createLx` stores the provided options as-is. The Default column lists either the plugin fallback or the fallback used by LX/UI features when the value is not configured.

| Property                             | Type   | Default                | Available values                                                                                                                                               | Description                        |
| ------------------------------------ | ------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `systemId`                           | String | None                   | Any system id                                                                                                                                                  | Consuming system or portal id.     |
| `authSessionKey`                     | String | None                   | Any storage key                                                                                                                                                | Auth token storage key.            |
| `authUrl`                            | String | None                   | URL string                                                                                                                                                     | Auth service base URL.             |
| `authClientId`                       | String | None                   | Any client id                                                                                                                                                  | OAuth client id.                   |
| `publicUrl`                          | String | None                   | URL or path string                                                                                                                                             | Public app base URL.               |
| `environment`                        | String | None                   | Any environment id, usually `dev`, `test`, or `prod`                                                                                                           | Current app environment.           |
| `preload`                            | Object | `{}`                   | `components`, `shellModes`                                                                                                                                     | Async preload configuration.       |
| `preload.components`                 | Array  | `[]`                   | Imported async LX/UI component references                                                                                                                      | Component chunks to preload.       |
| `preload.shellModes`                 | Array  | `[]`                   | `cover`, `cover-digives-lite`, `public`, `latvijalv`, `digives`, `digives-lite`, `digimaks`, `digimaks-lite`, `full-screen`, `custom`, `default`               | Shell mode chunks to preload.      |
| `dateFormat`                         | String | `dd.MM.yyyy.`          | Date format string                                                                                                                                             | Date display format.               |
| `dateTimeFormat`                     | String | `dd.MM.yyyy. HH:mm`    | Date and time format string                                                                                                                                    | Date and time display format.      |
| `dateTimeFullFormat`                 | String | `dd.MM.yyyy. HH:mm:ss` | Full date and time format string                                                                                                                               | Full date and time display format. |
| `iconSet`                            | String | `cds`                  | `cds`, `material`, `phosphor`                                                                                                                                  | Default icon set.                  |
| `avatarKind`                         | String | `default`              | `default`, `initials`                                                                                                                                          | Default avatar kind.               |
| `currency`                           | String | `EUR`                  | ISO 4217 currency code                                                                                                                                         | Default currency.                  |
| `locale`                             | Object | None                   | `locale`, `firstDayOfTheWeek`, `masks`                                                                                                                         | Locale configuration.              |
| `locale.locale`                      | String | `lv-LV`                | BCP 47 locale tag, for example `lv-LV` or `en-US`                                                                                                              | Formatting locale.                 |
| `locale.firstDayOfTheWeek`           | Number | `2`                    | `1`-`7`                                                                                                                                                        | Calendar week start day.           |
| `locale.masks`                       | Object | See nested defaults    | `input`, `inputDateTime24hr`, `inputDateTimeFull24hr`, `inputTime24hr`, `inputTimeFull24hr`, `inputMonthYear`, `inputQuarters`, `inputYear`, `monthYearFormat` | Date picker masks.                 |
| `locale.masks.input`                 | String | `dd.MM.yyyy.`          | Date mask string                                                                                                                                               | Date input mask.                   |
| `locale.masks.inputDateTime24hr`     | String | `dd.MM.yyyy. HH:mm`    | Date and time mask string                                                                                                                                      | Date and time input mask.          |
| `locale.masks.inputDateTimeFull24hr` | String | `dd.MM.yyyy. HH:mm:ss` | Full date and time mask string                                                                                                                                 | Full date and time input mask.     |
| `locale.masks.inputTime24hr`         | String | `HH:mm`                | Time mask string                                                                                                                                               | Time input mask.                   |
| `locale.masks.inputTimeFull24hr`     | String | `HH:mm:ss`             | Full time mask string                                                                                                                                          | Full time input mask.              |
| `locale.masks.inputMonthYear`        | String | `yyyy-MM`              | Month and year mask string                                                                                                                                     | Month and year input mask.         |
| `locale.masks.inputQuarters`         | String | `yyyy-QQQ`             | Quarter mask string                                                                                                                                            | Quarter input mask.                |
| `locale.masks.inputYear`             | String | `yyyy`                 | Year mask string                                                                                                                                               | Year input mask.                   |
| `locale.masks.monthYearFormat`       | String | `yyyy-MM`              | Month and year format string                                                                                                                                   | Month and year output format.      |

## Global Properties

LX/UI internals read the configured values with `useLx().getGlobals()`.
This is an internal library access path; consumers should configure these values through `createLx` during application startup.

## Date Format Configuration

Date formats can be configured during plugin installation.

```js
app.use(createLx, {
  ...
  dateFormat: 'dd.MM.yyyy.',
  dateTimeFormat: 'dd.MM.yyyy. HH:mm',
  dateTimeFullFormat: 'dd.MM.yyyy. HH:mm:ss',
});
```

## Component Preloading

Pass imported async component references to `preload.components` to load their chunks right after LX/UI is installed.
For more details, see the [Component Preloading Guide](ComponentPreload.md).

## Shell Mode Preloading

Pass shell mode names to `preload.shellModes` to load shell mode chunks in the background.
For more details, see the [Component Preloading Guide](ComponentPreload.md).
