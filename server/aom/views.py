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
    ligands = Ligand.objects.order_by('name')
    context = { 'ligands': ligands }
    return render(request, 'aom/calculator.html', context)

def tutorial(request):
    return render(request, 'aom/tutorial.html', {})

# Computes the AOM matrices and returns them as a JSON
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

    # Normalize vectors
    start['position'] = np.array(list(map(lambda v: v/np.linalg.norm(v), start['position'])))
    end['position'] = np.array(list(map(lambda v: v/np.linalg.norm(v), end['position'])))

    steps = 20
    energies = np.zeros((steps,5))
    sigmaMatrices = np.zeros((steps,5,5))
    piMatrices = np.zeros((steps,5,5))
    sigmaEnergies = np.zeros((steps,5))
    piEnergies = np.zeros((steps,5))
    for x in range(steps):
        f = (steps - x - 1)/(steps - 1)
        position = (start['position'] * f) + (end['position'] * (1-f))
        esigma = (start['esigma'] * f) + (end['esigma'] * (1-f))
        epi = (start['epi'] * f) + (end['epi'] * (1-f))

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
        'steps': steps,
        'sigmaMatrices': sigmaMatrices_str,
        'piMatrices': piMatrices_str,
        'energies': energies_str,
        'sigmaEnergies': sigmaEnergies_str,
        'piEnergies': piEnergies_str
    });
