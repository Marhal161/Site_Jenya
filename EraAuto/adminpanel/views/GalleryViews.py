from django.views.generic import TemplateView
from rest_framework.views import APIView
from rest_framework.response import Response
from app.models import GalleryImage


# Публичная страница галереи
class GalleryPageView(TemplateView):
    template_name = 'gallery_page.html'


# Admin-страница галереи
class AdminGalleryPageView(TemplateView):
    template_name = 'admin_panel/gallery.html'


class GalleryAPIView(APIView):
    def get(self, request):
        images = GalleryImage.objects.all()
        data = []
        for img in images:
            data.append({
                'id': img.id,
                'title': img.title,
                'url': request.build_absolute_uri(img.image.url),
                'created_at': img.created_at.isoformat(),
            })
        return Response(data)