export interface EDInput {
    dayOfWeek: string;
    hour: number;

    occupiedBeds: number;
    hallwayPatients: number;
    waitingRoomPatients: number;
    boardedPatients: number;

    occupiedMedicalBeds: number;

    currentRN: number;
    currentMD: number;

    esi1: number;
    esi2: number;
    esi3: number;
    esi4: number;
    esi5: number;
}