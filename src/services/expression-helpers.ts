import { Expression, Parser } from "expr-eval";

export function getExpression(expr: string): Expression {
    //replace `=` with `==`, `&` or `&&` with ` and `, `|` or `||` with ` or `
    expr = expr.toLowerCase().replace(/(?<![<>!=])=(?![=])/g, '==').replace(/&&?/g, ' and ').replace(/\|\|?/g, ' or ');
    var parser = new Parser();
    return parser.parse(expr);
}

export function getExpressionErrors(expr: string, tickers: string[]): string | null {
    try {
        var parsedExpr = getExpression(expr)
        var exprVariables = parsedExpr.variables();
        var missingVar = exprVariables.find(exprVar => !tickers.some(ticker => ticker.toLowerCase() == exprVar));
        if (missingVar){
            var startIndex = expr.toLowerCase().indexOf(missingVar);
            var originalCasing = expr.slice(startIndex, startIndex + missingVar.length)
            return `expression contains ${originalCasing}, which is not in the ticker list`
        }
        var obj: {[ticker: string]: number} = {};
        tickers.forEach(z => obj[z.toLowerCase()] = 1);
        getExpression(expr).evaluate(obj);
    } catch (e: any) {
        return "expression cannot be parsed (ensure no missing operators or operands)"
    }
    return null;
}
