import fiona
from shapely.geometry import shape, LineString

source = fiona.open('data/cb_2013_us_zcta510_500k.shp')

def get_directions_list(pointA, pointB):
  directions_list = []

  # Line connecting pointA to pointB
  path = LineString([(pointA.x, pointA.y), (pointB.x, pointB.y)])
  
  # Check zipcodes within the boundary of the path
  for polygon in source.filter(bbox=path.bounds):
    shp_polygon = shape(polygon['geometry'])

    if path.intersects(shp_polygon):
      # Add a point in the polygon as a property
      point_in_polygon = shp_polygon.representative_point()
      polygon['properties']['LNG_POINT'] = point_in_polygon.x
      polygon['properties']['LAT_POINT'] = point_in_polygon.y

      directions_list.append(polygon)

  return directions_list
