# GovIntel API

GovIntel is a federal sales intelligence platform built on top of USAspending.gov data. It helps government contractors identify attractive markets, target the right agencies, analyze competitors, discover recompete opportunities, and prioritize business development efforts.

## GovIntel v2 Features

### Core Intelligence Endpoints

#### POST /api/market-analysis
Provides:
- Estimated market size
- Competition level
- Opportunity score
- Executive market summary

#### POST /api/agency-intelligence
Identifies:
- Top buying agencies
- Agency spending levels
- Recommended agency targets

#### POST /api/vendor-intelligence
Analyzes:
- Incumbent contractors
- Competitor concentration
- Top market vendors

#### POST /api/opportunity-score
Calculates a pursue/no-pursue score from 1-10.

#### POST /api/awards
Returns raw award records from USAspending.

## Sprint 2 Intelligence Endpoints

#### POST /api/agency-trends
Analyzes agency spending trends and identifies growing buyers.

#### POST /api/buying-patterns
Identifies federal purchasing behaviors and buying patterns.

#### POST /api/capture-recommendations
Generates business development and capture recommendations.

#### POST /api/procurement-forecast
Forecasts future procurement demand based on historical activity.

#### POST /api/setaside-intelligence
Analyzes small business and socioeconomic set-aside opportunities.

#### POST /api/naics-intelligence
Recommends NAICS codes and market alignment.

#### POST /api/recompete-intelligence
Identifies expiring contracts and upcoming recompete opportunities.

#### POST /api/govintel-report
Produces a complete federal market intelligence report.

## Analytics Endpoint

#### POST /api/track
Receives analytics events from GovIntel AI Custom GPT.

## Architecture

USAspending.gov → GovIntel API → GovIntel AI → Federal Sales Intelligence

## Custom GPT Integration

GovIntel AI integrates with ChatGPT Actions to provide:

- Agency intelligence
- Competitor analysis
- Spending intelligence
- Capture recommendations
- Recompete tracking
- Procurement forecasting

## Version

Current Release: GovIntel v2.0