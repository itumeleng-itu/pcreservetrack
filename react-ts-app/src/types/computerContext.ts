interface Computer {
  id: string;
  name: string;
  status: 'available' | 'reserved' | 'faulty';
}

interface ComputerContextType {
  computers: Computer[];
  reserveComputer: (id: string) => void;
  releaseComputer: (id: string) => void;
  reportFault: (id: string) => void;
  fixComputer: (id: string) => void;
  getAvailableComputers: () => Computer[];
  getReservedComputers: () => Computer[];
  getFaultyComputers: () => Computer[];
  hasActiveReservation: () => boolean;
  isComputerAlreadyReserved: (id: string) => boolean;
  updateComputersFromTracking: (updatedComputers: Computer[]) => void;
}