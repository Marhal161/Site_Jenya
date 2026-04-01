from rest_framework import serializers
from ..models import Product, ProductImage, Review


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model  = ProductImage
        fields = ['id', 'url', 'is_main']

    def get_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Review
        fields = ['id', 'name', 'rating', 'text', 'created_at']


class ProductListSerializer(serializers.ModelSerializer):
    preview_image = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = ['id', 'name', 'slug', 'price', 'in_stock', 'preview_image']

    def get_preview_image(self, obj):
        request = self.context.get('request')
        # Сначала ищем главное фото, иначе первое
        image = obj.images.filter(is_main=True).first() or obj.images.first()
        if image and request:
            return request.build_absolute_uri(image.image.url)
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    images   = serializers.SerializerMethodField()
    reviews  = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            'id', 'name', 'slug', 'price',
            'description', 'in_stock', 'created_at',
            'category', 'images', 'reviews',
        ]

    def get_images(self, obj):
        # Главное фото первым, остальные после
        qs = obj.images.order_by('-is_main', 'id')
        return ProductImageSerializer(qs, many=True, context=self.context).data

    def get_category(self, obj):
        cat = obj.category
        return {'id': cat.id, 'name': cat.name, 'slug': cat.slug}

    def get_reviews(self, obj):
        qs = obj.reviews.filter(is_approved=True).order_by('-created_at')
        return ReviewSerializer(qs, many=True).data