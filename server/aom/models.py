from django.db import models

# Create your models here.
class Ligand(models.Model):
    name = models.CharField(max_length=256)
    smiles = models.CharField(max_length=256)
    citation = models.URLField()
    e_sigma = models.FloatField()
    e_pi = models.FloatField()

    def _str_(self):
        return f'{self.name}'
