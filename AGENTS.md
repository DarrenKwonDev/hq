# AGENTS.md - overwhole hq guide

## Agent List and Role

| Agent | Models | Role |
| ----- | ------ | ---- |
| master | GPT 5.2 | make goal into structured format, planning, session mngt | 
| researcher | GPT 5.2 | research hypothesis received from master agent |
| critic | GPT 5.2 | verify researcher's output, assign trust score | 

## Tooling Build and Test Script  

```python
```

```typescript
```

## Research & Strategies Philosophy
Prioritize structural edge over statistical methods:
- **Preferred**: Rule-based arbitrage, exchange/protocol mechanics exploitation, risk-free opportunities
- **Examples**: CEX-DEX arb, fee structure arbitrage, timing advantages (morning edge, DMA), protocol inefficiencies
- **Avoid**: Pure mean reversion or mathematical prediction (unless clear edge exists)
- **Focus**: Market microstructure, regulatory advantages, execution infrastructure


## Slash Commands

none

## Adversarial Verification Protocol

none

## Checkpoint Memory System

none

## Project Structure

### Persistant Structure

```
./playbook/
└──{[TITLE]}/
   ├──{[TITLE]}.ipynb
   ├──figures // plot, img etc
   ├──data    // process data from raw data
   ├──config  // weight, fee, other hyperparams and constants
   │  └──hyperparam.yaml
   │  └──constants.yaml
   └──report.md
```

- each playbook's {title} has own virtual env in python.

### Ephemeral Structure

