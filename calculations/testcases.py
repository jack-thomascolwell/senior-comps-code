import numpy as np
import aom

# # General Positions
# positions = [[],
# [0,0,1], #1
# [1,0,0], #2
# [0,1,0], #3
# [-1,0,0], #4
# [0,-1,0], #5
# [0,0,-1], #6
# [1,1,1], #7
# [-1,-1,1], #8
# [-1,1,-1], #9
# [1,-1,-1], #10
# [-1, np.sqrt(3), 0], #11
# [-1, -np.sqrt(3), 0]] #12
#
# np.set_printoptions(suppress=True)
# np.set_printoptions(precision=3)
#
# for i in range(12):
#     ligand = positions[i+1]
#     sigma = aom.sigmaMatrix(ligand)
#     pi = aom.piXMatrix(ligand) + aom.piYMatrix(ligand)
#     print(ligand)
#     print("(Theta, Phi, Psi) = ", aom.theta(ligand), aom.phi(ligand), aom.psi(ligand))
#     print("Diagonalized Sigma Matrix: ",np.diag(sigma))
#     print("Diagonalized Pi Matrix: ",np.diag(pi))
#     print()
#
# # Octahedral
# sigma = np.zeros((5,5))
# pi = np.zeros((5,5))
# for i in [1,2,3,4,5,6]:
#     sigma+=aom.sigmaMatrix(positions[i])
#     pi+=aom.piXMatrix(positions[i])+aom.piYMatrix(positions[i])
# print("Octahedral")
# print("Diagonalized Sigma Matrix: ",np.diag(sigma))
# print("Diagonalized Pi Matrix: ",np.diag(pi))
# print()
#
# # Tetrahedral
# sigma = np.zeros((5,5))
# pi = np.zeros((5,5))
# for i in [7,8,9,10]:
#     sigma+=aom.sigmaMatrix(positions[i])
#     pi+=aom.piXMatrix(positions[i])+aom.piYMatrix(positions[i])
# print("Tetrahedral")
# print("Diagonalized Sigma Matrix: ",np.diag(sigma))
# print("Diagonalized Pi Matrix: ",np.diag(pi))
# print()
#
# # Square Planar
# sigma = np.zeros((5,5))
# pi = np.zeros((5,5))
# for i in [2,3,4,5]:
#     sigma+=aom.sigmaMatrix(positions[i])
#     pi+=aom.piXMatrix(positions[i])+aom.piYMatrix(positions[i])
# print("Octahedral")
# print("Diagonalized Sigma Matrix: ",np.diag(sigma))
# print("Diagonalized Pi Matrix: ",np.diag(pi))
# print()

# Square Planar rotated
ligands = [
[1,1,0],
[-1,1,0],
[-1,-1,0],
[1,-1,0]
];
sigma, sigmaEnergies = aom.sigma(ligands);
pi, piEnergies = aom.pi(ligands);
print("Diagonalized Sigma Matrix: ",sigmaEnergies)
print("Diagonalized Pi Matrix: ",piEnergies)

ligands = [
[1,0,0],
[0,1,0],
[-1,0,0],
[0,-1,0]
];
sigma, sigmaEnergies = aom.sigma(ligands);
pi, piEnergies = aom.pi(ligands);
print("Diagonalized Sigma Matrix: ",sigmaEnergies)
print("Diagonalized Pi Matrix: ",piEnergies)

oh = [
[0,0,1],
[1,0,0],
[0,1,0],
[-1,0,0],
[0,-1,0],
[0,0,-1]
]
print(aom.sigma(oh))
print(aom.pi(oh))
