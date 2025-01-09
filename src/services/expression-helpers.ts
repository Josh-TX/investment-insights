import { Expression, Parser } from "expr-eval";

export function getExpression(expr: string): Expression {
    //replace `=` with `==`, `&` or `&&` with ` and `, `|` or `||` with ` or `
    expr = expr.toLowerCase().replace(/(?<![<>!=])=(?![=])/g, '==').replace(/&&?/g, ' and ').replace(/\|\|?/g, ' or ');
    var parser = new Parser();
    return parser.parse(expr);
}

export function getExpressionErrors(expr: string, variables: string[]): string | null {
    try {
        var fixedExpr = expr.replace(/(?<![<>!=])=(?![=])/g, '==').replace(/&&?/g, ' and ').replace(/\|\|?/g, ' or ');
        var parsedExpr = new Parser().parse(fixedExpr);
        var exprVariables = parsedExpr.variables();
        var missingVar = exprVariables.find(z => !variables.some(zz => zz.toLowerCase() == z.toLowerCase()));
        if (missingVar){
            return `expression contains ${missingVar}, which is not in the ticker list`
        }
        var obj: {[ticker: string]: number} = {};
        variables.forEach(z => obj[z.toLowerCase()] = 1);
        getExpression(expr).evaluate(obj);
    } catch (e: any) {
        return "expression cannot be parsed (ensure no missing operators or operands)"
    }
    return null;
}
