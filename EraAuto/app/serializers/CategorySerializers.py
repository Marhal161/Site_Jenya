from rest_framework import serializers
from ..models import Category


class CategorySerializer(serializers.ModelSerializer):
    preview_image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'preview_image']

    def get_preview_image(self, obj):
        request = self.context.get('request')
        products = getattr(obj, 'first_product_list', [])
        if not products:
            return None

        # images — это related manager (OneToMany к ProductImage или similar)
        # берём первое изображение первого товара
        product = products[0]
        first_image = product.images.first()
        if first_image and request:
            # у ProductImage скорее всего поле image или file
            img_field = getattr(first_image, 'image', None) or getattr(first_image, 'file', None)
            if img_field:
                return request.build_absolute_uri(img_field.url)
        return None