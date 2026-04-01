from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth import authenticate, login, logout
from django.db.models import Count, Q
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.utils.decorators import method_decorator
from django.views import View
import json

from app.models import Category, Product, ProductImage, Review, Callback, GalleryImage

# ── Доступ только для staff ──
def is_staff(user):
    return user.is_authenticated and user.is_staff

staff_required = user_passes_test(is_staff, login_url='/admin-panel/login/')


# ── LOGIN / LOGOUT ──
def admin_login(request):
    if request.user.is_authenticated and request.user.is_staff:
        return redirect('admin_dashboard')

    error = None
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        user = authenticate(request, username=username, password=password)
        if user and user.is_staff:
            login(request, user)
            return redirect(request.GET.get('next', '/admin-panel/'))
        error = 'Неверный логин или пароль'

    return render(request, 'admin_panel/login.html', {'error': error})


def admin_logout(request):
    logout(request)
    return redirect('admin_login')


# ── ДАШБОРД ──
@staff_required
def admin_dashboard(request):
    ctx = {
        'categories_count': Category.objects.count(),
        'products_count':   Product.objects.count(),
        'callbacks_count':  Callback.objects.count(),
        'new_callbacks':    Callback.objects.filter(status='new').count(),
        'reviews_count':    Review.objects.count(),
        'gallery_count':    GalleryImage.objects.count(),
        'recent_callbacks': Callback.objects.order_by('-created_at')[:5],
        'recent_reviews':   Review.objects.order_by('-created_at')[:5],
    }
    return render(request, 'admin_panel/dashboard.html', ctx)


# ══ КАТЕГОРИИ ══
@staff_required
def admin_categories(request):
    categories = Category.objects.annotate(products_count=Count('products')).order_by('name')
    return render(request, 'admin_panel/categories.html', {'categories': categories})


@staff_required
def admin_category_create(request):
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        slug = request.POST.get('slug', '').strip()
        if name and slug:
            Category.objects.create(name=name, slug=slug)
            return redirect('admin_categories')
    return render(request, 'admin_panel/category_form.html', {'action': 'Создать'})


@staff_required
def admin_category_edit(request, pk):
    category = get_object_or_404(Category, pk=pk)
    if request.method == 'POST':
        category.name = request.POST.get('name', '').strip()
        category.slug = request.POST.get('slug', '').strip()
        category.save()
        return redirect('admin_categories')
    return render(request, 'admin_panel/category_form.html', {'obj': category, 'action': 'Редактировать'})


@staff_required
def admin_category_delete(request, pk):
    get_object_or_404(Category, pk=pk).delete()
    return redirect('admin_categories')


# ══ ТОВАРЫ ══
@staff_required
def admin_products(request):
    qs = Product.objects.select_related('category').order_by('-id')
    q  = request.GET.get('q', '')
    cat = request.GET.get('cat', '')
    if q:
        qs = qs.filter(Q(name__icontains=q) | Q(slug__icontains=q))
    if cat:
        qs = qs.filter(category_id=cat)
    ctx = {
        'products':   qs,
        'categories': Category.objects.all(),
        'q': q, 'cat': cat,
    }
    return render(request, 'admin_panel/products.html', ctx)


@staff_required
def admin_product_create(request):
    if request.method == 'POST':
        product = Product.objects.create(
            category=get_object_or_404(Category, pk=request.POST['category']),
            name=request.POST['name'],
            slug=request.POST['slug'],
            description=request.POST.get('description', ''),
            price=request.POST['price'],
            in_stock=bool(request.POST.get('in_stock')),
        )
        _save_images(request, product)
        return redirect('admin_products')
    return render(request, 'admin_panel/product_form.html', {
        'categories': Category.objects.all(), 'action': 'Создать'
    })


