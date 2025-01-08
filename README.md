# Investment Insights

a static site for viewing and analyzing stock market data. Catered towards long-term investors, with tools to assist in building a diversified portfolio. All data comes from the yahoo finance API (with help from corsproxy.net) and uses the adjusted close so that dividends are factored into the price. 

This website is not financial advice. Use at your own risk.

site available at https://josh-tx.github.io/investment-insights

## Line Chart Page

The line chart page allows you to view different line types overlayed on top of each other. For performance reasons, there are options to only render every other day or every 7th day, but the calculations and smoothing still operate all all days. 

* Price - shows the adjusted close of each ticker. On days where the markets are closed (weekends, holidays), the price is linearly interpolated from the adjacent prices. Yahoo Finance provides the adjusted closes. They keep the most recent price accurate, but they lower historic prices to account for dividends payed out by that ticker.
* Returns - shows the N day return. This view isn't that useful because positive and negative percentages aren't equally important (i.e. a -50% change must be offset by +100% change). If smoothing is used, the data is first log scaled, smoothed, and then exponent-scaled. The extrapolate days option controls how to convert a price change to a return. For example, if "return days" is 90, and it doubles in price over 90 days, is that a 100% return (no extrapolation), or a 700% return (extrapolated as if the growth was maintained for 360 days)
* Log Returns - The same as Returns, but each value is converted from a percent to a factor and then log-scaled using a base-2 log. For example, if a return was +41.5%, converting it to a factor would be 1.415, and then log₂(1.415) = 0.5. If a return was -50%, log₂(0.5) = -1. I chose a log base of 2 because the output is easier to understand. An output of 0 means no change, an output of 1 means it doubled, an output of 2 means it quadruples, and an output of -1 means it halved.
* Max Drawdown - This is basically the same as the Price line type, but only showing the maximum drawdown period. One cool thing you can do is set the dotted line to "price", and the solid line to "max drawdown", and you can see the drawdown alongside the rest of the price history. There's also a setting "peak & trough days maintained": Instead of looking the highest price on any single day, it looks for the highest price maintined for N consecutive days. The same logic is also applied for the lowpoint/valley/trough.
* Log Losses - This is just log returns, but positive values are set to 0. This isn't a useful line type, and it only exists to visually describe what data is used for calculations on other pages: Log Loss Root-Mean-Squared and Cosine Simularity both use this data.

## Scatterplot Page

This scatterplot page allows you to analyze tens of thousands of possible portfolios. Using the tickers and the segment count, it finds every possible combination of funds (portfolios). For each portfolio, it calculates the portfolios price history, computes the X and Y metric, and places a point on the scatterplot. You can pick what type of metric to show on each axis. Usually you want to show the return on one axis, and some metric of risk on the other axis (Log Return Standard Deviation, Log Loss Root-Mean-Squared, or Max Drawdown). Most of these metrics are explained in the line chart section, but I'll explain log loss RMS here. As mentioned earlier, log losses is just log returns, but positive values are set to 0. RMS is very similar to standard deviation, but instead of taking the deviation from the mean, it takes the deviation from 0 (AKA the value). It turns out that log loss RMS has a very strong correlation with log return std dev, but I thought it was an interesting calculation to have anyways. 

Once you've generated the portfolios, there's a couple things you should know. First of all, the chart is zoomed in the best fit the points. Pay attention to the axis tick labels to see how much the points actually differ. Depending on the axis settings, there should be a corner of a plot that represents portfolios with low risk and high return, which I'll call the "ideal corner". Oftentimes there's no definitive "best point" that's closest to the ideal corner, but rather there are many points that offer various risk-return tradeoffs. Many points will be objectively inferior (in a statistical sense), due to there being either a fund with better return with equal risk, or an equal return with reduced risk. 

Mathematically, the number of combinations grows very quickly as you increase the number of tickers or increase the number of segments. This is where filters can come into play. You can write a boolean expression inside the filter. `<`, `<=`, `=`, `==`, `>`, `>=` are all valid comparison operators. `and`, `&`, `&&` are all valid forms of "and", and `or`, `|`, `||` are all valid forms of "or". You can use parenthesis to enforce precedence. You can also use the format `ticker in [0,1,2,3]` which can be much shorter than tons of OR clauses. Here's some example expressions: `AMZN < 5`, `VUSTX + VBTLX = 2`, `VGT IN [2,3] & VPU in [1,2]`. That last example is the kind of expression I use a whole late. Once I decide roughly how much I like a ticker, I'll use a filter with a bunch of "in" and "and" clauses, narrowing down my portfolio. This allows me to try over a dozen tickers, since I've sufficiently restricted the possibilities. The same type of expression can also be used to highlight portfolios too. 

One unfortunate problem is that not all tickers have the same amount of historic data. One ticker might have been around since the 1990s, and another might be from the 2010s. The entire scatterplot will only use historic data from the newest ticker. This is the case even if the point consists only of holdings from old tickers. One way to allieviate this issue is to find a different ticker that's basically identical to the ticker you like. For example, the long-term Treasury ETF `VGLT` was created in 2010, but `VUSTX` has been around since 1986. I still prefer VGLT because of the lower expense ratio, but I use VUSTX for my analysis.

You can click on a point to selected it, and add it as a portfolio ticker. More on that later

## Stats Page

This page is fairly simple. It just shows a table of summary information for each ticker. There's a correlation matrix, where it calculates the Pearson correlation of the log returns. Unlike the scatterplot page, these correlations utilize all historic date common to the two funds being correlated. So having 1 newer ticker doesn't mess up the accuracy of a correlation between 2 old tickers. This does mean that the correlation matrix is not positive semi-definite, but that's too complicated to explain the implications of (an earlier version of this site had a feature to simulate data, and this issue came up).

There's also a matrix for "Log Losses Cosine Similarity". In the same way that Root-Mean-Square is just the standard deviation but using a deviation from 0 instead of deviation from the mean... Cosine Similarity is basically a pearson correlation, but using the deviation from 0 instead of deviation from the mean. Cosine Similarity normally could range from -1 to +1. But in order to have a negative output, there needs to be data points with opposite signs. Since log losses are 0 or negative values, there couldn't be any days that contribute towards a negative cosine simularity. This means the cosine simularity actually ranges from +1 to 0, hence the color scale starts to be green below 0.5. 

## Portfolios Page

This page is for managing portfolio tickers. A portfolio ticker must be prefixed by an underscore, and is simply the combination of 1 or multiple tickers. The scatterplot page actually has a button to create a portfolio ticker from a selected point, and it prefill the form. Or from this page you can create a portfolio ticker from scratch. The price history for these portfolios uses the exact same calculation that the scatterplot page uses when generating points. These portfolio tickers can be used throughout the app just like a ticker (line chart page, scatterplot page, and stats page)

On the scatterplot page, you can use portfolio tickers to discover minor refinements to your current portfolio. Choose a high segment count (such as 16), and then use a filter such as `_portfolio in [14,15,16]`. Try several tickers alongside your portfolio ticker, and see if any improve the portfolio. 
