import { supabase } from "@/integrations/supabase/client";

// Generate mock computers
const generateComputers = () => {
  const locations = ["iCentre1", "iCentre2"];
  const computers = [];
  
  // Generate 80 computers (40 per location)
  for (let i = 1; i <= 80; i++) {
    const computerNumber = i.toString().padStart(3, '0');
    const locationIndex = i <= 40 ? 0 : 1;
    const location = locations[locationIndex];
    
    computers.push({
      name: `PC-${computerNumber}`,
      location,
      status: "available",
      specs: {
        cpu: "Intel i5",
        ram: "16GB",
        storage: "512GB SSD",
        os: "Windows 11"
      },
      description: `Computer ${computerNumber} in ${location}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  return computers;
};

// Generate mock reservations
const generateReservations = (computerIds: number[], userIds: string[]) => {
  const reservations = [];
  const now = new Date();
  
  // Create some active reservations
  for (let i = 0; i < 5; i++) {
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 2); // 2 hours from now
    
    reservations.push({
      computer_id: computerIds[i],
      user_id: userIds[0], // Using first user for all reservations
      reserved_at: now.toISOString(),
      end_time: endTime.toISOString(),
      status: "active",
      notes: "Regular reservation",
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    });
  }
  
  return reservations;
};

// Main function to populate the database
export const populateDatabase = async () => {
  try {
    console.log("Starting database population...");
    
    // Insert computers
    const computers = generateComputers();
    const { data: insertedComputers, error: computersError } = await supabase
      .from('computers')
      .insert(computers)
      .select();
      
    if (computersError) {
      throw new Error(`Error inserting computers: ${computersError.message}`);
    }
    
    console.log(`Successfully inserted ${insertedComputers.length} computers`);
    
    // Get some user IDs from the registered table
    const { data: users, error: usersError } = await supabase
      .from('registered')
      .select('id')
      .limit(5);
      
    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }
    
    if (!users || users.length === 0) {
      console.log("No users found in the database. Please create users first.");
      return;
    }
    
    // Generate and insert reservations
    const computerIds = insertedComputers.map(c => c.id);
    const userIds = users.map(u => u.id);
    const reservations = generateReservations(computerIds, userIds);
    
    const { error: reservationsError } = await supabase
      .from('reservations')
      .insert(reservations);
      
    if (reservationsError) {
      throw new Error(`Error inserting reservations: ${reservationsError.message}`);
    }
    
    console.log(`Successfully inserted ${reservations.length} reservations`);
    console.log("Database population completed successfully!");
    
  } catch (error) {
    console.error("Error populating database:", error);
  }
}; 