@staff_required
def admin_product_edit(request, pk):
    product = get_object_or_404(Product, pk=pk)
    if request.method == 'POST':
        product.category    = get_object_or_404(Category, pk=request.POST['category'])
        product.name        = request.POST['name']
        product.slug        = request.POST['slug']
        product.description = request.POST.get('description', '')
        product.price       = request.POST['price']
        product.in_stock    = bool(request.POST.get('in_stock'))
        product.save()
        _save_images(request, product)
        # Удаление фото
        for img_id in request.POST.getlist('delete_images'):
            ProductImage.objects.filter(pk=img_id, product=product).delete()
        # Главное фото
        main_id = request.POST.get('main_image')
        if main_id:
            product.images.update(is_main=False)
            product.images.filter(pk=main_id).update(is_main=True)
        return redirect('admin_products')
    return render(request, 'admin_panel/product_form.html', {
        'obj': product,
        'categories': Category.objects.all(),
        'images': product.images.order_by('-is_main', 'id'),
        'action': 'Редактировать',
    })


@staff_required
def admin_product_delete(request, pk):
    get_object_or_404(Product, pk=pk).delete()
    return redirect('admin_products')


def _save_images(request, product):
    for img in request.FILES.getlist('images'):
        ProductImage.objects.create(product=product, image=img)


# ══ ЗАЯВКИ ══
@staff_required
def admin_callbacks(request):
    qs = Callback.objects.order_by('-created_at')
    status = request.GET.get('status', '')
    if status:
        qs = qs.filter(status=status)
    return render(request, 'admin_panel/callbacks.html', {
        'callbacks': qs, 'status': status,
        'new_count': Callback.objects.filter(status='new').count(),
    })


@staff_required
def admin_callback_status(request, pk):
    cb = get_object_or_404(Callback, pk=pk)
    cb.status = request.POST.get('status', cb.status)
    cb.save()
    return redirect('admin_callbacks')


@staff_required
def admin_callback_delete(request, pk):
    get_object_or_404(Callback, pk=pk).delete()
    return redirect('admin_callbacks')


# ══ ОТЗЫВЫ ══
@staff_required
def admin_reviews(request):
    reviews = Review.objects.select_related('product').order_by('-created_at')
    return render(request, 'admin_panel/reviews.html', {'reviews': reviews})


@staff_required
def admin_review_delete(request, pk):
    get_object_or_404(Review, pk=pk).delete()
    return redirect('admin_reviews')


@staff_required
def admin_review_approve(request, pk):
    review = get_object_or_404(Review, pk=pk)
    review.is_approved = not review.is_approved
    review.save()
    return redirect('admin_reviews')


# ══ ГАЛЕРЕЯ ══
@staff_required
def admin_gallery(request):
    images = GalleryImage.objects.all()
    return render(request, 'admin_panel/gallery.html', {'images': images})


@staff_required
def admin_gallery_upload(request):
    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        order = request.POST.get('order', 0)
        try:
            order = int(order)
        except (ValueError, TypeError):
            order = 0
        for img in request.FILES.getlist('images'):
            GalleryImage.objects.create(image=img, title=title, order=order)
        return redirect('admin_gallery')
    return render(request, 'admin_panel/gallery_form.html', {'action': 'Загрузить'})


@staff_required
def admin_gallery_edit(request, pk):
    image = get_object_or_404(GalleryImage, pk=pk)
    if request.method == 'POST':
        image.title = request.POST.get('title', '').strip()
        try:
            image.order = int(request.POST.get('order', 0))
        except (ValueError, TypeError):
            image.order = 0
        # Замена фото если загрузили новое
        new_img = request.FILES.get('image')
        if new_img:
            image.image = new_img
        image.save()
        return redirect('admin_gallery')
    return render(request, 'admin_panel/gallery_form.html', {'obj': image, 'action': 'Редактировать'})


@staff_required
def admin_gallery_delete(request, pk):
    get_object_or_404(GalleryImage, pk=pk).delete()
    return redirect('admin_gallery')