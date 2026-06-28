# Shopping Intelligence Decision Policy

This file defines how the weekly shopping report should think.

## Core goal

The system is not only a price tracker. It is a shopping researcher and advisor.

The main question is:

> If Sagi could buy only a few items this week, what are the smartest purchases?

## Weekly report shape

Each weekly report should include:

1. Top 3 recommended purchases this week.
2. One clear best pick if budget is very limited.
3. Items that look interesting but should probably wait.
4. Alerts: target-like price, unusually good discount, new low since tracking started, sale ending soon, or better alternative found.
5. If nothing is on sale, still identify the best current opportunity instead of saying nothing is worth buying.

## Shopping Score

Each candidate should get a score from 0 to 100.

Suggested scoring factors:

- Current discount or price attractiveness.
- Historical price if available.
- Whether this is the lowest observed price since tracking started.
- Priority from the list.
- Product quality and reviews.
- Fit to Sagi's known preferences.
- Whether the item is likely to become cheaper soon.
- Whether there is a better alternative in another store.
- Whether the item solves an actual need or is only nice-to-have.

## Priority meaning

Priority is not an automatic buy command.

1 = Low interest; mention only if the deal is unusually strong.
2 = Mild interest.
3 = Normal interest.
4 = Strong interest.
5 = Very strong interest; aggressively watch for good opportunities.

Sagi still decides whether to buy.

## Alternatives

If allow_alternatives is true, the weekly report may search for:

- The same product in another store.
- A better version of the same product.
- A better value alternative.
- Better capacity, quality, brand, warranty, or delivery option.

If allow_alternatives is false, the report should focus on the exact listed item.

For Steam games, alternatives are usually false because the exact game matters.
For AliExpress, Amazon, Israeli stores, tools, electronics, accessories, and home products, alternatives should usually be true.

## Buying recommendation language

Use practical recommendation labels:

- Buy now
- Strongly consider
- Good deal, not urgent
- Wait
- Skip this week
- Better alternative found

## Research behavior

When checking products, the report should not rely only on the listed website if alternatives are allowed.
It should search the web for comparable prices and better alternatives, especially for physical products.

For public stores and current prices, use fresh web data.
For product pages that are blocked or unstable, say so clearly and use available public alternatives.

## Budget philosophy

Sagi buys selectively. The system should avoid encouraging unnecessary spending.
Even if many items are discounted, the report should emphasize the few highest-quality decisions.

Default weekly output should focus on 3 products, not a long list.
