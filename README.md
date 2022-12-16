# Web Interface for Angular Overlap Model Calculations
The purpose of this project is to create an accesible computational package to run angular overlap model calculations. This model is of particlar interest for research and teaching purposes within inorganic chemistry. An accompanying problem set is included in the website. More information can be found [here](https://github.com/jack-thomascolwell/senior-comps-paper).

## Instructions

## Code Architecture
The code follows a standard Django application layout with all related files in the ```server``` folder. Certain source files that are only run once are stored in ```source```. A detailed file tree with descriptions is below.
```
/
│   README.md
│   requirements.txt            Package requirements
│   Procfile                    Required for hosting on Heroku
|   runtime.txt                 Required for hosting on Heroku
│
└───server                      The Django server
│   │   
|   └───static
|   |   |   favicon.ico         The server's favicon
│   │
│   └───server                  Django configuration
│       │   urls.py             Django root url configuration
│       │   ...
│   └───aom                     AOM application
│       └───migrations          Generated database migrations
│       └───static/aom          Static CSS/JS/image files
│       |   |   └───css         Static CSS files generated from SCSS in /source/scss
│       |   |   orbitals.json   Pre-compiled orbital boundary surfaces
│       └───templates/aom       HTML templates for calculator and tutorial pages
│       │   admin.py            Allows Django admin portal to modify preset ligands
│       │   calculations.py     Module to perform AOM related calculations
│       │   models.py           Django model for preset ligands
│       │   urls.py             Django url configuration
│       │   views.py            Code to serve templates and AOM calculations
|   ...
└───source                      Pre-compiled SCSS and Mathematica files
    └───scss                    Source SCSS files for server
    │   orbitals.nb             Mathematica notebook to compute orbital boundary surfaces as 3D meshes
```

All of the webapp is contained within the ```server``` folder with the majority of relevant code in the ```server/aom``` folder. All AOM calculations are performed by the ```server/aom/calculations.py``` module. Most of the front-end code is contained within the ```server/aom/static/aom/calculations.js``` module. The interactive molecule visualizer and plots have been abstracted into their own files.

All of the CSS is compiled from SCSS source files located in ```source/scss```. This pre-compilation avoids complicated Django middleware.

Generating the orbital boundary surfaces requires solving complex systems of wavefunction integrals. This takes a significant amount of time and is done in advance by the Mathematica script ```source/orbitals.nb```. These surfaces have been generated and saved to ```server/aom/static/aom/orbitals.json```.
