# humanizeDate util

A utility function that converts dates into human-readable, language-specific relative date formats (e.g., "Today", "Tomorrow", "Next week", "In 2 months", "5 years ago"). This is particularly useful for displaying dates in a user-friendly manner.

## Calculation methods

- Relative text is shown only within the configured day limit (`limitDays`). If the date is too far away, the utility returns a regular formatted date instead.
- The comparison is based on calendar days, using current date or `dateFrom` as the reference point.
- For nearby dates (less than a week away), the result is day-based:
  - labels like "Today", "Tomorrow", "Yesterday",
  - or weekday-style wording like "Pirmdien", "Svētdien" (only in Latvian).
- Week logic is Monday-based. Dates in the previous or next week can become labels like "Nākamo ceturtdien", "Pagājušo piektdien", "Nākamajā nedēļā" (only in Latvian), and then "In 2 weeks", "3 weeks ago".
- For larger distances, the wording moves from weeks to months, and later to years.
- Month and year borders matter, but switching to month/year wording is based on overall relative distance, not only on crossing a calendar boundary.

## Examples

### Function signature

```js
humanizeDate(date, { ...options, dateFrom })
```

### Parameters

- **`date`** - The date to be humanized (from tables below).
- **`dateFrom`** (in options) - The reference date to calculate the relative date from (one for each table) (note that it should be used only when immutable result is necessary, e.g., in tests or examples, it defaults to current date when omitted).

### Options (used same for all examples below)

```js
{
    form: 'adverb',     // Output format (default: 'adverb')
    limitDays: 100000,  // Maximum number of days to humanize (big number used here to get unlimited days)
    locale: 'lv',       // Locale for Latvian language
}
```

The examples below show how dates are humanized relative to `dateFrom`.

#### If today is 13.04.2026. (Monday, start of week, future dates)

| Day | Date +                    | Result          |
| --- | ------------------------- | --------------- |
| Tue | 14.04.                    | Rīt             |
| Wed | 15.04.                    | Parīt           |
| Thu | 16.04.                    | Ceturtdien      |
| Fri | 17.04.                    | Piektdien       |
| Sat | 18.04.                    | Sestdien        |
| Sun | 19.04.                    | Svētdien        |
|     | 20.04. - 26.04.           | Nākamajā nedēļā |
|     | 27.04. - 03.05.           | Pēc 2 nedēļām   |
|     | 04.05. - 10.05.           | Pēc 3 nedēļām   |
|     | 11.05. - 31.05.           | Nākamajā mēnesī |
|     | 01.06. - 30.06.           | Pēc 2 mēnešiem  |
|     | 01.07. - 31.07.           | Pēc 3 mēnešiem  |
|     | ...                       | ...             |
|     | 01.03.2027. - 31.03.2027. | Pēc 11 mēnešiem |
|     | 01.04.2027. - 31.12.2027. | Nākamajā gadā   |
|     | 01.01.2028. - 31.12.2028. | Pēc 2 gadiem    |
|     | 01.01.2029. - 31.12.2029. | Pēc 3 gadiem    |

#### If today is 13.04.2026. (Monday, start of week, past dates)

| Day | Date -                    | Result              |
| --- | ------------------------- | ------------------- |
| Sun | 12.04.                    | Vakar               |
| Sat | 11.04.                    | Aizvakar            |
| Fri | 10.04.                    | Pagājušo piektdien  |
| Thu | 09.04.                    | Pagājušo ceturtdien |
| Wed | 08.04.                    | Pagājušo trešdien   |
| Tue | 07.04.                    | Pagājušo otrdien    |
| Mon | 06.04.                    | Pagājušajā nedēļā   |
|     | 05.04. - 30.03.           | Pirms 2 nedēļām     |
|     | 29.03. - 23.03.           | Pirms 3 nedēļām     |
|     | 22.03. - 01.03.           | Pagājušajā mēnesī   |
|     | 28.02. - 01.02.           | Pirms 2 mēnešiem    |
|     | 31.01. - 01.01.           | Pirms 3 mēnešiem    |
|     | 31.12.2025. - 01.12.2025. | Pirms 4 mēnešiem    |
|     | ...                       | ...                 |
|     | 31.05.2025. - 01.05.2025. | Pirms 11 mēnešiem   |
|     | 30.04.2025. - 01.01.2025. | Pagājušajā gadā     |
|     | 31.12.2024. - 01.01.2024. | Pirms 2 gadiem      |
|     | 31.12.2023. - 01.01.2023. | Pirms 3 gadiem      |

