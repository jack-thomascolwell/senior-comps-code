import numpy as np

def theta(l):
    x,y,z = l
    if (x==0 and y==0 and z==0):
         raise ValueError("Ligand cannot be at the origin")
         return None
    if (z==0):
        return np.pi / 2
    if (x==0 and y==0 and z>0):
        return 0
    if (x==0 and y==0 and z<0):
        return np.pi
    return np.arctan2(np.sqrt(x*x+y*y),z)

def phi(l):
    x,y,z = l
    if (x==0 and y==0):
        return 0
    if (y < 0):
        return -1 * np.arccos(x / np.sqrt(x*x+y*y))
    return np.arccos(x / np.sqrt(x*x+y*y))

def psi(l):
    if (len(l) >= 4):
        return l[4]
    return 0

def sigmaMatrix(l):
    t = theta(l)
    p = phi(l)
    r = psi(l)

    fz2 = (1+3*np.cos(2*t))/4
    fyz = np.sqrt(3)*np.sin(p)*np.sin(2*t)/2
    fxz = np.sqrt(3)*np.cos(p)*np.sin(2*t)/2
    fxy = np.sqrt(3)*np.sin(2*p)*(1-np.cos(2*t))/3
    fx2y2 = np.sqrt(3)*np.cos(2*p)*(1-np.cos(2*t))/4
    f = np.matrix([fz2, fx2y2, fxy, fxz, fyz])

    return f.transpose() * f

def piXMatrix(l):
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

def piYMatrix(l):
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

def piMatrix(l):
    return piXMatrix(l) + piYMatrix(l)

def sigmaEnergies(l):
    return np.diag(sigmaMatrix(l))

def piXEnergies(l):
    return np.diag(piXMatrix(l))

def piYEnergies(l):
    return np.diag(piYMatrix(l))

def piEnergies(l):
    return np.diag(pi(l))
