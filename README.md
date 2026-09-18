# Sentinel Insights

SENTINEL DTRADER — ADVANCED PROTOTYPE

IMPORTANT: THIS IS A PROTOTYPE

Build this as an advanced, production-quality UI/UX prototype, not as the final live trading implementation.

Do NOT pretend that mock data is real trading data.

Do NOT implement fake purchases, fake payouts, fake account balances, or fake live market statistics and present them as real.

The prototype's job is to establish:

the complete interface

the interaction model

the component architecture

the trading workflow

the market-selection workflow

the contract-selection workflow

the intelligence/analysis presentation

the 0–9 live-digit visualization

clean service interfaces that can later be connected to the real Deriv API

The real Deriv market stream, live digit calculations, real proposals, authentication, buying, open-contract monitoring and selling will be wired in after this prototype is delivered.

1. PRODUCT IDENTITY

Product name:

SENTINEL DTRADER

Subtitle:

LIVE EXECUTION + MARKET INTELLIGENCE COCKPIT

This is NOT:

a forex terminal

MT4

MT5

cTrader

a generic CFD platform

a casino interface

a crypto exchange clone

The visual and functional foundation must be Deriv DTrader / Deriv Options, enhanced into a much more advanced Sentinel intelligence cockpit.

The first-class markets are Deriv Derived/Synthetic markets and other Deriv markets that are actually available.

Examples may include:

Volatility Indices

Volatility Indices 1s

Crash/Boom

Jump

Step

Range Break

other currently available Derived/Synthetic markets

Do not hard-code the final market list.

The eventual live implementation will discover markets dynamically through Deriv's current market-data APIs.

2. THE CORE IDEA

The product should not simply ask:

"Which contract do you want?"

It should first understand the selected market.

The user selects a market.

Sentinel then builds a Market Intelligence Dossier.

The dossier examines the live market and presents information such as:

current price

recent ticks

digit distribution

parity

pressure

momentum

psychology

regime

volatility behaviour

anomalies

losing-digit threat

recent sequences

market quality

data quality

feed status

contract suitability

Then Sentinel evaluates the available contract opportunities.

For example, after selecting:

Volatility 10 (1s)

the interface could eventually show analytical candidates such as:

UNDER 3

or

OVER 2

or

ODD

or

DIFFERS 7

depending on what the actual data supports.

But the system MUST also support:

NO QUALIFIED CONTRACT

when the evidence is insufficient or conflicting.

Never force a trade recommendation merely to populate the interface.

3. IMPORTANT SEPARATION OF RESPONSIBILITIES

The prototype must clearly separate:

PROTOTYPE DATA

Used now to demonstrate the interface.

Examples:

mock ticks

mock digit statistics

mock Sentinel states

mock proposals

mock account

mock contracts

Label these internally as prototype/mock data.

FUTURE LIVE DATA

Create clean service interfaces for later connection to:

active_symbols

contracts_for

ticks

ticks_history

proposal

buy

proposal_open_contract

sell

portfolio

The current Deriv API uses underlying_symbol in the current request/response model, so do not build the architecture around obsolete symbol assumptions.

The prototype should make replacing the mock services with real Deriv services straightforward.

4. MAIN WORKSPACE

Create one unified trading cockpit.

Desktop layout:

TOP

Market navigation bar.

Include:

current market

market tabs

Add Market

Market Finder

connection/feed indicator

account area

balance placeholder

CENTER

Main chart.

The chart should feel like a modern Deriv trading workspace.

Include:

price/tick chart

timeframe controls

chart-type controls

zoom

crosshair

technical-analysis controls

current price

tick activity

selected market

Do not make the chart look like a generic forex terminal.

RIGHT

Adaptive Contract & Trade Deck.

BOTTOM

The 0–9 Live Digit Intelligence panel must be a major permanent component.

Do NOT hide it behind another page.

Do NOT reduce it to a tiny card.

It is one of the defining features of Sentinel DTrader.

5. MARKET FINDER

Build a sophisticated market finder.

It should eventually support dynamic market discovery.

Categories:

Volatility

Volatility 1s

Crash/Boom

Jump

Step

Range Break

other Derived/Synthetic markets

other available Deriv markets

Search by:

market name

symbol

category

Display:

market name

symbol

category

current price placeholder

feed status

available contract families

Sentinel status

Allow instant switching without page reload.

