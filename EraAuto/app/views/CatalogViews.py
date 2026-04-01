from django.views.generic import TemplateView
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Prefetch
from ..models import Category, Product
from ..serializers.CategorySerializers import CategorySerializer


class CatalogPageView(TemplateView):
    template_name = 'catalog.html'


class CategoriesAPIView(APIView):

    def get(self, request):
        # images — это related_name или ManyToMany/OneToMany к ProductImage
        # берём товары у которых есть хотя бы одно изображение
        first_products = Product.objects.prefetch_related('images').filter(
            images__isnull=False
        ).distinct().order_by('id')

        categories = Category.objects.prefetch_related(
            Prefetch(
                'products',
                queryset=first_products,
                to_attr='first_product_list'
            )
        )

        serializer = CategorySerializer(
            categories,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)