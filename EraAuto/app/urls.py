from django.urls import path
from .views.MainPageViews import MainPageView

urlpatterns = [
    path('', MainPageView.as_view(), name='main-page' ),
]