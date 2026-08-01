# EDORI 2.0 Design Specification

**Product Name:** Emergency Department Operational Readiness Index
**Abbreviation:** EDORI
**Document Status:** Initial Design Draft
**Target Release:** EDORI 2.0
**Last Updated:** August 2026

---

## 1. Purpose

EDORI is an emergency department operational decision-support platform designed to identify developing operational strain, explain its causes, and support consistent escalation and intervention.

EDORI is not intended to function solely as a traditional emergency department crowding score. Its purpose is to combine current operational conditions, historical expectations, hospital constraints, patient complexity, expected flow, and operational trends into a structured assessment of emergency department readiness.

The application should answer five questions:

1. What is the current operational state?
2. What factors are contributing to that state?
3. Are conditions improving, stable, or worsening?
4. What operational triggers are active?
5. What actions should be considered?

---

## 2. Core Mission

> Provide objective, explainable, and timely operational intelligence that helps emergency department and hospital leaders recognize deteriorating conditions and initiate appropriate interventions before unsafe conditions become normalized.

---

## 3. Intended Users

Primary users include:

* emergency department charge nurses;
* emergency department medical leadership;
* emergency department nursing leadership;
* hospital operations leaders;
* bed-management and patient-flow teams;
* nursing supervisors;
* hospital executives;
* quality-improvement and clinical-outcomes teams.

Secondary users may include:

* emergency preparedness teams;
* data analysts;
* researchers;
* hospital command-center personnel;
* system-level operational leaders.

---

## 4. Intended Use

EDORI is intended to support operational awareness and decision-making.

EDORI may be used for:

* periodic emergency department operational assessments;
* surge-plan activation support;
* hospital throughput escalation;
* shift handoff;
* operational huddles;
* retrospective review;
* quality-improvement analysis;
* evaluation of operational interventions;
* future forecasting and predictive modeling.

EDORI does not replace:

* clinical judgment;
* hospital incident-command structures;
* emergency preparedness procedures;
* regulatory requirements;
* local staffing policies;
* clinical escalation protocols;
* patient-specific decision-making.

---

## 5. Design Principles

### 5.1 Actionable

Every operational assessment should identify actions that may address the most important active problems.

A user should not need to interpret a score without context.

### 5.2 Explainable

Every EDORI result should show:

* the current score;
* the operational state;
* the major contributors;
* active operational triggers;
* the historical baseline used;
* the rationale for recommended actions.

### 5.3 Historically Normalized

Current conditions should be interpreted relative to expected conditions for the corresponding weekday and hour.

A high-volume period that is historically expected should not automatically be treated the same as an unusual or rapidly deteriorating period.

### 5.4 Sensitive to Meaningful Deterioration

The system should identify conditions that are unusually strained or unsafe without remaining permanently in a critical state because of chronic baseline boarding.

### 5.5 Configurable

Hospital-specific values should be stored in configuration rather than embedded throughout the code.

Configurable values should eventually include:

* emergency department treatment-bed capacity;
* hospital medical-bed capacity;
* score thresholds;
* historical expectations;
* trigger thresholds;
* surge tiers;
* reassessment intervals;
* operational recommendations.

### 5.6 Deterministic Before Predictive

The initial operational model should be understandable, testable, and reproducible.

Machine learning should not replace the deterministic model until sufficient reliable local data are available and predictive performance has been evaluated.

### 5.7 Clinically and Operationally Validated

The scoring model should be evaluated against:

* structured operational scenarios;
* retrospective local data;
* experienced operational judgment;
* operational events and interventions;
* relevant outcome measures.

---

## 6. Current Hospital Configuration

The initial EDORI implementation is designed for:

* **Emergency department treatment capacity:** 63 beds
* **Annual emergency department volume:** approximately 70,000 visits
* **Hospital licensed capacity:** 308 beds
* **Medical-bed occupancy denominator:** 273 beds
* **Typical emergency department boarding:** approximately 35 patients

These values must eventually be configurable.

---

## 7. Current Assessment Inputs

The current user-entered operational assessment includes:

### ED Demand

* Total ED Volume
* Boarding Patients

### Hospital Capacity

* Occupied Medical Beds

### Patient Acuity

* ESI 1 patient count
* ESI 2 patient count
* ESI 3 patient count
* ESI 4 patient count
* ESI 5 patient count