When the market changes, the entire cockpit should update coherently:

chart

ticks

digit distribution

Sentinel analysis

contract availability

contract candidates

trade deck

6. CONTRACT SYSTEM

This is one of the most important parts.

The interface must support contract families including:

DIGIT CONTRACTS

Even

Odd

Matches

Differs

Over

Under

DIRECTION CONTRACTS

Rise

Fall

Higher

Lower

BARRIER CONTRACTS

Touch

No Touch

Only display contracts that are actually available for the selected market.

Do NOT assume every market supports every contract.

The eventual implementation will use Deriv's contracts_for response to determine availability.

7. ADAPTIVE CONTRACT DECK

The contract panel must change according to the selected contract.

For:

EVEN / ODD

Show:

contract

duration

stake

proposal area

expected payout placeholder

potential return

buy button

For:

MATCHES / DIFFERS

Show:

0 1 2 3 4 5 6 7 8 9

as selectable digits.

Selecting a digit should immediately update the contract configuration.

For:

OVER / UNDER

Show:

0 1 2 3 4 5 6 7 8 9

as barrier choices.

For:

RISE / FALL

Show direction controls and duration.

For:

HIGHER / LOWER

Show barrier controls.

For:

TOUCH / NO TOUCH

Show barrier configuration.

The controls should feel like one adaptive instrument rather than separate unrelated pages.

8. CONTRACT LAB

Create a major feature called:

CONTRACT LAB

This is where Sentinel evaluates available contract opportunities.

For digit contracts, show candidates such as:

EVEN

ODD

OVER 0

OVER 1

OVER 2

...

UNDER 9

UNDER 8

...

MATCHES 0

MATCHES 1

...

DIFFERS 9

Each candidate should have a compact intelligence row containing:

contract

statistical state

frequency

recent pressure

momentum

recency

threat

regime compatibility

payout/value placeholder

conflict indicator

Sentinel state

Possible states:

QUALIFIED

WATCH

CONFLICT

WEAK

NO QUALIFICATION

Do not make everything green.

The purpose is to expose genuine differences between contracts.

9. SENTINEL MARKET INTELLIGENCE

Create a serious analysis panel.

It must look like an analytical engine, not a decorative AI card.

Show:

MARKET

Current market identity.

DATA INTEGRITY

Whether enough data exists for analysis.

FEED

LIVE / STALE / LAGGING / DEGRADED

SAMPLE

Number of ticks currently available.

PARITY

EVEN / ODD distribution.

PRESSURE

Current directional pressure.

MOMENTUM

Recent movement.

PSYCHOLOGY

Longer-window behavioural structure.

REGIME

Current market regime.

Possible prototype regimes:

BALANCED

EVEN PRESSURE

ODD PRESSURE

DIGIT CONCENTRATION

DIGIT DISPERSION

TRANSITION

ANOMALOUS

LOSING-DIGIT THREAT

Identify digits that may represent elevated risk according to the prototype analysis model.

ANOMALY

Identify unusual recent behaviour.

MARKET QUALITY

A data-quality/structure indicator.

CONTRACT CONFLICT

Clearly explain when different analytical signals disagree.

SENTINEL DECISION

Possible states:

ANALYSIS READY

QUALIFIED CONTRACT

NO QUALIFIED CONTRACT

ANALYSIS LAG

FEED STALE

ENGINE BUSY

BACKEND DEGRADED

Do not promise winning trades.

10. 0–9 LIVE DIGIT INTELLIGENCE

This is a flagship feature.

Build a large, highly polished permanent panel.

Display all:

0 1 2 3 4 5 6 7 8 9

For every digit display:

percentage

count

frequency bar

trend

last appearance

current run

pressure

momentum

recent status

Example:

DIGIT 3

Frequency: 14.2%

Count: 71

Last seen: 4 ticks ago

Run: 1

Pressure: ↑

Momentum: +0.8

The values are prototype values for now.

11. DIGIT WINDOWS

Provide selectable analysis windows:

20

50

100

120

500

1000

Changing the window must update the entire digit panel.

Also display:

EVEN %

ODD %

HOT DIGITS

COLD DIGITS

MOST RECENT DIGIT

CURRENT STREAK

DIGIT CONCENTRATION

DIGIT DISPERSION

12. INTERACTIVE DIGITS

The digit panel should not merely display statistics.

