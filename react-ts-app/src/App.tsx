import React from 'react';
import { ComputerProvider } from './context/ComputerContext';
import ExampleComponent from './components/ExampleComponent';

const App = () => {
  return (
    <ComputerProvider>
      <div>
        <h1>Computer Reservation System</h1>
        <ExampleComponent />
      </div>
    </ComputerProvider>
  );
};

export default App;