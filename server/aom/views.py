from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.templatetags.static import static
from .models import Ligand
from logging import getLogger
import base64
import re
import aom.calculations
import numpy as np
# Create your views here.
logger = getLogger('aom')

def calculator(request):
    url = static('orbitals.json');
    ligands = Ligand.objects.order_by('name')
    context = { 'ligands': ligands, 'orbitals': url }
    return render(request, 'aom/calculator.html', context)

def index(request):
    ligands = Ligand.objects.order_by('name')
    context = { 'ligands': ligands }
    return render(request, 'aom/index.html', context)

def compute(request):
    def parse(str):
        match = re.search(r'(?P<x>-?\d+\.?\d*),(?P<y>-?\d+\.?\d*),(?P<z>-?\d+\.?\d*),(?P<esigma>-?\d+\.?\d*),(?P<epi>-?\d+\.?\d*)',str)
        if (match == None):
            return None
        return { k: float(v) for k,v in match.groupdict().items() }

    start = list(filter(lambda l:l, map(parse,request.GET.getlist('start'))))
    end = list(filter(lambda l:l, map(parse,request.GET.getlist('end'))))

    start = {
        'position': np.array(list(map(lambda l: np.array([l["x"], l["y"], l["z"]]), start))),
        'esigma': np.array(list(map(lambda l: l["esigma"], start))),
        'epi': np.array(list(map(lambda l: l["epi"], start)))
    }

    end = {
        'position': np.array(list(map(lambda l: np.array([l["x"], l["y"], l["z"]]), end))),
        'esigma': np.array(list(map(lambda l: l["esigma"], end))),
        'epi': np.array(list(map(lambda l: l["epi"], end)))
    }

    steps = 20
    energies = np.zeros((steps,5))
    sigmaMatrices = np.zeros((steps,5,5))
    piMatrices = np.zeros((steps,5,5))
    sigmaEnergies = np.zeros((steps,5))
    piEnergies = np.zeros((steps,5))
    for x in range(steps):
        position = (start['position'] * (steps - x)/steps) + (end['position'] * x / steps)
        esigma = (start['esigma'] * (steps - x)/steps) + (end['esigma'] * x / steps)
        epi = (start['epi'] * (steps - x)/steps) + (end['epi'] * x / steps)

        logger.debug(f"x={x}/{steps}")
        logger.debug(f"positions={position}")
        logger.debug(f"esigma={esigma}")
        logger.debug(f"epi={epi}")

        matSigma, energySigma = aom.calculations.sigma(position, esigma)
        matPi, energyPi = aom.calculations.pi(position, epi)
        sigmaMatrices[x] = matSigma
        piMatrices[x] = matPi
        sigmaEnergies[x] = energySigma
        piEnergies[x] = energyPi
        energies[x] = np.diag(matSigma + matPi)
    logger.debug(f"energies={energies}")

    energies_str = aom.calculations.json(energies)
    sigmaMatrices_str = aom.calculations.json(sigmaMatrices)
    piMatrices_str = aom.calculations.json(piMatrices)
    sigmaEnergies_str = aom.calculations.json(sigmaEnergies)
    piEnergies_str = aom.calculations.json(piEnergies)

    return JsonResponse({
        'sigmaMatrices': sigmaMatrices_str,
        'piMatrices': piMatrices_str,
        'energies': energies_str,
        'sigmaEnergies': sigmaEnergies_str,
        'piEnergies': piEnergies_str
    });
