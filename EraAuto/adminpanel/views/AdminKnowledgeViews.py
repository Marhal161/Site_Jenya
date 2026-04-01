import os
from django.shortcuts import render, redirect, get_object_or_404
from django.views import View
from app.models import Product, ProductDocument


class AdminDocsListView(View):
    """Список всех товаров с документами в админке"""
    def get(self, request):
        products = Product.objects.prefetch_related('documents').all().order_by('name')
        return render(request, 'admin_panel/docs_list.html', {'products': products})


class AdminDocUploadView(View):
    """Загрузка документа к товару"""
    def get(self, request):
        products = Product.objects.all().order_by('name')
        return render(request, 'admin_panel/docs_form.html', {
            'products': products,
            'doc_types': ProductDocument.DOC_TYPE_CHOICES,
            'action': 'Загрузить',
        })

    def post(self, request):
        product_id = request.POST.get('product')
        title = request.POST.get('title', '').strip()
        doc_type = request.POST.get('doc_type', 'other')
        order = request.POST.get('order', 0)
        file = request.FILES.get('file')

        if not product_id or not title or not file:
            products = Product.objects.all().order_by('name')
            return render(request, 'admin_panel/docs_form.html', {
                'products': products,
                'doc_types': ProductDocument.DOC_TYPE_CHOICES,
                'action': 'Загрузить',
                'error': 'Заполните все обязательные поля и прикрепите файл.',
            })

        product = get_object_or_404(Product, pk=product_id)
        ProductDocument.objects.create(
            product=product,
            title=title,
            doc_type=doc_type,
            file=file,
            order=order,
        )
        return redirect('admin_docs')


class AdminDocEditView(View):
    """Редактирование документа"""
    def get(self, request, pk):
        doc = get_object_or_404(ProductDocument, pk=pk)
        products = Product.objects.all().order_by('name')
        return render(request, 'admin_panel/docs_form.html', {
            'products': products,
            'doc_types': ProductDocument.DOC_TYPE_CHOICES,
            'obj': doc,
            'action': 'Изменить',
        })

    def post(self, request, pk):
        doc = get_object_or_404(ProductDocument, pk=pk)
        doc.product = get_object_or_404(Product, pk=request.POST.get('product'))
        doc.title = request.POST.get('title', doc.title).strip()
        doc.doc_type = request.POST.get('doc_type', doc.doc_type)
        doc.order = request.POST.get('order', doc.order)

        new_file = request.FILES.get('file')
        if new_file:
            # удаляем старый файл
            if doc.file and os.path.isfile(doc.file.path):
                os.remove(doc.file.path)
            doc.file = new_file

        doc.save()
        return redirect('admin_docs')


class AdminDocDeleteView(View):
    """Удаление документа"""
    def post(self, request, pk):
        doc = get_object_or_404(ProductDocument, pk=pk)
        if doc.file and os.path.isfile(doc.file.path):
            os.remove(doc.file.path)
        doc.delete()
        return redirect('admin_docs')