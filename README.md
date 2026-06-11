# GovIntel API

GovIntel is a federal sales intelligence platform built on top of USAspending.gov data. It helps government contractors identify attractive markets, target the right agencies, analyze competitors, and prioritize opportunities.

## GovIntel v1.0 Features

### POST /api/market-analysis
Provides an executive summary of a federal market, including:
- Market size
- Award count
- Competition level
- Opportunity score
- Executive summary

### POST /api/agency-intelligence
Identifies the agencies spending the most in a market.

### POST /api/vendor-intelligence
Analyzes incumbent vendors and competitors.

### POST /api/awards
Returns raw award records from USAspending.

### POST /api/opportunity-score
Calculates a pursue/no-pursue opportunity score.

### POST /api/track
Receives analytics events from GovIntel AI.

## Architecture

USAspending.gov → GovIntel API → Federal Sales Intelligence

## Sprint 2 Roadmap

- Recompete intelligence
- Contract expiration tracking
- Agency spending trends
- AI-generated capture recommendations
- Custom GPT orchestration

## Version

Current Release: GovIntel v1.0
