import Formatter from '../../formatter/Formatter.js';
import Tokenizer from '../../lexer/Tokenizer.js';
export default class SqlFormatter extends Formatter {
    tokenizer(): Tokenizer;
}
