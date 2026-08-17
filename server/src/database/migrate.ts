import "../config/environment.js";

import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
    databasePool,
    closeDatabasePool
} from "./database.js";

interface AppliedMigrationRow {
    filename:string;
}

async function ensureMigrationTable():Promise<void> {
    await databasePool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            filename TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
}

async function getAppliedMigrationFilenames():Promise<Set<string>> {
    const result =
        await databasePool.query<AppliedMigrationRow>(`
            SELECT filename
            FROM schema_migrations
            ORDER BY filename
        `);

    return new Set(
        result.rows.map(row => row.filename)
    );
}

async function runMigrations():Promise<void> {
    const migrationsDirectory =
        resolve(process.cwd(), "database", "migrations");

    console.info(
        `EDORI migrations directory: ${migrationsDirectory}`
    );

    await ensureMigrationTable();

    const filenames =
        (await readdir(migrationsDirectory))
            .filter(filename =>
                filename.toLowerCase().endsWith(".sql")
            )
            .sort();

    const applied =
        await getAppliedMigrationFilenames();

    let appliedCount = 0;

    for(const filename of filenames) {
        if(applied.has(filename)) {
            console.info(
                `Skipping applied migration: ${filename}`
            );
            continue;
        }

        console.info(
            `Applying migration: ${filename}`
        );

        const migrationPath =
            resolve(migrationsDirectory, filename);

        const sql =
            await readFile(migrationPath, "utf8");

        const client =
            await databasePool.connect();

        try {
            await client.query("BEGIN");

            const executableSql =
                sql
                    .replace(/^\s*BEGIN\s*;\s*/i, "")
                    .replace(/\s*COMMIT\s*;\s*$/i, "");

            await client.query(executableSql);

            await client.query(
                `
                    INSERT INTO schema_migrations (
                        filename
                    )
                    VALUES ($1)
                `,
                [filename]
            );

            await client.query("COMMIT");

            appliedCount += 1;

            console.info(
                `Applied migration successfully: ${filename}`
            );
        }
        catch(error) {
            await client.query("ROLLBACK");

            console.error(
                `Migration failed: ${filename}`,
                error
            );

            throw error;
        }
        finally {
            client.release();
        }
    }

    console.info(
        appliedCount === 0
            ? "EDORI database is already up to date."
            : `Applied ${appliedCount} EDORI migration${appliedCount === 1 ? "" : "s"}.`
    );
}

try {
    await runMigrations();
}
catch(error) {
    console.error(
        "EDORI database migration process failed.",
        error
    );

    process.exitCode = 1;
}
finally {
    await closeDatabasePool();
}