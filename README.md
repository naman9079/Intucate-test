# SQI Diagnostic Tool

A Student Quality Index (SQI) diagnostic tool for analyzing student test performance data.

## Features

- **Mocked Login**: Email + password authentication (@intucate.com domain, 8+ chars)
- **Admin Console**: 
  - Save diagnostic agent prompts
  - Upload student data (JSON/CSV) or paste directly
  - Compute SQI with weighted scoring
- **SQI Engine**: 
  - Calculates overall SQI, topic scores, and concept scores
  - Applies importance, difficulty, and type weights
  - Behavioral adjustments (time spent, marked for review, revisits)
- **Results Display**: 
  - Ranked concepts for summary customizer agent
  - Download and copy JSON output

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Sample Data

```json
{
  "student_id": "S001",
  "attempts": [
    {
      "topic": "Borrowing Costs",
      "concept": "Definitions",
      "importance": "A",
      "difficulty": "M",
      "type": "Theory",
      "case_based": false,
      "correct": false,
      "marks": 2,
      "neg_marks": 0.5,
      "expected_time_sec": 90,
      "time_spent_sec": 130,
      "marked_review": true,
      "revisits": 1
    }
  ]
}
```

## Tech Stack

- React 18
- TypeScript
- Vite
- No external UI library (pure CSS)
