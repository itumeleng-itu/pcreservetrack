
import { Computer, ComputerStatus, ComputerTracking } from "./index";

export interface ComputerContextType {
  computers: Computer[];
  reserveComputer: (computerId: string, hours: number) => void;
  releaseComputer: (computerId: string) => void;
  reportFault: (computerId: string, description: string) => void;
  fixComputer: (computerId: string) => void;
  getAvailableComputers: () => Computer[];
  getReservedComputers: () => Computer[];
  getFaultyComputers: () => Computer[];
  hasActiveReservation: (userId: string) => boolean;
  updateComputersFromTracking: (trackingData: ComputerTracking[]) => void;
}
