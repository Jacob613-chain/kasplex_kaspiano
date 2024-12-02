# Get Address and Balance of Specific Token Holders

## Description

This guide explains how to retrieve and manage addresses and balances for token holders of a specific token tick using the Kasplex API.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start
```

## Steps

1. Calculate the Start Oprange

- Fetch opScoreAdd for the desired tick using:

https://api.kasplex.org/v1/krc20/token/{tick}

- Calculate the start oprange:

const startOprange = Math.floor(parseInt(opScoreAdd) / 100000);

2. Calculate the Last Oprange

- Fetch the current daascore using:

https://api.kasplex.org/v1/info

- Calculate the last oprange:

const lastOprange = Math.floor(parseInt(daascore) / 10);

Note: The daascore changes frequently, so update it every 30 seconds for accurate results.

3. Retrieve Addresses and Balances

- Loop through opranges from startOprange to lastOprange and fetch data:

https://api.kasplex.org/v1/archive/oplist/{oprange}

- Filter results to include only addresses and balances with the desired tick:
    Remove entries with a balance of 0.
    If an address appears multiple times, update its balance.

## Notes

- Ensure the oprange loop is optimized to avoid excessive API calls.
- Use the latest daascore for accurate results.
- Handle API errors gracefully for robust execution.