### Automatically Selected Metadata

* Assessment timestamp
* Day of week
* Hour of day

### Automatically Loaded Historical Expectations

* Expected ED Volume
* Expected Boarding
* Expected Arrivals
* Expected Departures

Nursing and physician staffing are intentionally excluded from the current EDORI algorithm.

---

## 8. EDORI 2.0 Operational Model

EDORI 2.0 will organize operational risk into four primary pillars.

### 8.1 Operational Demand

Operational Demand represents the workload currently being placed on the emergency department.

Potential components include:

* total ED volume relative to historical expectation;
* ED treatment-space occupancy;
* total volume relative to 63 treatment beds;
* boarding volume;
* boarding relative to historical expectation;
* boarding as a percentage of total ED volume.

Operational Demand should distinguish between:

* expected routine demand;
* above-expected demand;
* physical-capacity strain;
* boarding-driven loss of functional treatment capacity.

### 8.2 Clinical Complexity

Clinical Complexity represents the intensity of care required by the current patient population.

Initial components include:

* ESI distribution;
* weighted average acuity;
* number and percentage of ESI 1 and ESI 2 patients;
* total high-acuity burden.

Future components may include:

* critical-care patients;
* ventilated patients;
* behavioral-health patients;
* trauma activations;
* stroke activations;
* STEMI activations;
* isolation requirements;
* one-to-one observation needs.

Clinical Complexity should increase operational concern without independently forcing a severe operational state when demand and throughput remain manageable.

### 8.3 Hospital Throughput

Hospital Throughput represents the degree to which inpatient capacity and patient movement constrain emergency department operations.

Initial components include:

* occupied medical beds divided by 273;
* boarding relative to expected boarding;
* expected arrivals;
* expected departures;
* expected net flow;
* hospital occupancy combined with boarding burden.

Future components may include:

* pending discharges;
* staffed versus licensed inpatient beds;
* bed-assignment delays;
* environmental-services turnaround;
* transport delays;
* inpatient admission order-to-bed time.

Hospital occupancy alone should not dominate the final EDORI score. Its operational effect should be strongest when combined with significant boarding or worsening flow.

### 8.4 Operational Momentum

Operational Momentum represents whether conditions are improving, stable, or worsening.

Potential components include:

* change in EDORI score;
* consecutive score increases;
* change in boarding;
* change in total ED volume;
* rate of change;
* expected net flow;
* duration in an elevated state;
* acceleration of deterioration.

Operational Momentum requires multiple assessments and will not be available before sufficient historical snapshots exist.

---

## 9. EDORI Score

EDORI will continue to produce a numerical score from 0 through 100.

The score is a summary measure and should not be the only determinant of the final operational state.

The score must be:

* reproducible;
* bounded from 0 through 100;
* based on validated inputs;
* calculated exactly once per submitted assessment;
* stored with its component scores;
* traceable to its contributing variables.

The score should be interpreted together with:

* operational state;
* active triggers;
* trend;
* confidence;
* primary drivers;
* recommendations.

---

## 10. Operational States

The proposed operational states are:

### 10.1 Normal Operations

**Meaning:** Conditions are within expected operating variation, and available capacity is adequate.

**Typical response:**

* continue standard operations;
* routine reassessment;
* monitor normal throughput metrics.

### 10.2 Elevated Awareness

**Meaning:** One or more conditions are above expected levels, but existing resources and workflows remain adequate.

**Typical response:**

* increase situational awareness;
* monitor boarding and patient flow;
* identify developing barriers;
* consider more frequent reassessment.

### 10.3 Capacity Strain

**Meaning:** Multiple pressures are affecting throughput or reducing operational reserve.

**Typical response:**

* review admission and discharge barriers;
* engage bed-management and patient-flow teams;
* evaluate available surge spaces;
* increase reassessment frequency.

### 10.4 High Surge

**Meaning:** Emergency department operations are significantly strained and require coordinated hospital intervention.

**Typical response:**

* activate the appropriate surge-plan tier;
* escalate inpatient throughput barriers;
* notify hospital operations;
* evaluate overflow and additional-capacity options;
* establish frequent reassessment.

### 10.5 Severe Surge

