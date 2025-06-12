from flask import Flask, request, jsonify
from flask_cors import CORS
from CoolProp.CoolProp import PropsSI
import numpy as np

app = Flask(__name__)
CORS(app)

def get_saturation_dome(refrigerant):
    try:
        t_crit = PropsSI('Tcrit', refrigerant)
        t_trip = PropsSI('Ttriple', refrigerant)
        temps = np.linspace(t_trip + 1, t_crit - 0.01, 100)
        liquid_line_h = [PropsSI('H', 'T', t, 'Q', 0, refrigerant) for t in temps]
        vapor_line_h = [PropsSI('H', 'T', t, 'Q', 1, refrigerant) for t in temps]
        pressures = [PropsSI('P', 'T', t, 'Q', 0, refrigerant) for t in temps]
        dome_h = liquid_line_h + vapor_line_h[::-1]
        dome_p = pressures + pressures[::-1]
        return {'h': dome_h, 'p': dome_p}
    except Exception:
        return {'h': [], 'p': []}

@app.route('/calculate', methods=['POST'])
def calculate_cycle():
    try:
        data = request.json
        
        refrigerant = data['refrigerant']
        t_evap_c = float(data['t_evap'])
        t_cond_c = float(data['t_cond'])
        superheat_c = float(data.get('superheat', 0))
        subcooling_c = float(data.get('subcooling', 0))
        comp_eff = float(data.get('comp_eff', 1.0))

        t_evap_k = t_evap_c + 273.15
        t_cond_k = t_cond_c + 273.15

        p_evap = PropsSI('P', 'T', t_evap_k, 'Q', 1, refrigerant)
        p_cond = PropsSI('P', 'T', t_cond_k, 'Q', 0, refrigerant)

        # Ciclo Ideal
        h1_ideal = PropsSI('H', 'P', p_evap, 'Q', 1, refrigerant)
        s1_ideal = PropsSI('S', 'P', p_evap, 'Q', 1, refrigerant)
        h2_ideal = PropsSI('H', 'P', p_cond, 'S', s1_ideal, refrigerant)
        h3_ideal = PropsSI('H', 'P', p_cond, 'Q', 0, refrigerant)
        h4_ideal = h3_ideal
        cop_ideal = (h1_ideal - h4_ideal) / (h2_ideal - h1_ideal) if (h2_ideal - h1_ideal) != 0 else 0

        # Ciclo Real
        t1_real_k = t_evap_k + superheat_c
        h1_real = PropsSI('H', 'T', t1_real_k, 'P', p_evap, refrigerant)
        s1_real = PropsSI('S', 'T', t1_real_k, 'P', p_evap, refrigerant)
        
        h2_ideal_real_inlet = PropsSI('H', 'P', p_cond, 'S', s1_real, refrigerant)
        wc_ideal = h2_ideal_real_inlet - h1_real
        wc_real = wc_ideal / comp_eff if comp_eff != 0 else 0
        h2_real = h1_real + wc_real

        t3_real_k = t_cond_k - subcooling_c
        h3_real = PropsSI('H', 'T', t3_real_k, 'P', p_cond, refrigerant)
        
        h4_real = h3_real
        cop_real = (h1_real - h4_real) / wc_real if wc_real != 0 else 0

        results = {
            "ideal": {
                "points": [
                    {'p': p_evap, 'h': h1_ideal},
                    {'p': p_cond, 'h': h2_ideal},
                    {'p': p_cond, 'h': h3_ideal},
                    {'p': p_evap, 'h': h4_ideal},
                ],
                "performance": {"cop": cop_ideal}
            },
            "real": {
                "points": [
                    {'p': p_evap, 'h': h1_real},
                    {'p': p_cond, 'h': h2_real},
                    {'p': p_cond, 'h': h3_real},
                    {'p': p_evap, 'h': h4_real},
                ],
                "performance": {"cop": cop_real}
            },
            "saturation_dome": get_saturation_dome(refrigerant)
        }
        return jsonify(results)

    except Exception as e:
        return jsonify({'error': str(e)}), 400