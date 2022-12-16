from django.urls import path
from . import views
app_name='aom'
urlpatterns = [
    path('tutorial/', views.tutorial, name='tutorial'),
    path('compute/', views.compute, name='compute'),
    path('calculator/', views.calculator, name='calculator')
]
