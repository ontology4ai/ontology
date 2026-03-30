import { indentString } from './config.js';
import Params from './Params.js';
import { createParser } from '../parser/createParser.js';
import formatCommaPositions from './formatCommaPositions.js';
import formatAliasPositions from './formatAliasPositions.js';
import ExpressionFormatter from './ExpressionFormatter.js';
import Layout, { WS } from './Layout.js';
import Indentation from './Indentation.js';
/** Main formatter class that produces a final output string from list of tokens */

export default class Formatter {
  constructor(cfg) {
    this.cfg = cfg;
    this.params = new Params(this.cfg.params);
  }
  /**
   * SQL Tokenizer for this formatter, provided by subclasses.
   */


  tokenizer() {
    throw new Error('tokenizer() not implemented by subclass');
  } // Cache the tokenizer for each class (each SQL dialect)
  // So we wouldn't need to recreate the tokenizer, which is kinda expensive,
  // for each call to format() function.


  cachedTokenizer() {
    const cls = this.constructor;

    if (!cls.cachedTokenizer) {
      cls.cachedTokenizer = this.tokenizer();
    }

    return cls.cachedTokenizer;
  }
  /**
   * Dialect-specific formatting configuration, optionally provided by subclass.
   */


  formatOptions() {
    return {};
  }
  /**
   * Formats an SQL query.
   * @param {string} query - The SQL query string to be formatted
   * @return {string} The formatter query
   */


  format(query) {
    const ast = this.parse(query);
    const formattedQuery = this.formatAst(ast);
    const finalQuery = this.postFormat(formattedQuery);
    return finalQuery.trimEnd();
  }

  parse(query) {
    return createParser(this.cachedTokenizer()).parse(query, this.cfg.paramTypes || {});
  }

  formatAst(statements) {
    return statements.map(stat => this.formatStatement(stat)).join('\n'.repeat(this.cfg.linesBetweenQueries + 1));
  }

  formatStatement(statement) {
    const layout = new ExpressionFormatter({
      cfg: this.cfg,
      dialectCfg: this.formatOptions(),
      params: this.params,
      layout: new Layout(new Indentation(indentString(this.cfg)))
    }).format(statement.children);

    if (!statement.hasSemicolon) {// do nothing
    } else if (this.cfg.newlineBeforeSemicolon) {
      layout.add(WS.NEWLINE, ';');
    } else {
      layout.add(WS.NO_NEWLINE, ';');
    }

    return layout.toString();
  }

  postFormat(query) {
    if (this.cfg.tabulateAlias) {
      query = formatAliasPositions(query);
    }

    if (this.cfg.commaPosition === 'before' || this.cfg.commaPosition === 'tabular') {
      query = formatCommaPositions(query, this.cfg.commaPosition, indentString(this.cfg));
    }

    return query;
  }

}
//# sourceMappingURL=Formatter.js.map