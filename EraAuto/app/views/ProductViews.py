from django.views.generic import TemplateView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Prefetch
from ..models import Product, ProductImage, Review
from ..serializers.ProductSerializers import ProductDetailSerializer, ReviewSerializer


class ProductPageView(TemplateView):
    template_name = 'product.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        try:
            product = Product.objects.select_related('category').get(
                slug=self.kwargs['product_slug']
            )
            context['product']  = product
            context['category'] = product.category
        except Product.DoesNotExist:
            context['product']  = None
            context['category'] = None
        return context


class ProductDetailAPIView(APIView):

    def get(self, request, product_slug):
        try:
            product = Product.objects.select_related('category').prefetch_related(
                Prefetch('images', queryset=ProductImage.objects.order_by('-is_main', 'id')),
                Prefetch('reviews', queryset=Review.objects.filter(is_approved=True).order_by('-created_at')),
            ).get(slug=product_slug)
        except Product.DoesNotExist:
            return Response({'error': 'Товар не найден'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductDetailSerializer(product, context={'request': request})
        return Response(serializer.data)


class ReviewCreateAPIView(APIView):

    def post(self, request, product_slug):
        try:
            product = Product.objects.get(slug=product_slug)
        except Product.DoesNotExist:
            return Response({'error': 'Товар не найден'}, status=status.HTTP_404_NOT_FOUND)

        name   = request.data.get('name', '').strip()
        rating = request.data.get('rating')
        text   = request.data.get('text', '').strip()

        # Валидация
        errors = {}
        if not name:
            errors['name'] = 'Введите имя'
        if not rating or int(rating) not in range(1, 6):
            errors['rating'] = 'Выберите оценку от 1 до 5'
        if len(text) < 5:
            errors['text'] = 'Напишите отзыв (минимум 5 символов)'
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        review = Review.objects.create(
            product=product,
            name=name,
            rating=int(rating),
            text=text,
        )

        serializer = ReviewSerializer(review)
        return Response({
            **serializer.data,
            'message': 'Спасибо! Ваш отзыв отправлен на модерацию.'
        }, status=status.HTTP_201_CREATED)