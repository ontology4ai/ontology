import { FormatOptions } from '../FormatOptions.js';
import Tokenizer from '../lexer/Tokenizer.js';
import { DialectFormatOptions } from './ExpressionFormatter.js';
/** Main formatter class that produces a final output string from list of tokens */
export default class Formatter {
    private cfg;
    private params;
    constructor(cfg: FormatOptions);
    /**
     * SQL Tokenizer for this formatter, provided by subclasses.
     */
    protected tokenizer(): Tokenizer;
    private cachedTokenizer;
    /**
     * Dialect-specific formatting configuration, optionally provided by subclass.
     */
    protected formatOptions(): DialectFormatOptions;
    /**
     * Formats an SQL query.
     * @param {string} query - The SQL query string to be formatted
     * @return {string} The formatter query
     */
    format(query: string): string;
    private parse;
    private formatAst;
    private formatStatement;
    private postFormat;
}
