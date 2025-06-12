import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import PhDiagram from './PhDiagram';

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

  const handleInputChange = (event) => {
    setInputs({
      ...inputs,
      [event.target.name]: event.target.value,
    });
  };
  
  const handleCompEffChange = (event) => {
    const value = event.target.value;
    if (!isNaN(value) && value !== "") {
      setInputs({ ...inputs, comp_eff: parseFloat(value) / 100 });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const response = await axios.post('http://127.0.0.1:5000/calculate', inputs);
      setResults(response.data);
    } catch (err) {
      setError('Error al calcular. Verifique los parámetros y que el servidor backend esté corriendo.');
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>VaporCycle Pro</h1>
      </header>
      <main className="main-container">
        <div className="panel input-panel">
          <h2>Parámetros de Entrada</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Refrigerante:</label>
              <select name="refrigerant" value={inputs.refrigerant} onChange={handleInputChange}>
                <option value="R134a">R-134a</option>
                <option value="R22">R-22</option>
                <option value="R410A">R-410A</option>
                <option value="R717">Amoniaco (R-717)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Temp. Evaporación (°C):</label>
              <input type="number" name="t_evap" value={inputs.t_evap} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Temp. Condensación (°C):</label>
              <input type="number" name="t_cond" value={inputs.t_cond} onChange={handleInputChange} />
            </div>
            
            <hr />
            <h4>Parámetros del Ciclo Real</h4>
            <div className="form-group">
              <label>Sobrecalentamiento (°C):</label>
              <input type="number" name="superheat" value={inputs.superheat} step="0.5" onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Subenfriamiento (°C):</label>
              <input type="number" name="subcooling" value={inputs.subcooling} step="0.5" onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Eficiencia Compresor (%):</label>
              <input type="number" name="comp_eff" value={inputs.comp_eff * 100} step="1" onChange={handleCompEffChange} />
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Calculando...' : 'Calcular'}
            </button>
          </form>
        </div>

        <div className="panel diagram-panel">
          <h2>Diagrama P-h</h2>
          <PhDiagram 
            idealCycleData={results && results.ideal ? results.ideal.points : null}
            realCycleData={results && results.real ? results.real.points : null}
            domeData={results ? results.saturation_dome : null}
          />
        </div>

        <div className="panel results-panel">
          <h2>Resultados</h2>
          {loading && <p>Calculando...</p>}
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