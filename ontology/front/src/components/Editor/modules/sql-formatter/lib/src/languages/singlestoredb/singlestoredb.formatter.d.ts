import Formatter from '../../formatter/Formatter.js';
import Tokenizer from '../../lexer/Tokenizer.js';
export default class SingleStoreDbFormatter extends Formatter {
    tokenizer(): Tokenizer;
}
