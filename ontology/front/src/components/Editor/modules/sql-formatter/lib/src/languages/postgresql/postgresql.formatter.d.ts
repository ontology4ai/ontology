import { DialectFormatOptions } from '../../formatter/ExpressionFormatter.js';
import Formatter from '../../formatter/Formatter.js';
import Tokenizer from '../../lexer/Tokenizer.js';
export default class PostgreSqlFormatter extends Formatter {
    tokenizer(): Tokenizer;
    formatOptions(): DialectFormatOptions;
}
