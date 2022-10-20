from django.shortcuts import render
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.templatetags.static import static
from .models import Ligand
from logging import getLogger
import re
import aom.calculations
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
    ligandsQuery = request.GET.values()
    positions = []
    energies = []
    e_pi = []
    logger.info(f'Recieved query: {ligandsQuery}')
    for q in ligandsQuery:
        match = re.search(r'^\s*\[(-?\d+.?\d*),(-?\d+.?\d*),(-?\d+.?\d*),(-?\d+.?\d*),(-?\d+.?\d*),(-?\d+.?\d*)\]\s*$', q)
        if (match == None):
            logger.info(f'Ivalid query string, failed on {q}')
            return HttpResponseBadRequest('Invalid query encoding')
        x,y,z,psi,e_sigma,e_pi = match.groups()
        positions.append((float(x),float(y),float(z),float(psi)))
        energies.append((float(e_sigma), float(e_pi)))

    if (not aom.calculations.validate(positions)):
        logger.info(f'Invalid ligand positions')
        return HttpResponseBadRequest('Invalid ligand positions')
    logger.info(f'Positions: {positions}')
    logger.info(f'Energies: {energies}')

    sigma_matrix, sigma_energies = aom.calculations.sigma(positions)
    pi_matrix, pi_energies = aom.calculations.pi(positions)
    logger.info(f'Sigma Matrix: {sigma_matrix} => {sigma_energies}')
    logger.info(f'Pi Matrix: {pi_matrix} => {pi_energies}')

    sigma_matrix_str = aom.calculations.json(sigma_matrix.reshape(25))
    sigma_energies_str = aom.calculations.json(sigma_energies)
    pi_matrix_str = aom.calculations.json(pi_matrix.reshape(25))
    pi_energies_str = aom.calculations.json(pi_energies)

    return JsonResponse({
        'sigmaMatrix': sigma_matrix_str,
        'sigmaEnergies': sigma_energies_str,
        'piMatrix': pi_matrix_str,
        'piEnergies': pi_energies_str,
    })
