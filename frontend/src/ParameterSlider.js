import React from 'react';

const ParameterSlider = ({ label, unit, value, min, max, step, name, onChange }) => {
  return (
    <div className="form-group slider-group">
      <label>{label}: <strong>{Number(value).toFixed(1)} {unit}</strong></label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        name={name}
        onChange={onChange}
        className="slider"
      />
    </div>
  );
};

export default ParameterSlider;