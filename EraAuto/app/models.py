from django.db import models
import os

class Category(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=300)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    in_stock = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    is_main = models.BooleanField(default=False)


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    name = models.CharField(max_length=100)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_approved = models.BooleanField(default=False, verbose_name='Одобрен')

    def __str__(self):
        return f'{self.name} — {self.product.name}'


class Callback(models.Model):
    STATUS_CHOICES = [
        ('new', 'Новая'),
        ('in_progress', 'В обработке'),
        ('done', 'Завершена'),
    ]
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    message = models.TextField(blank=True)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} — {self.phone}'


class GalleryImage(models.Model):
    title = models.CharField(max_length=200, blank=True, verbose_name='Подпись')
    image = models.ImageField(upload_to='gallery/', verbose_name='Фото')
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок сортировки')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', '-created_at']
        verbose_name = 'Фото галереи'
        verbose_name_plural = 'Фото галереи'

    def __str__(self):
        return self.title or f'Фото #{self.pk}'

def document_upload_path(instance, filename):
    """Сохраняет документы в папку docs/product_<id>/"""
    return f'docs/product_{instance.product.id}/{filename}'


class ProductDocument(models.Model):
    DOC_TYPE_CHOICES = [
        ('manual',      'Инструкция по эксплуатации'),
        ('passport',    'Паспорт изделия'),
        ('scheme',      'Электрическая схема'),
        ('certificate', 'Сертификат'),
        ('datasheet',   'Технический паспорт'),
        ('other',       'Прочее'),
    ]

    product = models.ForeignKey(
        'Product',
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name='Товар'
    )
    title = models.CharField(max_length=300, verbose_name='Название документа')
    doc_type = models.CharField(
        max_length=20,
        choices=DOC_TYPE_CHOICES,
        default='other',
        verbose_name='Тип документа'
    )
    file = models.FileField(upload_to=document_upload_path, verbose_name='Файл')
    order = models.PositiveIntegerField(default=0, verbose_name='Порядок')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'doc_type', 'title']
        verbose_name = 'Документ товара'
        verbose_name_plural = 'Документы товаров'

    def __str__(self):
        return f'{self.title} — {self.product.name}'

    def filename(self):
        return os.path.basename(self.file.name)

    def extension(self):
        name, ext = os.path.splitext(self.file.name)
        return ext.lower().lstrip('.')