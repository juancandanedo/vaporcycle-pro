# backend/api.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from CoolProp.CoolProp import PropsSI

app = Flask(__name__)
CORS(app) # Permite solicitudes desde cualquier origen (para desarrollo)

@app.route('/calculate', methods=['POST'])
def calculate_cycle():
    try:
        data = request.json
        refrigerant = data['refrigerant']
        t_evap_c = float(data['t_evap'])
        t_cond_c = float(data['t_cond'])

        # Convertir temperaturas a Kelvin para CoolProp
        t_evap_k = t_evap_c + 273.15
        t_cond_k = t_cond_c + 273.15

        # --- Ciclo Ideal ---
        p_evap = PropsSI('P', 'T', t_evap_k, 'Q', 1, refrigerant)
        p_cond = PropsSI('P', 'T', t_cond_k, 'Q', 0, refrigerant)

        # Punto 1: Salida del evaporador (Vapor Saturado)
        h1 = PropsSI('H', 'T', t_evap_k, 'Q', 1, refrigerant)
        s1 = PropsSI('S', 'T', t_evap_k, 'Q', 1, refrigerant)

        # Punto 2: Salida del compresor (Compresión Isoentrópica)
        h2 = PropsSI('H', 'P', p_cond, 'S', s1, refrigerant)
        t2 = PropsSI('T', 'P', p_cond, 'S', s1, refrigerant) - 273.15

        # Punto 3: Salida del condensador (Líquido Saturado)
        h3 = PropsSI('H', 'T', t_cond_k, 'Q', 0, refrigerant)
        s3 = PropsSI('S', 'T', t_cond_k, 'Q', 0, refrigerant)
        
        # Punto 4: Salida de la válvula de expansión (Expansión Isoentálpica)
        h4 = h3
        
        # Cálculos de rendimiento
        qe = h1 - h4  # Efecto refrigerante
        wc = h2 - h1  # Trabajo del compresor
        qc = h2 - h3  # Calor rechazado
        cop = qe / wc if wc > 0 else 0

        # Preparamos la respuesta en formato JSON
        results = {
            'points': {
                '1': {'p': p_evap, 't': t_evap_c, 'h': h1, 's': s1},
                '2': {'p': p_cond, 't': t2, 'h': h2, 's': s1},
                '3': {'p': p_cond, 't': t_cond_c, 'h': h3, 's': s3},
                '4': {'p': p_evap, 't': t_evap_c, 'h': h4, 's': None}, # Entropía no definida para mezcla
            },
            'performance': {
                'qe': qe,
                'wc': wc,
                'qc': qc,
                'cop': cop,
            }
        }
        return jsonify(results)

    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True) # El servidor se reiniciará automáticamente con los cambios