# BPC Console

The BPC Console (aka. Permissions Console) is a special application for managing BPC. It enabled it's users register other applications in BPC, set scopes and administer users.

See [https://github.com/BerlingskeMedia/bpc](https://github.com/BerlingskeMedia/bpc) for more detail on the BPC service.

BPC Console uses plugin [hapi-bpc](https://github.com/BerlingskeMedia/hapi-bpc) to manage BPC tickets and enable user authentication.

BPC Console uses Google Sign from the browser and exchanges the Google Auth response (`id_token` and `access_token`) for a user ticket. The user ticket is stored in _sessionStorage_ and used directly from the client to the CORS enabled endpoints on BPC.


# Prerequisites

## Software

* node
* npm

To install Node modules, run:

```
npm install
```

## App ID and Key with scope 'admin'

Even though this application is used to create and manage BPC app IDs and keys, it ifself needs an app ID and Key with scope `admin` and `admin:*` to be able to operate with the BPC endpoints. This must be bootstrapped by inserting it directly into MongoDB.

See section [MongoDB](https://github.com/BerlingskeMedia/bpc#mongodb) on how to bootstrap your console app ID and Key with the right scope.
The app ID and Key must the set as ENV vars. See section below.


# Start: Build + serve

To build and serve the application, run:

```
npm run dev
```

The following ENV vars need to be set:

* BPC_APP_ID=application_id
* BPC_APP_SECRET=FDGdf8345kjhdfgkDFEk7843y5HF23Fg
* BPC_URL=https://bpc.berlingskemedia-testing.net

# Build

To build the application, run:

```
webpack
```

Note: Building the frontend application is already done in 1) when running `npm run dev`, or 2) when the Docker images is build.

# Work with docker
## prepare env
`
 cp ./env.dev. ./env
`

## define hosts
add to /etc/hosts
`
127.0.0.1 console.local
`
## build + serve
```
docker-compose -f docker-compose.dev.yml up --build
```

check at http://console.local:8086/
