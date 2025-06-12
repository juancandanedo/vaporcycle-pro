// frontend/src/App.js (Versión Fase 6 - Tiempo Real)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import PhDiagram from './PhDiagram';
import useDebounce from './useDebounce'; // Importamos nuestro hook
import ParameterSlider from './ParameterSlider'; // Importamos nuestro slider

function App() {
  const [inputs, setInputs] = useState({
    refrigerant: 'R134a',
    t_evap: -10,
    t_cond: 40,
    superheat: 5,
    subcooling: 5,
    comp_eff: 0.75,
  });
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Usamos nuestro hook para "retrasar" la actualización de los inputs
  // La API solo se llamará con este valor debounced
  const debouncedInputs = useDebounce(inputs, 300); // 300ms de retraso

  // Esta función se ejecutará CADA VEZ que el valor DEBOUNCED cambie
  useEffect(() => {
    const calculate = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.post('http://127.0.0.1:5000/calculate', debouncedInputs);
        setResults(response.data);
      } catch (err) {
        setError('Error al calcular.');
        console.error(err);
      }
      setLoading(false);
    };

    calculate();
  }, [debouncedInputs]); // La dependencia es el valor debounced

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prevInputs => ({
      ...prevInputs,
      [name]: parseFloat(value) // Convertimos el valor del slider a número
    }));
  };

  const handleSelectChange = (e) => {
    setInputs(prevInputs => ({
      ...prevInputs,
      refrigerant: e.target.value
    }));
  };
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>VaporCycle Pro</h1>
      </header>
      <main className="main-container">
        <div className="panel input-panel">
          <h2>Parámetros de Entrada</h2>
          {/* Ya no necesitamos el <form> ni el botón "Calcular" */}
          <div className="form-group">
            <label>Refrigerante:</label>
            <select name="refrigerant" value={inputs.refrigerant} onChange={handleSelectChange}>
              <option value="R134a">R-134a</option>
              <option value="R22">R-22</option>
              <option value="R410A">R-410A</option>
              <option value="R717">Amoniaco (R-717)</option>
            </select>
          </div>

          <ParameterSlider label="Temp. Evaporación" unit="°C"
            name="t_evap" value={inputs.t_evap} min={-40} max={10} step={0.5}
            onChange={handleInputChange} />

          <ParameterSlider label="Temp. Condensación" unit="°C"
            name="t_cond" value={inputs.t_cond} min={20} max={60} step={0.5}
            onChange={handleInputChange} />
          
          <hr />
          <h4>Parámetros del Ciclo Real</h4>

          <ParameterSlider label="Sobrecalentamiento" unit="°C"
            name="superheat" value={inputs.superheat} min={0} max={20} step={0.5}
            onChange={handleInputChange} />

          <ParameterSlider label="Subenfriamiento" unit="°C"
            name="subcooling" value={inputs.subcooling} min={0} max={15} step={0.5}
            onChange={handleInputChange} />

          <ParameterSlider label="Eficiencia Compresor" unit="%"
            name="comp_eff" value={inputs.comp_eff * 100} min={50} max={100} step={1}
            onChange={(e) => setInputs({...inputs, comp_eff: parseFloat(e.target.value) / 100})} />

        </div>

        <div className="panel diagram-panel">
          <h2>Diagrama P-h</h2>
          <div style={{ position: 'relative' }}>
            {loading && <div className="loading-overlay">Calculando...</div>}
            <PhDiagram 
              idealCycleData={results && results.ideal ? results.ideal.points : null}
              realCycleData={results && results.real ? results.real.points : null}
              domeData={results ? results.saturation_dome : null}
            />
          </div>
        </div>

        <div className="panel results-panel">
          <h2>Resultados</h2>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {results && results.ideal && results.real && (
            <div>
              <h4>Rendimiento Comparativo</h4>
              <p><strong>COP (Ideal):</strong> {results.ideal.performance.cop.toFixed(3)}</p>
              <p><strong>COP (Real):</strong> {results.real.performance.cop.toFixed(3)}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;