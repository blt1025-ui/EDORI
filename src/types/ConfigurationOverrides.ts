/**
 * ConfigurationOverrides
 *
 * Defines administrative configuration values that
 * override the built-in EDORI configuration.
 *
 * Built-in TypeScript configuration remains the
 * authoritative fallback when no saved override
 * exists.
 */


/**
 * Hospital configuration.
 *
 * Current staffed acute-care and critical-care
 * capacities are intentionally entered with each
 * operational assessment rather than stored as
 * fixed hospital configuration values.
 */
export interface HospitalConfiguration {

    /**
     * Physical Emergency Department treatment
     * capacity used for ED occupancy calculations.
     */
    edCapacity:number;

}


/**
 * Overall Hospital Readiness domain weights.
 */
export interface DomainWeightConfiguration {

    edPressure:number;

    acuteCapacity:number;

    criticalCapacity:number;

    inflow:number;

    projectedCapacity:number;

}


/**
 * ED Operational Pressure component weights.
 */
export interface EdPressureWeightConfiguration {

    volume:number;

    boarding:number;

    acuity:number;

}


/**
 * One configurable operational-level range.
 */
export interface OperationalLevelConfiguration {

    title:
        "Alpha"
        |
        "Bravo"
        |
        "Charlie"
        |
        "Delta"
        |
        "Echo";

    minimum:number;

    maximum:number;

}


/**
 * Complete editable configuration.
 *
 * Operational triggers remain separately configured
 * and are intentionally excluded from this object.
 */
export interface ConfigurationOverrides {

    hospital:
        HospitalConfiguration;

    domainWeights:
        DomainWeightConfiguration;

    edPressureWeights:
        EdPressureWeightConfiguration;

    operationalLevels:
        OperationalLevelConfiguration[];

}


/**
 * Stored localStorage wrapper.
 *
 * Version 1 is retained for compatibility with the
 * current persistence layer.
 */
export interface StoredConfigurationOverrides {

    version:1;

    savedAt:string;

    configuration:
        ConfigurationOverrides;

}