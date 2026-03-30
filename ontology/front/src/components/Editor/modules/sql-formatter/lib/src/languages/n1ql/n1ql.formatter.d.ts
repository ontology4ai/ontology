import Formatter from '../../formatter/Formatter.js';
import Tokenizer from '../../lexer/Tokenizer.js';
export default class N1qlFormatter extends Formatter {
    tokenizer(): Tokenizer;
}