**Meaning:** Operational reserve is very limited, multiple systems are strained, and patient-safety risk is increasing.

**Typical response:**

* initiate hospital-wide surge response;
* engage executive and operational leadership;
* implement additional capacity measures;
* prioritize immediate throughput interventions;
* reassess at short intervals.

### 10.6 Critical Operations

**Meaning:** The emergency department is operating under extreme or sustained strain with a significant risk of operational failure.

**Typical response:**

* activate the highest appropriate organizational response;
* establish executive oversight;
* use command-center or incident-management structures as appropriate;
* implement emergency capacity and flow interventions;
* maintain continuous or very frequent reassessment.

---

## 11. Operational State Determination

The final operational state will be determined using:

1. the calculated EDORI score;
2. configured score thresholds;
3. operational trigger rules;
4. trend or momentum;
5. minimum-state escalation gates.

Conceptual workflow:

```text
Calculated EDORI Score
        ↓
Base Operational State
        ↓
Evaluate Active Triggers
        ↓
Apply Minimum-State Gates
        ↓
Final Operational State
```

A trigger may elevate the final operational state above the score-derived state.

A trigger should not normally lower the state below the score-derived state.

---

## 12. Operational Trigger Engine

The Trigger Engine will evaluate configurable rules against the completed operational assessment.

Each trigger will contain:

* unique identifier;
* title;
* description;
* enabled status;
* condition type;
* threshold values;
* required duration when applicable;
* minimum operational state;
* recommended actions;
* priority;
* clinical or operational rationale.

### 12.1 Initial Trigger Categories

#### Boarding Triggers

Examples:

* boarding at or above a configured absolute threshold;
* boarding significantly above historical expectation;
* boarding above a configured percentage of ED census;
* sustained boarding over multiple assessments.

#### ED Demand Triggers

Examples:

* total ED volume above treatment-bed capacity;
* ED volume more than a configured amount above expectation;
* ED occupancy above a configured percentage;
* rapid increase in total ED volume.

#### Hospital Throughput Triggers

Examples:

* medical-bed occupancy above a configured threshold;
* high occupancy combined with elevated boarding;
* expected arrivals exceeding expected departures;
* constrained hospital capacity with worsening boarding.

#### Acuity Triggers

Examples:

* unusually high ESI 1 and ESI 2 volume;
* high-acuity patients above a configured percentage of census;
* high-acuity burden combined with high ED occupancy.

#### Momentum Triggers

Examples:

* three consecutive EDORI increases;
* rapid score increase;
* boarding increasing over several assessments;
* sustained time in High Surge or above.

### 12.2 Trigger Output

Each active trigger should produce:

* trigger title;
* trigger priority;
* reason it activated;
* current value;
* threshold value;
* recommended actions;
* minimum operational state;
* reassessment recommendation.

---

## 13. Initial Trigger Concepts

The following are design concepts and are not final validated thresholds.

### Trigger: ED Treatment Capacity Exceeded

**Condition:** Total ED Volume is greater than 63.

**Potential effect:** Minimum state of Elevated Awareness or Capacity Strain, depending on degree.

### Trigger: Significant Boarding

**Condition:** Boarding Patients are at or above a configurable threshold.

**Potential effect:** Minimum state based on local surge policy.

### Trigger: Boarding Crisis

**Condition:** Boarding is substantially above expected boarding or exceeds a high absolute threshold.

**Potential effect:** Minimum state of High Surge.

### Trigger: Hospital Constraint

**Condition:** Medical-bed occupancy is above a configured threshold and boarding is elevated.

**Potential effect:** Escalate hospital-throughput response.

### Trigger: Worsening Expected Flow

**Condition:** Expected arrivals exceed expected departures by a configured amount.

**Potential effect:** Increase monitoring or minimum operational state.

### Trigger: Sustained Deterioration

**Condition:** EDORI rises for a configured number of consecutive assessments.

**Potential effect:** Activate a momentum warning and increase reassessment frequency.

These concepts require clinical and operational review before implementation.

---

## 14. Operational Assessment Object

EDORI 2.0 will introduce a single authoritative `OperationalAssessment` object.

Conceptual structure:

