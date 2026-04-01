from django.urls import path
from django.views.generic import TemplateView
from .views.MainPageViews import MainPageView
from .views.CatalogViews import CatalogPageView, CategoriesAPIView
from .views.CategoryViews import CategoryPageView, CategoryProductsAPIView
from .views.ProductViews import ProductPageView, ProductDetailAPIView, ReviewCreateAPIView
from .views.CallbackViews import CallbackCreateAPIView
from adminpanel.views.GalleryViews import GalleryPageView, GalleryAPIView
from .views.KnowledgeViews import KnowledgeBasePageView, KnowledgeBaseAPIView

urlpatterns = [
    path('', MainPageView.as_view(), name='main-page'),
    path('catalog/', CatalogPageView.as_view(), name='catalog-page'),
    path('catalog/<slug:slug>/', CategoryPageView.as_view(), name='category-page'),
    path('catalog/<slug:slug>/<slug:product_slug>/', ProductPageView.as_view(), name='product-page'),
    path('cart/', TemplateView.as_view(template_name='cart.html'), name='cart-page'),
    path('gallery/', GalleryPageView.as_view(), name='gallery-page'),
    path('knowledge/', KnowledgeBasePageView.as_view(), name='knowledge-page'),

    # API
    path('api/categories/', CategoriesAPIView.as_view(), name='api-categories'),
    path('api/categories/<slug:slug>/products/', CategoryProductsAPIView.as_view(), name='api-category-products'),
    path('api/products/<slug:product_slug>/', ProductDetailAPIView.as_view(), name='api-product-detail'),
    path('api/products/<slug:product_slug>/reviews/', ReviewCreateAPIView.as_view(), name='api-review-create'),
    path('api/callback/', CallbackCreateAPIView.as_view(), name='api-callback'),
    path('api/gallery/', GalleryAPIView.as_view(), name='api-gallery'),
    path('api/knowledge/', KnowledgeBaseAPIView.as_view(), name='api-knowledge'),

]