Make digits interactive.

When the user clicks a digit:

highlight it

show its detailed statistics

allow quick transfer to Matches/Differs

allow quick transfer to Over/Under where logically applicable

show Sentinel analysis for that digit

show recent appearances

show pressure/momentum

Example:

Click 3

Then show:

DIGIT 3 INTELLIGENCE

Frequency

Recent frequency

Long-window frequency

Last seen

Current run

Pressure

Momentum

Threat

Regime compatibility

Matches 3 suitability

Differs 3 suitability

13. MARKET DOSSIER

Create a dedicated expandable section called:

MARKET DOSSIER

When the user selects a market, Sentinel should visually assemble:

Market identity

Current price

Tick sample

Feed quality

Digit distribution

Parity

Pressure

Momentum

Psychology

Regime

Anomaly

Losing-digit threat

Market quality

Contract suitability

This should feel like the market has been "read" before the user decides what to trade.

14. PRIMARY ANALYTICAL CANDIDATE

Give Sentinel a prominent area:

PRIMARY CONTRACT ANALYSIS

Example prototype output:

UNDER 3

Then show:

Why:

digit distribution evidence

recent pressure

window agreement

regime compatibility

threat assessment

conflicts

However, the system must also be able to show:

NO QUALIFIED CONTRACT

with an explanation.

Never force a contract simply because the interface needs a result.

15. EXPLAINABILITY

Avoid meaningless:

AI Score: 94%

Instead provide evidence.

For example:

UNDER 3

20-tick distribution: supportive

100-tick distribution: supportive

500-tick distribution: neutral

recent pressure: supportive

parity: neutral

regime: supportive

anomaly: none detected

contract conflict: low

data quality: sufficient

Then:

Sentinel status: QUALIFIED

Again, these are prototype analytical demonstrations only.

16. TRADE FLOW

The user must remain in control.

Prototype workflow:

Select market

Sentinel builds market dossier

Select contract

Review contract analysis

Review proposal placeholder

Review stake

Press Buy

For this prototype, the Buy button must NOT place a real trade.

Clearly mark prototype execution.

Create a service boundary so the real implementation can later replace:

mockTradeService.buy()

with the real Deriv trading flow.

17. PROPOSAL AREA

Create a realistic proposal card.

Show:

Stake

Ask price

Payout

Potential profit

Duration

Contract

Barrier/digit

Current quote

proposal status

But clearly mark this as:

PROTOTYPE PROPOSAL

Do not invent fake live pricing and label it as real.

18. OPEN CONTRACTS

Create an Open Contracts section.

Prototype rows should contain:

contract

market

entry

current value

profit/loss

status

expiry

Sell button

For now:

Prototype only

Later this will be connected to proposal_open_contract and sell.

19. HISTORY

Create a professional trade history panel.

Include:

time

market

contract

entry

result

profit/loss

duration

status

Keep this architecture separate from mock market analysis.

20. SERVICE ARCHITECTURE

Create clear service interfaces.

Suggested structure:

marketDataService

contractService

proposalService

tradeService

openContractService

accountService

analysisService

digitAnalysisService

Do not bury all logic inside React components.

The eventual live implementation will replace these prototype services with real Deriv integrations.

21. ANALYSIS SNAPSHOT

Create a central analysis model similar to:

AnalysisSnapshot

market
timestamp
analysisVersion
tickCount
windowStats
digitStats
parityStats
pressure
momentum
psychology
regime
threat
anomaly
marketQuality
contractCandidates
qualifiedCandidate
decision
reasons
conflicts
dataIntegrity
feedStatus

The UI should consume this object rather than independently inventing analysis values in multiple components.

22. ONE MARKET STREAM

Architect the prototype around the principle that there will eventually be:

ONE AUTHORITATIVE MARKET DATA STREAM

That stream will feed:

chart

tick history

0–9 digit engine

parity analysis

Sentinel

contract analysis

market status

Do NOT design the application around separate independent WebSocket streams for every widget.

This is extremely important for the later live implementation.

23. NO PAGE RELOAD MARKET SWITCHING

Market switching must feel instantaneous.

When changing:

Volatility 10

to

Volatility 25

the cockpit should transition as one system.

Update:

chart

price

ticks

digits

analysis

contract availability

Contract Lab

trade deck

Do not reload the entire page.

24. VISUAL DESIGN

