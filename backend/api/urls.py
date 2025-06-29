from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import main, admin, orders
from .views.main import health_check

router = DefaultRouter()
router.register(r'products', main.ProductViewSet, basename='product')
router.register(r'categories', main.CategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/login/', admin.AdminLoginView.as_view(), name='admin_login'),
    path('orders/', orders.create_order, name='create-order'),
    path('health/', health_check, name='health_check'),
] 