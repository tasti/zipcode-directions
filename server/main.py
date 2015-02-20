from flask import Flask, render_template, request, jsonify
from directions import get_directions_list

app = Flask(__name__)

@app.route('/')
def index():
  return render_template('index.html')

@app.route('/api/v1/geojson')
def get_directions():
  params = ['latA', 'lngA', 'latB', 'lngB']
  if any([(param not in request.args) for param in params]):
    return jsonify({ 'success': False, 'message': 'all arguments not specified.' })

  locationA = { 'lat': float(request.args['latA']), 'lng': float(request.args['lngA']) }
  locationB = { 'lat': float(request.args['latB']), 'lng': float(request.args['lngB']) }

  directions_list = get_directions_list(locationA, locationB)

  return jsonify({ 'success': True, 'type': 'FeatureCollection', 'features': directions_list })

if __name__ == '__main__':
  app.run(debug=True)
