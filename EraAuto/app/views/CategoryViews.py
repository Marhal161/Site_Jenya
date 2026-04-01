from django.views.generic import TemplateView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework import status
from ..models import Category, Product
from ..serializers.ProductSerializers import ProductListSerializer


# ── Пагинация: 10 товаров на страницу ──
class ProductPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


# ── HTML-страница ──
class CategoryPageView(TemplateView):
    template_name = 'category.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        slug = self.kwargs.get('slug')
        try:
            context['category'] = Category.objects.get(slug=slug)
        except Category.DoesNotExist:
            context['category'] = None
        return context


# ── API: товары категории с пагинацией ──
class CategoryProductsAPIView(APIView):

    def get(self, request, slug):
        try:
            category = Category.objects.get(slug=slug)
        except Category.DoesNotExist:
            return Response({'error': 'Категория не найдена'}, status=status.HTTP_404_NOT_FOUND)

        products = Product.objects.filter(
            category=category
        ).prefetch_related('images').order_by('id')

        paginator = ProductPagination()
        page = paginator.paginate_queryset(products, request)

        serializer = ProductListSerializer(
            page,
            many=True,
            context={'request': request}
        )
        return paginator.get_paginated_response(serializer.data)