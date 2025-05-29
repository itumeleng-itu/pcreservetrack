import { useComputers } from "@/context/ComputerContext";
import { ComputerGrid } from "../computers/ComputerGrid";

export function FaultyComputersTab() {
  const { computers } = useComputers();
  const faultyComputers = computers.filter(computer => computer.status === "faulty");

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Faulty Computers</h2>
      <ComputerGrid computers={faultyComputers} emptyMessage="No faulty computers found." />
    </div>
  );
} 