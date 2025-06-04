import { Computer, ComputerStatus, ComputerTracking } from "./index";

export interface ComputerContextType {
  computers: Computer[];
  reserveComputer: (computerId: string, startTime: Date, duration: number) => Promise<[boolean, Computer | null]>;
  releaseComputer: (computerId: string) => void;
  reportFault: (computerId: string, description: string, isEmergency: boolean) => void;
  fixComputer: (computerId: string) => void;
  getAvailableComputers: () => Computer[];
  getReservedComputers: () => Computer[];
  getFaultyComputers: () => Computer[];
  hasActiveReservation: (userId: string) => boolean;
  isComputerAlreadyReserved: (computerId: string) => boolean;
  updateComputersFromTracking: (trackingData: ComputerTracking[]) => void;
}
