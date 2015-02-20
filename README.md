zipcode-directions
===

Part 1:
---

Given shape data for all zipcode areas in the US, find the list of zipcodes that the shortest line connecting '580 California St San Francisco CA 94104' and '3333 Coyote Hill Rd, Palo Alto, CA 94304' passes through.

Make a simple web page that will display the points themselves, the line connecting them and all the zipcode areas along the way on a map.

Part 2:
---

Show the same information for any two addresses entered by the user.

Part 3 (optional):
---

Use driving directions from one address to the other instead of shortest distance.

Resources:
---

- Zipcode Data: https://www.census.gov/geo/maps-data/data/cbf/cbf_zcta.html
- Python lib to read shapefiles: https://pypi.python.org/pypi/Fiona. There are similar libraries available in most other languages.

Setup
===

The setup instructions are meant for an OS X operating system. You should already have `python` and `pip` installed.

Simply run the following commands.

GDAL
---

GDAL/OGR dependency

```
  $ brew install gdal
```

virtualenv
---

If you don't already have virtualenv installed, run:

```
  $ pip install virtualenv
```

server
---

In the `server/` directory, run:

```
  $ virtualenv venv
  $ . venv/bin/activate
```

Load the dependencies by running:

```
  $ pip install -r requirements.txt -t lib/
```

Start the server by running:

```
  $ python main.py
```

Navigate to `localhost:5000`.
