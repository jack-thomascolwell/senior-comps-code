from django.urls import path
from . import views
app_name='aom'
urlpatterns = [
    path('', views.index, name='index'),
    path('compute/', views.compute, name='compute'),
    path('calculator/', views.calculator, name='calculator')
]
