from django.urls import path
from .views.AdminViews import (
    admin_login, admin_logout, admin_categories, admin_callbacks, admin_dashboard,
    admin_products, admin_reviews, admin_product_edit, admin_category_edit,
    admin_review_delete, admin_product_delete, admin_product_create, admin_callback_delete,
    admin_category_delete, admin_category_create, admin_callback_status,
    admin_review_approve,
    admin_gallery, admin_gallery_upload, admin_gallery_edit, admin_gallery_delete)
from .views.AdminKnowledgeViews import (
    AdminDocsListView, AdminDocUploadView,
    AdminDocEditView, AdminDocDeleteView,
)

urlpatterns = [
    path('login/',  admin_login,   name='admin_login'),
    path('logout/', admin_logout,  name='admin_logout'),
    path('',        admin_dashboard, name='admin_dashboard'),

    # Категории
    path('categories/',             admin_categories,     name='admin_categories'),
    path('categories/create/',       admin_category_create, name='admin_category_create'),
    path('categories/<int:pk>/edit/', admin_category_edit,  name='admin_category_edit'),
    path('categories/<int:pk>/delete/', admin_category_delete, name='admin_category_delete'),

    # Товары
    path('products/',               admin_products,       name='admin_products'),
    path('products/create/',        admin_product_create, name='admin_product_create'),
    path('products/<int:pk>/edit/', admin_product_edit,   name='admin_product_edit'),
    path('products/<int:pk>/delete/', admin_product_delete, name='admin_product_delete'),

    # Заявки
    path('callbacks/',                        admin_callbacks,       name='admin_callbacks'),
    path('callbacks/<int:pk>/status/',        admin_callback_status, name='admin_callback_status'),
    path('callbacks/<int:pk>/delete/',        admin_callback_delete, name='admin_callback_delete'),

    # Отзывы
    path('reviews/',               admin_reviews,       name='admin_reviews'),
    path('reviews/<int:pk>/delete/', admin_review_delete, name='admin_review_delete'),
    path('reviews/<int:pk>/approve/', admin_review_approve, name='admin_review_approve'),

    # Галерея
    path('gallery/',                       admin_gallery,        name='admin_gallery'),
    path('gallery/upload/',                admin_gallery_upload, name='admin_gallery_upload'),
    path('gallery/<int:pk>/edit/',         admin_gallery_edit,   name='admin_gallery_edit'),
    path('gallery/<int:pk>/delete/',       admin_gallery_delete, name='admin_gallery_delete'),

    path('docs/', AdminDocsListView.as_view(), name='admin_docs'),
    path('docs/upload/', AdminDocUploadView.as_view(), name='admin_docs_upload'),
    path('docs/<int:pk>/edit/', AdminDocEditView.as_view(), name='admin_docs_edit'),
    path('docs/<int:pk>/delete/', AdminDocDeleteView.as_view(), name='admin_docs_delete'),
]