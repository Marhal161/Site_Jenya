from django.views.generic import TemplateView
from rest_framework.views import APIView
from rest_framework.response import Response
from app.models import Product, ProductDocument


class KnowledgeBasePageView(TemplateView):
    """Публичная страница базы знаний"""
    template_name = 'knowledge_base.html'


class KnowledgeBaseAPIView(APIView):
    """
    GET /api/knowledge/
    Возвращает все товары у которых есть документы, с вложенным списком документов.
    Опционально фильтрация по ?search=... и ?category=slug
    """
    def get(self, request):
        search = request.GET.get('search', '').strip()
        category_slug = request.GET.get('category', '').strip()

        products = Product.objects.prefetch_related('documents', 'category').filter(
            documents__isnull=False
        ).distinct()

        if search:
            products = products.filter(name__icontains=search)

        if category_slug:
            products = products.filter(category__slug=category_slug)

        data = []
        for product in products:
            docs = []
            for doc in product.documents.all():
                docs.append({
                    'id': doc.id,
                    'title': doc.title,
                    'doc_type': doc.doc_type,
                    'doc_type_label': doc.get_doc_type_display(),
                    'url': request.build_absolute_uri(doc.file.url),
                    'filename': doc.filename(),
                    'extension': doc.extension(),
                })
            data.append({
                'id': product.id,
                'name': product.name,
                'slug': product.slug,
                'category': product.category.name,
                'category_slug': product.category.slug,
                'documents': docs,
            })

        return Response(data)