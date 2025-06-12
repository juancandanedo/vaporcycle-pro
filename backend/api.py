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

        t_evap_k = t_evap_c + 273.15
        t_cond_k = t_cond_c + 273.15

        saturation_dome = get_saturation_dome(refrigerant)

        p_evap = PropsSI('P', 'T', t_evap_k, 'Q', 1, refrigerant)
        p_cond = PropsSI('P', 'T', t_cond_k, 'Q', 0, refrigerant)
        
        h1 = PropsSI('H', 'T', t_evap_k, 'Q', 1, refrigerant)
        s1 = PropsSI('S', 'T', t_evap_k, 'Q', 1, refrigerant)
        h2 = PropsSI('H', 'P', p_cond, 'S', s1, refrigerant)
        h3 = PropsSI('H', 'T', t_cond_k, 'Q', 0, refrigerant)
        h4 = h3
        
        qe = h1 - h4
        wc = h2 - h1
        cop = qe / wc if wc > 0 else 0

        results = {
            'points': [
                {'p': p_evap, 'h': h1},
                {'p': p_cond, 'h': h2},
                {'p': p_cond, 'h': h3},
                {'p': p_evap, 'h': h4},
            ],
            'performance': {
                'cop': cop,
            },
            'saturation_dome': saturation_dome
        }
        return jsonify(results)

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)