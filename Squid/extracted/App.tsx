import React, { useState } from 'react';
import SimulationCanvas from './components/SimulationCanvas';
import Controls from './components/Controls';
import { DEFAULT_SETTINGS } from './constants';
import { SimulationSettings, SimulationMode } from './types';

const App: React.FC = () => {
  const [settings, setSettings] = useState<SimulationSettings>(DEFAULT_SETTINGS);
  const [mode, setMode] = useState<SimulationMode>(SimulationMode.LISTENING);

  const handleSettingChange = (key: keyof SimulationSettings, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans">
      <SimulationCanvas settings={settings} mode={mode} />

      <Controls 
        settings={settings} 
        mode={mode}
        onSettingChange={handleSettingChange}
        onModeChange={setMode}
      />
    </div>
  );
};

export default App;