#### If today is 30.04.2026. (Thursday, end of month, future dates)

| Day | Date +                    | Result          |
| --- | ------------------------- | --------------- |
| Fri | 01.05.                    | Rīt             |
| Sat | 02.05.                    | Parīt           |
| Sun | 03.05.                    | Svētdien        |
| Mon | 04.05.                    | Nākamo pirmdien |
| Tue | 05.05.                    | Nākamo otrdien  |
| Wed | 06.05.                    | Nākamo trešdien |
| Thu | 07.05.                    | Nākamajā nedēļā |
| Fri | 08.05.                    | Nākamajā nedēļā |
| Sat | 09.05.                    | Nākamajā nedēļā |
| Sun | 10.05.                    | Nākamajā nedēļā |
|     | 11.05. - 17.05.           | Pēc 2 nedēļām   |
|     | 18.05. - 24.05.           | Pēc 3 nedēļām   |
|     | 25.05. - 31.05.           | Nākamajā mēnesī |
|     | 01.06. - 30.06.           | Pēc 2 mēnešiem  |
|     | 01.07. - 31.07.           | Pēc 3 mēnešiem  |
|     | ...                       | ...             |
|     | 01.03.2027. - 31.03.2027  | Pēc 11 mēnešiem |
|     | 01.04.2027. - 31.12.2027. | Nākamajā gadā   |
|     | 01.01.2028. - 31.12.2028. | Pēc 2 gadiem    |
|     | 01.01.2029. - 31.12.2029. | Pēc 3 gadiem    |

#### If today is 01.01.2026. (Thursday, start of year, past dates)

| Day | Date -                    | Result             |
| --- | ------------------------- | ------------------ |
| Wed | 31.12.2025.               | Vakar              |
| Tue | 30.12.2025.               | Aizvakar           |
| Mon | 29.12.2025.               | Pirmdien           |
| Sun | 28.12.2025.               | Pagājušo svētdien  |
| Sat | 27.12.2025.               | Pagājušo sestdien  |
| Fri | 26.12.2025.               | Pagājušo piektdien |
| Thu | 25.12.2025.               | Pagājušajā nedēļā  |
| Wed | 24.12.2025.               | Pagājušajā nedēļā  |
| Tue | 23.12.2025.               | Pagājušajā nedēļā  |
| Mon | 22.12.2025.               | Pagājušajā nedēļā  |
|     | 21.12.2025. - 15.12.2025. | Pirms 2 nedēļām    |
|     | 14.12.2025. - 08.12.2025. | Pirms 3 nedēļām    |
|     | 07.12.2025. - 01.12.2025. | Pagājušajā mēnesī  |
|     | 30.11.2025. - 01.11.2025. | Pirms 2 mēnešiem   |
|     | 31.10.2025. - 01.10.2025. | Pirms 3 mēnešiem   |
|     | ...                       | ...                |
|     | 28.02.2025. - 01.02.2025. | Pirms 11 mēnešiem  |
|     | 31.01.2025. - 01.01.2025. | Pagājušajā gadā    |
|     | 31.12.2024. - 01.01.2024. | Pirms 2 gadiem     |
|     | 31.12.2023. - 01.01.2023. | Pirms 3 gadiem     |
