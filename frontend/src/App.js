import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import PhDiagram from './PhDiagram';

function App() {
  const [inputs, setInputs] = useState({
    refrigerant: 'R134a',
    t_evap: -10,
    t_cond: 40,
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
            <button type="submit" disabled={loading}>
              {loading ? 'Calculando...' : 'Calcular'}
            </button>
          </form>
        </div>

        <div className="panel diagram-panel">
          <h2>Diagrama P-h</h2>
          <PhDiagram 
            cycleData={results ? results.points : null} 
            domeData={results ? results.saturation_dome : null}
          />
        </div>

        <div className="panel results-panel">
          <h2>Resultados</h2>
          {loading && <p>Calculando...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {results && (
            <div>
              <h4>Rendimiento</h4>
              <p><strong>COP:</strong> {results.performance.cop.toFixed(3)}</p>
              {/* Aquí puedes añadir más resultados si quieres */}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;