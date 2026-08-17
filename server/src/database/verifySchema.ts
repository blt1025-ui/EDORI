import "../config/environment.js";

import {
    databasePool,
    closeDatabasePool
} from "./database.js";

interface TableRow {
    table_name:string;
}

try {
    const result =
        await databasePool.query<TableRow>(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

    console.table(result.rows);
}
finally {
    await closeDatabasePool();
}