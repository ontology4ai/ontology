import BigQueryFormatter from './languages/bigquery/bigquery.formatter.js';
import Db2Formatter from './languages/db2/db2.formatter.js';
import HiveFormatter from './languages/hive/hive.formatter.js';
import MariaDbFormatter from './languages/mariadb/mariadb.formatter.js';
import MySqlFormatter from './languages/mysql/mysql.formatter.js';
import N1qlFormatter from './languages/n1ql/n1ql.formatter.js';
import PlSqlFormatter from './languages/plsql/plsql.formatter.js';
import PostgreSqlFormatter from './languages/postgresql/postgresql.formatter.js';
import RedshiftFormatter from './languages/redshift/redshift.formatter.js';
import SparkFormatter from './languages/spark/spark.formatter.js';
import SqliteFormatter from './languages/sqlite/sqlite.formatter.js';
import SqlFormatter from './languages/sql/sql.formatter.js';
import TrinoFormatter from './languages/trino/trino.formatter.js';
import TransactSqlFormatter from './languages/transactsql/transactsql.formatter.js';
import SingleStoreDbFormatter from './languages/singlestoredb/singlestoredb.formatter.js';
import SnowflakeFormatter from './languages/snowflake/snowflake.formatter.js';
import { FormatOptions } from './FormatOptions.js';
export declare const formatters: {
    bigquery: typeof BigQueryFormatter;
    db2: typeof Db2Formatter;
    hive: typeof HiveFormatter;
    mariadb: typeof MariaDbFormatter;
    mysql: typeof MySqlFormatter;
    n1ql: typeof N1qlFormatter;
    plsql: typeof PlSqlFormatter;
    postgresql: typeof PostgreSqlFormatter;
    redshift: typeof RedshiftFormatter;
    singlestoredb: typeof SingleStoreDbFormatter;
    snowflake: typeof SnowflakeFormatter;
    spark: typeof SparkFormatter;
    sql: typeof SqlFormatter;
    sqlite: typeof SqliteFormatter;
    transactsql: typeof TransactSqlFormatter;
    trino: typeof TrinoFormatter;
    tsql: typeof TransactSqlFormatter;
};
export declare type SqlLanguage = keyof typeof formatters;
export declare const supportedDialects: string[];
/**
 * Format whitespace in a query to make it easier to read.
 *
 * @param {string} query - input SQL query string
 * @param {FormatOptions} cfg Configuration options (see docs in README)
 * @return {string} formatted query
 */
export declare const format: (query: string, cfg?: Partial<FormatOptions>) => string;
export declare class ConfigError extends Error {
}
export declare type FormatFn = typeof format;