```typescript
interface OperationalAssessment {
    assessment: SituationAssessment;
    scoreResult: EdoriResult;
    baseOperationalState: OperationalState;
    finalOperationalState: OperationalState;
    riskDirection: OperationalRiskDirection;
    confidence: OperationalConfidence;
    pillarScores: OperationalPillarScores;
    activeTriggers: OperationalTriggerResult[];
    primaryDrivers: Driver[];
    recommendations: OperationalRecommendation[];
    generatedAt: Date;
}
```

All dashboard components should read from this object.

Dashboard components must not independently:

* recalculate EDORI;
* reinterpret thresholds;
* evaluate triggers;
* generate recommendations;
* calculate trend direction.

---

## 15. Operational Risk Direction

The system should describe operational direction separately from current state.

Proposed values:

* Improving
* Stable
* Increasing
* Rapidly Worsening
* Insufficient Data

Risk direction may eventually consider:

* score change;
* consecutive increases;
* boarding change;
* volume change;
* net expected flow;
* duration in current state.

---

## 16. Confidence

Confidence represents how much information is available to support the operational assessment.

Initial proposed values:

* High
* Moderate
* Low
* Insufficient Data

Initial confidence may be based on:

* completeness of current inputs;
* availability of the historical weekday/hour record;
* completeness of the 168-record historical dataset;
* number of trend snapshots;
* age of the current assessment.

Confidence must not imply statistical model accuracy until such accuracy has been formally evaluated.

---

## 17. Primary Drivers

Drivers should be ordered by operational contribution or severity.

Each driver should include:

* title;
* domain or pillar;
* current value;
* comparison value;
* difference;
* normalized severity;
* estimated score contribution;
* explanation.

Example:

```text
Boarding

Current: 41
Expected: 28
Difference: +13
Severity: High
```

The dashboard should display the most important drivers first.

---

## 18. Recommendations

Recommendations should be based on:

* final operational state;
* active triggers;
* dominant drivers;
* expected flow;
* operational momentum.

Recommendations should include:

* action title;
* priority;
* rationale;
* responsible operational group when configurable;
* related trigger;
* expected operational target;
* reassessment interval.

Recommendations should be phrased as decision support and should not imply automatic clinical or administrative authority.

---

## 19. Intervention Library

EDORI should maintain a configurable library of operational interventions.

Potential categories include:

### ED Capacity

* open overflow treatment spaces;
* activate alternate care areas;
* modify intake or rapid-assessment workflows;
* review assignment and space utilization.

### Hospital Throughput

* initiate discharge huddle;
* escalate bed-assignment barriers;
* prioritize inpatient bed turnover;
* notify bed management;
* engage hospital operations leadership.

### Boarding

* review boarding barriers;
* prioritize placement of long-duration boarders;
* evaluate inpatient-level care support in the ED;
* escalate sustained boarding.

### Monitoring

* increase EDORI reassessment frequency;
* establish operational huddles;
* notify departmental leadership;
* initiate structured shift handoff.

### Executive Escalation

* notify executive leadership;
* activate command-center structures;
* initiate hospital-wide surge response.

Interventions must remain configurable to align with local policy.

---

## 20. Intervention Tracking

A future intervention record should include:

```typescript
interface OperationalIntervention {
    id: string;
    assessmentId: string;
    interventionType: string;
    description: string;
    initiatedAt: Date;
    initiatedBy?: string;
    status: "Planned" | "Active" | "Completed" | "Cancelled";
    notes?: string;
}
```

Intervention tracking will support:

* shift handoff;
* operational timelines;
* after-action review;
* evaluation of intervention effectiveness;
* quality-improvement analysis.

---

## 21. Historical Data Requirements

The active weekly historical dataset requires 168 records:

```text
7 days × 24 hours = 168 records
```

Required fields:

```csv
day,hour,expectedVolume,expectedBoarders,expectedArrivals,expectedDepartures
```

The imported dataset must be:

* complete;
* free of duplicate weekday/hour records;
* free of negative values;
* stored in a versioned format;
* validated before activation.

Imported historical data take priority over the built-in fallback dataset.

Changing the active historical dataset invalidates the current EDORI result and requires recalculation.

---

## 22. Assessment Workflow

The authoritative assessment workflow is:

```text
User Enters Current Operational Values
        ↓
EdoriEngine Receives Input
        ↓
ValidationService Validates Current Inputs
        ↓
Current Date and Hour Are Captured
        ↓
Historical Expectations Are Loaded
        ↓
Completed SituationAssessment Is Validated
        ↓
EdoriService Calculates EDORI Once
        ↓
StateService Saves the Assessment
        ↓
ResultService Saves the Result
        ↓
SnapshotService Saves Eligible History
        ↓
Operational Assessment Is Generated
        ↓
Dashboard Components Refresh
```

---

## 23. Single Sources of Truth

### Current Committed Assessment

```text
StateService
```

### Current EDORI Result

```text
ResultService
```

### Assessment and Trend History

```text
SnapshotService
```

### Active Historical Expectations

```text
HistoricalDataRepository
```

### Assessment Validation

```text
ValidationService
```

### EDORI Calculation

```text
EdoriService
```

### Calculation Orchestration

```text
EdoriEngine
```

### Future Operational Interpretation

```text
OperationalAssessmentService
```

### Future Trigger Evaluation

```text
OperationalTriggerService
```

Dashboard components must remain presentation-only.

---

## 24. Persistence

The current browser implementation uses `localStorage`.

Current keys include:

```text
edori_current_assessment
edori_latest_result
edori_result_invalidation
edori_snapshots
edori_historical_expectations
```

Persistent data should remain:

* versioned;
* validated during restoration;
* protected from mutation;
* recoverable after corruption;
* replaceable by a future server API.

The long-term production design should use authenticated centralized storage rather than relying exclusively on browser storage.

---

## 25. Scenario Validation

The scenario-testing framework will be used to assess whether EDORI behaves appropriately under defined operational conditions.

Scenario categories should include:

* quiet overnight operations;
* typical daytime operations;
* high but historically expected demand;
* developing surge;
* boarding crisis;
* critical operations;
* high acuity with moderate volume;
* hospital capacity constraint;
* improving conditions;
* sustained deterioration.

Each scenario should define:

* complete assessment inputs;
* expected score range;
* expected operational state;
* rationale;
* actual pillar scores;
* actual drivers;
* pass or fail result.

Scenario expectations should be revised through structured operational review.

---

## 26. Clinical and Operational Calibration

Calibration should occur in stages.

### Stage 1: Expert Scenario Review

Experienced ED and hospital leaders review whether scenario outputs match expected operational responses.

### Stage 2: Retrospective Data Review

Historical operational data are used to evaluate score distribution and state frequency.

### Stage 3: Association With Operational Outcomes

Potential outcomes include:

* arrival-to-provider time;
* EMS offload time;
* boarding duration;
* left-without-being-seen rate;
* waiting-room volume;
* duration above treatment capacity;
* time in elevated operational states;
* surge-plan activation;
* safety events;
* staff perception of operational strain.

### Stage 4: Prospective Pilot

EDORI is used in parallel with existing operations without initially controlling decisions.

### Stage 5: Decision-Support Evaluation

The effect of EDORI-supported decisions is evaluated after governance and leadership approval.

---

## 27. Safety and Governance

Before production use, EDORI should undergo review by appropriate stakeholders, potentially including:

* emergency department leadership;
* hospital operations;
* patient-flow leadership;
* quality and safety;
* clinical informatics;
* information technology;
* cybersecurity;
* privacy;
* legal or risk management;
* institutional research or quality-improvement oversight.

The application should clearly display that it is an operational decision-support tool and does not replace clinical judgment or organizational authority.

---

## 28. Data Security

The current development implementation stores data locally in the browser.

A production implementation should address:

* authentication;
* role-based access;
* encrypted transmission;
* secure centralized storage;
* audit trails;
* retention policies;
* user attribution;
* organizational privacy requirements;
* downtime procedures;
* backup and recovery.

No protected health information should be stored unless the production system is designed and approved for that purpose.

---

## 29. Accessibility and User Experience

The interface should support:

* keyboard navigation;
* accessible form labels;
* readable contrast;
* responsive display;
* meaningful status text in addition to color;
* screen-reader-compatible status updates;
* clear validation messages;
* minimal required manual entry;
* automatic historical lookup;
* visible assessment freshness;
* clear distinction between live results and simulations.

---

## 30. Version 2.0 Proposed Services

Potential new files include:

```text
src/types/OperationalAssessment.ts
src/types/OperationalPillarScores.ts
src/types/OperationalTrigger.ts
src/types/OperationalTriggerResult.ts
src/types/OperationalRecommendation.ts
src/types/OperationalRiskDirection.ts

src/config/operationalTriggers.ts
src/config/interventions.ts

src/services/OperationalAssessmentService.ts
src/services/OperationalPillarService.ts
src/services/OperationalTriggerService.ts
src/services/OperationalRiskService.ts
src/services/OperationalRecommendationService.ts
```

These files should not be created until the corresponding interfaces and rules are approved.

---

## 31. Proposed Development Sequence

### Milestone 1 — Approve the Design Specification

* confirm operational philosophy;
* confirm operational states;
* confirm pillar definitions;
* define initial trigger concepts;
* identify required configuration.

### Milestone 2 — Create the Operational Assessment Types

* define the authoritative `OperationalAssessment`;
* define pillar-score types;
* define trigger-result types;
* define recommendation types;
* define risk and confidence types.

### Milestone 3 — Build the Pillar Service

* calculate Operational Demand;
* calculate Clinical Complexity;
* calculate Hospital Throughput;
* calculate Operational Momentum.

### Milestone 4 — Build the Trigger Engine

* create configurable rules;
* evaluate each rule;
* return active triggers;
* apply minimum-state gates.

### Milestone 5 — Build the Operational Assessment Service

* combine score;
* combine pillars;
* apply triggers;
* assign final state;
* assign risk;
* assign confidence;
* generate recommendations.

### Milestone 6 — Update Dashboard Components

* display final operational state;
* display pillar scores;
* display active triggers;
* display risk direction;
* display confidence;
* display prioritized actions.

### Milestone 7 — Calibrate With Scenarios

* run the scenario library;
* compare expected and actual outputs;
* revise formulas and triggers;
* document all changes.

### Milestone 8 — Retrospective Validation

* analyze historical assessments;
* evaluate score and state distribution;
* compare with operational outcomes;
* identify recalibration needs.

---

## 32. Decisions Requiring Operational Review

The following decisions remain open:

1. What conditions should automatically trigger High Surge?
2. What boarding threshold represents a crisis rather than routine baseline boarding?
3. Should trigger thresholds use absolute values, historical variance, or both?
4. How should hospital occupancy interact with boarding?
5. How many consecutive worsening assessments should activate a momentum trigger?
6. What reassessment interval should apply to each state?
7. What actions belong to each surge tier?
8. Should Critical Operations remain a separate state above Severe Surge?
9. Should ESI totals be required to equal total ED volume?
10. What minimum historical-data quality is required for high confidence?
11. Which operational outcomes should be used for retrospective validation?
12. Which users may import historical data or change trigger configuration?

---

## 33. Initial Version 2.0 Success Criteria

EDORI 2.0 will be considered ready for structured pilot evaluation when:

* the production build contains no TypeScript errors;
* dashboard components use one authoritative operational assessment;
* each pillar is independently explainable;
* active triggers identify the condition that activated them;
* trigger rules are configurable;
* recommendations are linked to drivers or triggers;
* the final state may be elevated by defined operational gates;
* history persists without duplication;
* historical data are validated before use;
* simulation does not modify live operational state;
* scenario tests cover routine through critical conditions;
* all scoring and trigger rules are documented;
* governance and operational review have occurred.

---

## 34. Current Status

The EDORI 1.0 foundation currently includes:

* TypeScript and Vite application;
* centralized `EdoriEngine`;
* pure `EdoriService`;
* centralized validation;
* automatic date and hour selection;
* historical expectation lookup;
* CSV parsing and validation;
* imported historical-data persistence;
* current assessment persistence;
* result persistence;
* snapshot and trend persistence;
* dashboard status display;
* summary cards;
* gauge;
* drivers;
* recommendations;
* trend chart;
* assessment history;
* scenario-testing framework.

The next implementation milestone is the definition of the EDORI 2.0 operational types and trigger model.

---

## 35. Change-Control Principle

Future algorithm or trigger changes should include:

1. a documented rationale;
2. a corresponding code change;
3. updated scenario expectations;
4. successful production build;
5. review of affected operational states;
6. a version-control commit;
7. an update to this specification.

No scoring or trigger threshold should be changed without documenting why it changed.
