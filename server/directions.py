import fiona
from shapely.geometry import shape, LineString

source = fiona.open('data/cb_2013_us_zcta510_500k.shp')

def _get_boundary(pointA, pointB):
  minx = min(pointA['lng'], pointB['lng'])
  miny = min(pointA['lat'], pointB['lat'])
  maxx = max(pointA['lng'], pointB['lng'])
  maxy = max(pointA['lat'], pointB['lat'])

  return (minx, miny, maxx, maxy)

def get_directions_list(locationA, locationB):
  directions_list = []

  # Line connecting locationA to locationB
  path = LineString([(locationA['lng'], locationA['lat']), (locationB['lng'], locationB['lat'])])
  
  # Check zipcodes within the boundary of the two points
  boundary = _get_boundary(locationA, locationB)
  for polygon in source.filter(bbox=boundary):
    shp_polygon = shape(polygon['geometry'])

    if path.intersects(shp_polygon):
      # Add the center of the polygon as a property
      center_point = shp_polygon.centroid
      polygon['properties']['LAT_CENTER'] = center_point.y
      polygon['properties']['LNG_CENTER'] = center_point.x

      directions_list.append(polygon)

  return directions_list
