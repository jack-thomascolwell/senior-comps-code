import numpy as np
import re

# Angular Overlap Model Calculations

np.set_printoptions(suppress=True)
np.set_printoptions(precision=3)

# Computes the angle between two vectors u and v
def angle(u,v):
    return np.arccos(np.dot(u,v)/np.linalg.norm(u)/np.linalg.norm(v))

# Converts from cartesian to spherical coordinates
def theta(l):
    x,y,z,*_ = l
    if (x==0 and y==0 and z==0):
         raise ValueError("Ligand cannot be at the origin")
         return None
    return angle(np.array([0,0,1]),np.array([x,y,z]))

def phi(l):
    x,y,z,*_ = l
    if (x==0 and y==0):
        return 0
    a = angle(np.array([1,0,0]),np.array([x,y,0]))
    if (y < 0):
        return np.pi * 2 - a
    return a

# Extracts ligand angle (currently not used)
def psi(l):
    if (len(l) >= 4):
        return l[3]
    return 0

# Checks that no ligands are at the origin
def validate(ligands):
    for l in  ligands:
        x,y,z,*_ = l
        if (x== 0 and y==0 and z==0):
            return False
    return True

# Computes the coordinate transformation matrix for a given ligand
def transformationMatrix(l):
    t = theta(l)
    p = phi(l)
    r = psi(l)

    return np.square(np.matrix([
    [0.25*(1+3*np.cos(2*t)),                           0,                      -0.5*np.sqrt(3)*np.sin(2*t),    0,                          0.25*np.sqrt(3)*(1-np.cos(2*t))],
    [0.5*np.sqrt(3)*np.sin(p)*np.sin(2*t),          np.cos(p)*np.cos(t),      np.sin(p)*np.cos(2*t),          -1*np.cos(p)*np.sin(t),     -0.5*np.sin(p)*np.sin(2*t)],
    [0.5*np.sqrt(3)*np.cos(p)*np.sin(2*t),          -1*np.sin(p)*np.cos(t),   np.cos(p)*np.cos(2*t),          np.sin(p)*np.sin(t),        -0.5*np.cos(p)*np.sin(2*t)],
    [0.25*np.sqrt(3)*np.sin(2*p)*(1-np.cos(2*t)),    np.cos(2*p)*np.sin(t),    0.5*np.sin(2*p)*np.sin(2*t),    np.cos(2*p)*np.cos(t),      0.25*np.sin(2*p)*(3+np.cos(2*t))],
    [0.25*np.sqrt(3)*np.cos(2*p)*(1-np.cos(2*t)),    -1*np.sin(2*p)*np.sin(t), 0.5*np.cos(2*p)*np.sin(2*t),    -1*np.sin(2*p)*np.cos(t),   0.25*np.cos(2*p)*(3+np.cos(2*t))]
    ]))

# Computes the sigma matrix for a given ligand
def sigma_matrix(l):
    transformation = transformationMatrix(l);
    return np.dot(transformation, np.array([1,0,0,0,0]))

# Computes the pix matrix for a given ligand
def pi_x_matrix(l):
    t = theta(l)
    p = phi(l)
    r = psi(l)

    fz2 = -1*np.sqrt(3)*np.sin(2*t)*np.cos(r)/2
    fyz = np.cos(p)*np.cos(t)*np.sin(r) + np.sin(p)*np.cos(2*p)*np.cos(r)
    fxz = np.cos(p)*np.cos(2*p)*np.cos(r) - np.sin(p)*np.cos(t)*np.sin(r)
    fxy = np.cos(2*p)*np.sin(t)*np.sin(r) + np.sin(2*p)*np.sin(2*t)*np.cos(r)/2
    fx2y2 = -1*np.sin(2*p)*np.sin(t)*np.sin(r) + np.cos(2*p)*np.sin(2*t)*np.cos(r)/2
    f = np.matrix([fz2, fx2y2, fxy, fxz, fyz])

    return f.transpose() * f

# Computes the piy matrix for a given ligand
def pi_y_matrix(l):
    t = theta(l)
    p = phi(l)
    r = psi(l)

    fz2 = np.sqrt(3)*np.sin(2*t)*np.sin(r)/2
    fyz = np.cos(p)*np.cos(t)*np.cos(r) - np.cos(p)*np.cos(2*p)*np.sin(r)
    fxz = -1*np.sin(p)*np.cos(t)*np.cos(r) - np.cos(p)*np.cos(2*p)*np.sin(r)
    fxy = np.cos(2*p)*np.sin(t)*np.cos(r) - np.sin(2*p)*np.sin(2*t)*np.sin(r)/2
    fx2y2 = -1*np.sin(2*p)*np.sin(t)*np.cos(r) - np.cos(2*p)*np.sin(2*t)*np.sin(r)/2
    f = np.matrix([fz2, fx2y2, fxy, fxz, fyz])

    return f.transpose() * f

# Computes the pi matrix for a given ligand
def pi_matrix(l):
    transformation = transformationMatrix(l);
    return np.dot(transformation, np.array([0,1,1,0,0]))

# Computes the sigma matrix for a given set of ligand with option esigma and epi values
def sigma(ligands, energies=[]):
    e = np.zeros(5)
    m = np.zeros((5,5))
    for i, l in enumerate(ligands):
        mat = np.array(sigma_matrix(l)).reshape(5)
        if (energies == []):
            e += mat
        else:
            e += mat * energies[i]
    return np.diag(e),e

# Computes the pi matrix for a given set of ligand with option esigma and epi values
def pi(ligands, energies=[]):
    e = np.zeros(5)
    for i, l in enumerate(ligands):
        mat = np.array(pi_matrix(l)).reshape(5)
        if (energies == []):
            e += mat
        else:
            e += mat * energies[i]
    return np.diag(e),e

# Converts a matrix to json for exporting
def json(mat):
    s = np.array2string(mat,separator=', ')
    s = re.sub(r'\n', '', s)
    s = re.sub(r'(\.\s*)(?=[,\]])', '', s)
    return s
