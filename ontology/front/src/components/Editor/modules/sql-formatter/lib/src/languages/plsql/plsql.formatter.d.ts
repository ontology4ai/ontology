import Formatter from '../../formatter/Formatter.js';
import { DialectFormatOptions } from '../../formatter/ExpressionFormatter.js';
import Tokenizer from '../../lexer/Tokenizer.js';
export default class PlSqlFormatter extends Formatter {
    tokenizer(): Tokenizer;
    formatOptions(): DialectFormatOptions;
}
