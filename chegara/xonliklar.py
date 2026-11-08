# Fixes the Central Asian khanates in the border snapshots 1530-1914.
# The source (historical-basemaps) mislabels them there (e.g. "Khiva Khanate" covers Bukhara and Samarkand),
# so those features are dropped and replaced by hand-drawn, approximate outlines made for this site.
# Run from this folder after re-simplifying the source files: python3 xonliklar.py
import json

BUX_XON = [(62.6,39.6),(63.0,40.6),(64.5,41.6),(66.5,41.0),(68.2,40.7),(69.0,40.0),(68.9,39.3),(70.0,38.9),(70.3,38.3),(69.6,37.6),(69.0,37.1),(67.5,36.6),(66.9,36.3),(65.5,36.4),(64.5,37.1),(63.5,38.7)]
BUX_AMIR = [(62.6,39.6),(63.0,40.6),(64.5,41.6),(66.5,41.0),(68.2,40.7),(69.0,40.0),(68.9,39.3),(70.0,38.9),(70.3,38.3),(69.6,37.6),(68.3,37.1),(67.3,37.2),(66.3,37.4),(65.3,37.6),(64.0,38.6),(63.3,39.1)]
# after 1868: Samarkand, Kattaqo'rg'on and Jizzax go to Russia; Eastern Bukhara (Hisor, Kulob, Darvoz, Qorategin, later Shug'non) is added
BUX_PROT = [(62.6,39.6),(63.2,40.4),(64.3,40.9),(65.6,40.3),(66.2,39.5),(67.0,39.0),(68.0,39.1),(69.0,39.0),(70.5,39.2),(71.6,38.9),(72.4,38.4),(73.5,37.6),(72.6,37.0),(71.5,36.8),(70.5,37.4),(69.5,37.1),(68.3,37.1),(67.3,37.2),(66.3,37.4),(65.3,37.6),(64.0,38.6),(63.3,39.1)]
XIVA = [(57.2,43.4),(58.3,43.8),(60.0,43.6),(61.3,42.6),(62.0,41.4),(61.4,40.6),(60.2,40.3),(58.5,39.9),(57.3,40.4),(56.4,41.4),(56.9,42.4)]
# after 1873 (Gandimiyon treaty): the right bank of the Amudaryo goes to Russia
XIVA_PROT = [(57.2,43.4),(58.3,43.8),(59.3,43.2),(59.9,42.5),(60.6,41.9),(61.3,41.1),(61.4,40.7),(60.2,40.3),(58.5,39.9),(57.3,40.4),(56.4,41.4),(56.9,42.4)]
QOQON_SMALL = [(69.5,40.3),(70.5,41.3),(71.5,41.6),(73.0,41.6),(73.8,41.0),(73.5,40.0),(72.0,39.6),(70.5,39.8)]
QOQON_BIG = [(65.3,45.2),(66.5,45.0),(68.5,44.0),(70.5,43.5),(72.5,43.2),(75.5,43.0),(76.5,42.3),(75.5,41.0),(74.5,40.0),(73.5,39.3),(71.5,39.5),(70.0,39.8),(69.2,40.3),(68.6,40.9),(67.8,41.5),(66.5,43.0),(65.2,44.4)]

ADD = {
  1530: [("Buxoro xonligi",BUX_XON),("Xiva xonligi",XIVA)],
  1600: [("Buxoro xonligi",BUX_XON),("Xiva xonligi",XIVA)],
  1650: [("Buxoro xonligi",BUX_XON),("Xiva xonligi",XIVA)],
  1700: [("Buxoro xonligi",BUX_XON),("Xiva xonligi",XIVA)],
  1715: [("Buxoro xonligi",BUX_XON),("Xiva xonligi",XIVA),("Qo'qon xonligi",QOQON_SMALL)],
  1783: [("Buxoro amirligi",BUX_AMIR),("Xiva xonligi",XIVA),("Qo'qon xonligi",QOQON_SMALL)],
  1800: [("Buxoro amirligi",BUX_AMIR),("Xiva xonligi",XIVA),("Qo'qon xonligi",QOQON_SMALL)],
  1815: [("Buxoro amirligi",BUX_AMIR),("Xiva xonligi",XIVA),("Qo'qon xonligi",QOQON_BIG)],
  1880: [("Buxoro amirligi",BUX_PROT),("Xiva xonligi",XIVA_PROT)],
  1900: [("Buxoro amirligi",BUX_PROT),("Xiva xonligi",XIVA_PROT)],
  1914: [("Buxoro amirligi",BUX_PROT),("Xiva xonligi",XIVA_PROT)],
}
DROP = {"Khiva Khanate","Bukara Khanate","Bokhara Khanate","Turan","central Asian khanates"}

def touches_ca(g):
    def pts(c):
        if isinstance(c[0],(int,float)): yield c
        else:
            for x in c: yield from pts(x)
    return any(55<p[0]<78 and 35<p[1]<46 for p in pts(g["coordinates"]))

for y, adds in ADD.items():
    fn = f"{y}.json"; d = json.load(open(fn))
    d["features"] = [f for f in d["features"] if not (f["properties"]["NAME"] in DROP and f["geometry"] and touches_ca(f["geometry"])) and not f["properties"].get("fix")]
    for n, ring in adds:
        ring = [list(p) for p in ring] + [list(ring[0])]
        d["features"].append({"type":"Feature","properties":{"NAME":n,"fix":1},"geometry":{"type":"Polygon","coordinates":[ring]}})
    json.dump(d, open(fn,"w"), separators=(",",":"))
    print(y, len(d["features"]))
