> [!CAUTION]
> *At the moment this API is only intended for test purposes. Results of calculated tasks will only provide random data!*
> *This API will be available for productive use as soon as the <a href="https://www.beskid-projekt.de/en/projekt/modellierung">modeling project phase</a> has been successfully completed.*

<img src="https://www.beskid-projekt.de/@@project-logo/Logo_text_500px.png" width="35%" alt="BESKID Logo"/><br>

**BE**messungsbrandsimulationen in **S**chienenfahrzeugen mittels **KI**-basierter **D**aten

Design fire simulation in railway vehicles using AI-based data

# BESKID-API
The goal of the [BESKID](https://www.beskid-projekt.de/en) project, funded by the Federal Ministry of Education and Research (BMBF), is to develop and experimentally validate AI-based methods for calculating design fires. The project started in 2022.

Previous approaches to detailed modeling of fire spread in rail vehicles have required a large number of experiments, extensive optimization, and extensive variant calculations. In this project, two complementary AI approaches, KIM (Material AI System) and KIB (Fire AI System), are being researched and implemented. KIM aims to completely reduce the optimization calculations required for determining material parameters, allowing for the determination of necessary material parameters solely from data obtained from a few tests, such as the Cone Calorimeter. This test is already used for the fire protection assessment of all relevant components of rail vehicles, as required by the European standard (EN 45545-2), so the proposed AI approach (KIM) will eliminate the need for additional effort in design fire simulations in the future. KIB aims to significantly shorten the high computational cost for variation calculations of the entire vehicle and focuses on fast calculation of fire spread variations. The goal is to replace the cost-intensive traditional models used for variant calculations of design fires with the KIB AI system.

This API is intended to make the AI system accessible to the public.

## Dependencies
- Node.js
- Python 3

## Installation

```bash
$ npm install
```

## Configuration
There are four environment variables.
1. `tokenSecret` (default: *random string value on each run*): Contains a secret character string that is required for the generation of session tokens.
2. `tokenExpirationTime` (default: *7d*): Defines the time after which sessions become invalid.
3. `scriptFile` (default: *test.py*): Name of the Python file that accesses the AI system.
4. `scriptDir` (*Only required for productive environments (`npm run start:prod`) or for docker.*)
The environment variables can be stored in an .env-file. Just copy ".env.template" and name it ".env".

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod

# docker
$ docker-compose up
```

Open your browser and visit https://localhost:3000

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
