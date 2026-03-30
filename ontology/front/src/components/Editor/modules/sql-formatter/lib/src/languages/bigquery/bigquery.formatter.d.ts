import Formatter from '../../formatter/Formatter.js';
import Tokenizer from '../../lexer/Tokenizer.js';
export default class BigQueryFormatter extends Formatter {
    tokenizer(): Tokenizer;
}
