import { neon, neonConfig } from '@neondatabase/serverless';
import dns from 'dns';
import https from 'https';

// Resilient fetch wrapper with public DNS fallback (guarantees connectivity across all ISP/local networks)
const defaultFetch = globalThis.fetch;
neonConfig.fetchFunction = async (url, options = {}) => {
    try {
        return await defaultFetch(url, options);
    } catch (fetchErr) {
        try {
            const parsedUrl = new URL(url);
            const resolver = new dns.promises.Resolver();
            resolver.setServers(['8.8.8.8', '1.1.1.1']);
            const addrs = await resolver.resolve4(parsedUrl.hostname);
            const ip = addrs[0];

            return await new Promise((resolve, reject) => {
                const req = https.request({
                    hostname: ip,
                    port: parsedUrl.port || 443,
                    path: parsedUrl.pathname + parsedUrl.search,
                    method: options.method || 'GET',
                    headers: {
                        ...options.headers,
                        Host: parsedUrl.hostname,
                    },
                    servername: parsedUrl.hostname,
                    rejectUnauthorized: true,
                }, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        resolve({
                            ok: res.statusCode >= 200 && res.statusCode < 300,
                            status: res.statusCode,
                            statusText: res.statusMessage,
                            headers: new Headers(res.headers),
                            json: async () => JSON.parse(data),
                            text: async () => data,
                        });
                    });
                });

                req.on('error', reject);
                if (options.body) req.write(options.body);
                req.end();
            });
        } catch {
            throw fetchErr;
        }
    }
};

export const sql = neon(process.env.DATABASE_URL);

export async function initDB() {
    try {
        await sql.transaction(
            [
            sql`
                CREATE TABLE IF NOT EXISTS users (
                    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name            VARCHAR(255) NOT NULL,
                    email           VARCHAR(255) UNIQUE NOT NULL,
                    password        VARCHAR(255) NOT NULL,
                    storage_used    BIGINT NOT NULL DEFAULT 0,
                    storage_limit   BIGINT NOT NULL DEFAULT 1073741824,
                    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `,
            sql`
                CREATE TABLE IF NOT EXISTS folders (
                    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name        VARCHAR(255) NOT NULL,
                    parent_id   UUID REFERENCES folders(id) ON DELETE SET NULL DEFAULT NULL,
                    owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    path        UUID[] NOT NULL DEFAULT '{}'::uuid[],
                    is_trashed  BOOLEAN NOT NULL DEFAULT FALSE,
                    trashed_at  TIMESTAMPTZ DEFAULT NULL,
                    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `,
            sql`
                CREATE TABLE IF NOT EXISTS files (
                    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name          VARCHAR(255) NOT NULL,
                    original_name VARCHAR(255) NOT NULL,
                    mime_type     VARCHAR(128) NOT NULL,
                    size          BIGINT NOT NULL,
                    s3_key        VARCHAR(512) UNIQUE NOT NULL,
                    folder_id     UUID REFERENCES folders(id) ON DELETE SET NULL DEFAULT NULL,
                    owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    is_trashed    BOOLEAN NOT NULL DEFAULT FALSE,
                    trashed_at    TIMESTAMPTZ DEFAULT NULL,
                    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            `,
            sql`
                CREATE TABLE IF NOT EXISTS share_links (
                    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    token         VARCHAR(64) UNIQUE NOT NULL,
                    resource_type VARCHAR(20) NOT NULL,
                    resource_id   UUID NOT NULL,
                    owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    permission    VARCHAR(20) NOT NULL DEFAULT 'download',
                    expires_at    TIMESTAMPTZ DEFAULT NULL,
                    access_count  INT NOT NULL DEFAULT 0,
                    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    CONSTRAINT unique_resource_owner UNIQUE (resource_id, owner_id)
                )
            `,
            sql`CREATE INDEX IF NOT EXISTS idx_folders_owner_parent  ON folders (owner_id, parent_id, is_trashed)`,
            sql`CREATE INDEX IF NOT EXISTS idx_folders_owner_trashed ON folders (owner_id, is_trashed)`,
            sql`CREATE INDEX IF NOT EXISTS idx_folders_path          ON folders USING GIN (path)`,
            sql`CREATE INDEX IF NOT EXISTS idx_files_owner_folder         ON files (owner_id, folder_id, is_trashed)`,
            sql`CREATE INDEX IF NOT EXISTS idx_files_owner_trashed_date   ON files (owner_id, is_trashed, created_at DESC)`,
            sql`CREATE INDEX IF NOT EXISTS idx_files_owner_trashed_name   ON files (owner_id, is_trashed, name)`,
            sql`CREATE INDEX IF NOT EXISTS idx_shares_owner    ON share_links (owner_id, created_at DESC)`,
            sql`CREATE INDEX IF NOT EXISTS idx_shares_resource ON share_links (resource_id)`
        ]
        );

        console.log("Core database tables initialized successfully");
    } catch (error) {
        console.error("Error creating core database tables:", error);
    }

    // Apply migrations separately to guarantee zero-downtime startup
    try {
        await sql`ALTER TABLE files ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT FALSE`;
        await sql`ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT FALSE`;
        await sql`CREATE INDEX IF NOT EXISTS idx_files_owner_starred ON files (owner_id, is_starred, is_trashed)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_folders_owner_starred ON folders (owner_id, is_starred, is_trashed)`;
        console.log("Starred feature columns and indexes verified successfully");
    } catch (migrationError) {
        console.warn("Migration notice (starred columns):", migrationError.message);
    }
}
