# Web Interface for Angular Overlap Model Calculations
The purpose of this project is to create an accesible computational package to run angular overlap model calculations. This model is of particlar interest for research and teaching purposes within inorganic chemistry. An accompanying problem set is included in the website. More information can be found [here](https://github.com/jack-thomascolwell/senior-comps-paper).

## Instructions

### Webapp
This webapp uses a Django backend and (mostly) vanila ES6 front-end. It was written in Python 3.9.13 using Django 4.1.3. All calculations are performed via NumPy 1.23.4. The app is configured to use a PostgreSQL 15 database to store preset ligands; however, it can be easily configured to any Django-supported database. A detailed list of packages and versions are listed in ```requirements.txt```.

The webapp can be run via the ```server/manage.py``` file. The following command will start the server:
```
python server/manage.py runserver
```

The main calculator can be accessed from the root of the webapp. By default, this will be at [http://127.0.0.1:8000/](http://127.0.0.1:8000/). The Django admin portal is useful for database management and accesible at ```/admin```.

#### Live Demo
A live demo is available at [http://aom.herokuapp.com/](http://aom.herokuapp.com/). Detailed instructions on how to use the app can be found on the homepage or at [http://aom.herokuapp.com/aom/tutorial](http://aom.herokuapp.com/aom/tutorial).

### Pre-processing
To avoid unessesary Django middleware, all SCSS is precompiled to CSS. These files use SCSS 1.45.0 and compiled using dart2js 2.15.0. Detailed installation instructions for SCSS are [here](https://sass-lang.com/install). To compile all SCSS files, run the following command:
```
sass --watch source/scss:server/aom/static/aom/css
```

The orbital boundary surfaces require far too much time to compute on the fly. As such, they are computed and meshed via the Mathematica script ```orbitals.nb```. This script was written in Mathematica 12.3.1.0 and the results are stored in ```server/aom/static/aom/orbitals.json```. The current version of the script will take a significant amount of time to compile and will likely return math errors. These are not an issue but simply a result of meshing a non-continuous surface in Mathematica and should not be a source of concern.

### Installation
A working installation of Python3 is required and can be found [here](https://www.python.org/downloads/). Pip is used to install the project requiremenets and can be found [here](https://pypi.org/project/pip/). To isolate your pip packages, it is recomended that you install a Python virual environment. I use and recommend ```virtualenv``` and ```virutalenvwrapper``` which can be installed from [here](https://virtualenv.pypa.io/en/latest/installation.html) and [here](https://pypi.org/project/virtualenvwrapper/). Once installed, run the following commands to create your virtual enviroment and install the packages:
```
mkvirtualenv my_django_env
workon my_django_env
pip -r requirements.txt
```

A Postgres database must be running in order for the server to function. The database name and credentials must be entered in the ```server/server/settings.py``` file under the DATABASED variable prior to starting the server. To configure the database, run the following commands:
```
python server/manage.py migrate
```
You will need to create a superuser in order to access the database which can be done via the following command:
```
python server/manage.py createsuperuser
```

Django uses preprocessing to gather all static files into one location. This must be done prior to running the server via the following command:
```
python server/manage.py collectstatic
```

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
 
The ```Procfile``` and ```runtime.txt``` files are required by Heroku for hosting the live demo.

All of the CSS is compiled from SCSS source files located in ```source/scss```. This pre-compilation avoids complicated Django middleware.

Generating the orbital boundary surfaces requires solving complex systems of wavefunction integrals. This takes a significant amount of time and is done in advance by the Mathematica script ```source/orbitals.nb```. These surfaces have been generated and saved to ```server/aom/static/aom/orbitals.json```.
