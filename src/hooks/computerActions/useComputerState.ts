
import { useState, useEffect } from "react";
import { Computer } from "@/types";

export const useComputerState = (initialComputers?: Computer[]) => {
  const [computers, setComputers] = useState<Computer[]>(initialComputers || []);

  // Update when initialComputers changes (from database)
  useEffect(() => {
    if (initialComputers) {
      setComputers(initialComputers);
    }
  }, [initialComputers]);

  return { computers, setComputers };
};
