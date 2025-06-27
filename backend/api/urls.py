from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.main import CategoryViewSet, ProductViewSet, OrderViewSet
from .views.admin import AdminLoginView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'orders', OrderViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('admin/login/', AdminLoginView.as_view(), name='admin_login'),
] 