Style:

dark

premium

technical

futuristic

professional

restrained

Do NOT use:

casino aesthetics

excessive neon

giant glowing borders

childish gradients

generic crypto-dashboard styling

forex-terminal styling

Think:

2030 trading cockpit

rather than:

2010 trading platform

Use strong information hierarchy.

Important information should be visually obvious without making the screen chaotic.

25. DESKTOP

Desktop should feel like a professional command center.

Suggested composition:

┌───────────────────────────────────────────────────────────────┐
│ SENTINEL DTRADER MARKET TABS CONNECTION ACCOUNT │
├───────────────────────────────────────────────┬───────────────┤
│ │ │
│ LIVE CHART │ CONTRACT │
│ │ TRADE DECK │
│ │ │
├───────────────────────────────────────────────┤ │
│ MARKET DOSSIER / SENTINEL INTELLIGENCE │ │
├───────────────────────────────────────────────┴───────────────┤
│ │
│ 0–9 LIVE DIGIT INTELLIGENCE │
│ │
├───────────────────────────────────────────────────────────────┤
│ CONTRACT LAB / OPEN CONTRACTS / HISTORY │
└───────────────────────────────────────────────────────────────┘

Adapt the exact layout intelligently rather than following this literally.

26. MOBILE

Do NOT simply shrink the desktop UI.

Create a dedicated mobile composition.

Important:

chart remains usable

trade controls accessible

market switching easy

0–9 intelligence remains prominent

Contract Lab accessible

Sentinel analysis accessible

bottom-sheet trading controls are acceptable

no controls should become unreachable

no vertical scrolling traps

no frozen drawers

no hidden Stop/Buy controls

The mobile interface must be designed deliberately.

27. PROTOTYPE DATA

Use deterministic/mock data only where required to demonstrate the interface.

Make the mock data realistic enough to demonstrate:

changing digit distributions

different regimes

pressure

momentum

hot/cold digits

contract conflicts

qualified candidate

no qualified candidate

stale feed

insufficient data

Provide multiple prototype states so the UI can demonstrate different scenarios.

Do not hard-code the UI to one permanently successful contract.

28. DEMONSTRATION STATES

Include a prototype/demo mechanism that allows testing:

STATE A

Strong analysis / qualified contract.

STATE B

Conflicting signals.

STATE C

Insufficient data.

STATE D

Feed stale.

STATE E

No qualified contract.

This will allow the later real engine to replace the mock states without redesigning the interface.

29. CURRENT DERIV COMPATIBILITY

Do not implement obsolete assumptions.

The future live integration should use the current Deriv API model.

The architecture must accommodate:

active_symbols

contracts_for

ticks

ticks_history

proposal

authenticated buy

proposal_open_contract

sell

portfolio

Current Deriv documentation uses underlying_symbol rather than the older symbol field in relevant current API structures.

Do not hard-code the market catalogue because Deriv can introduce new markets and contract availability can differ by symbol.

30. VERY IMPORTANT — DO NOT BUILD THE REAL TRADING CONNECTION YET

This version is the prototype handoff.

Do not ask for or embed private trading credentials.

Do not make real purchases.

Do not simulate a successful purchase and claim it is real.

Do not create fake live account balances and present them as real.

Instead:

Build the interface and architecture so that the next engineering phase can connect the real Deriv infrastructure.

31. FINAL QUALITY BAR

When finished, the prototype should look and feel like:

SENTINEL DTRADER

not:

a Lovable-generated dashboard

It should feel like a serious Deriv-native trading product with a new intelligence layer.

The user should immediately understand:

What market am I watching?

What is happening in the market?

What do the last digits look like?

What is Sentinel detecting?

Which contract types are available?

What contracts are being evaluated?

Why is a contract qualified or not qualified?

What would the trade configuration be?

What happens after I place a trade?

The prototype must make the future live integration straightforward.

MOST IMPORTANT

Build the experience and architecture now.

Do not fake the final live system.

The next engineering phase will connect the prototype to the real Deriv market stream and replace the mock layers with:

real markets → real ticks → real 0–9 digit calculations → real Sentinel analysis → real contract availability → real proposals → authenticated real trading → real open-contract monitoring.

The prototype must be designed so that this transition does NOT require rebuilding the interface.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/99601765-7ec1-4314-9b7f-603e85c56977).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
