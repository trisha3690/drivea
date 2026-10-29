# Drivea

Drivea is a cloud storage web application for uploading and organizing files, managing folders, sharing items with public links, and restoring or permanently deleting trashed content.

## Features

- Register and sign in with email and password
- Browse files and folders in a drive
- Create, rename, and move folders
- Upload multiple files, with a default maximum size of 100 MiB per file
- Preview or download files
- Search and sort files
- Generate and revoke public share links for files and folders
- Move files and folders to trash, restore them, or permanently delete them
- Track account storage usage and quota

## Technology

- **Client:** React, Vite, React Router, Tailwind CSS, Axios
- **Server:** Node.js, Express
- **Database:** Neon serverless Postgres
- **Object storage:** S3-compatible storage, accessed with the AWS SDK
- **Authentication:** Password hashing with bcrypt and JWTs stored in HTTP-only cookies

## Project structure

```text
client/
  src/
    components/   Reusable UI, file, folder, and layout components
    context/      Application state and API actions
    hooks/        Drive-related hooks
    pages/        Login, drive, trash, and sharing pages
    config/       Client API configuration
  public/         Static assets
server/
  config/         Database and object-storage configuration
  controllers/    API request handlers
  middleware/     Authentication and file-upload middleware
  routes/         API route definitions
  services/       Storage and database-related services
  utils/          Object-storage helpers
```

## Requirements

- Node.js and npm
- A Neon Postgres database
- An S3-compatible object-storage service and bucket

## Configuration

Create a `.env` file in `server/` with the following variables. Use your own values; do not commit credentials to source control.

```env
PORT=3000
ORIGINS=http://localhost:5173
DATABASE_URL=your_neon_postgres_connection_string
JWT_SECRET=your_long_random_secret

AWS_REGION=your_storage_region
AWS_ENDPOINT_URL_S3=your_s3_compatible_endpoint
AWS_ACCESS_KEY_ID=your_storage_access_key
AWS_SECRET_ACCESS_KEY=your_storage_secret_key
AWS_S3_BUCKET=your_bucket_name

# Optional
MAX_FILE_SIZE=104857600
MAX_STORAGE_PER_USER=1073741824
```

`MAX_FILE_SIZE` and `MAX_STORAGE_PER_USER` are byte counts. Their defaults are 100 MiB per file and 1 GiB per user. `ORIGINS` is a comma-separated list of allowed client origins.

Optionally, create `client/.env` to set the API server URL:

```env
VITE_BASE_URL=http://localhost:3000
```

The client uses `http://localhost:3000` when `VITE_BASE_URL` is not set.

## Install and run

Install dependencies in each app directory:

```powershell
cd server
npm install
cd ..\client
npm install
```

Start the API server in one terminal:

```powershell
cd server
npm run dev
```

Start the client in another terminal:

```powershell
cd client
npm run dev
```

Open the local URL printed by Vite (by default, `http://localhost:5173`). The server initializes the database tables when it starts and listens on port `3000` by default.

## Available scripts

### Client (`client/`)

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production client build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint |

### Server (`server/`)

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API server with Nodemon |
| `npm start` | Start the API server with Node.js |
| `npm run server` | Start the API server with Nodemon |

## API overview

All API routes are served from the server origin. Except for public share access, endpoints require authentication.

| Route | Purpose |
| --- | --- |
| `/api/auth` | Register, sign in/out, and retrieve the current user |
| `/api/files` | Upload, list, preview, move, rename, restore, and delete files |
| `/api/folders` | Create, list, inspect, move, rename, restore, and delete folders |
| `/api/shares` | Create, list, revoke, or publicly access share links |
| `/api/trash` | List trashed items and empty the trash |

The API health check is `GET /`. Public share-link data is retrieved through `GET /api/shares/access/:token`.
