from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, AllowAny
from firebase_admin import firestore

# The OrderViewSet still uses Django's ORM and serializers.
# This would be the next thing to migrate if you want orders in Firestore too.
from ..models import Order
from ..serializers import OrderSerializer

class CategoryViewSet(viewsets.ViewSet):
    """
    A ViewSet for listing, retrieving, creating, updating, and deleting categories in Firestore.
    """
    db = firestore.client()
    categories_ref = db.collection('categories')

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        Admin users can do anything, others can only read.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdminUser]
        else:
            self.permission_classes = [AllowAny]
        return super().get_permissions()

    def list(self, request):
        """GET /api/categories/ - List all categories."""
        docs = self.categories_ref.stream()
        categories = [{"id": doc.id, **doc.to_dict()} for doc in docs]
        return Response(categories)

    def retrieve(self, request, pk=None):
        """GET /api/categories/{id}/ - Retrieve a single category."""
        doc_ref = self.categories_ref.document(pk)
        doc = doc_ref.get()
        if doc.exists:
            return Response({"id": doc.id, **doc.to_dict()})
        return Response(status=status.HTTP_404_NOT_FOUND)

    def create(self, request):
        """POST /api/categories/ - Create a new category."""
        name = request.data.get('name')
        if not name:
            return Response({"error": "Category name is required."}, status=status.HTTP_400_BAD_REQUEST)
        doc_ref = self.categories_ref.add({'name': name})
        return Response({"id": doc_ref[1].id, "name": name}, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        """PUT /api/categories/{id}/ - Update a category."""
        doc_ref = self.categories_ref.document(pk)
        name = request.data.get('name')
        if not name:
            return Response({"error": "Category name is required."}, status=status.HTTP_400_BAD_REQUEST)
        doc_ref.update({'name': name})
        return Response({"id": pk, "name": name})

    def destroy(self, request, pk=None):
        """DELETE /api/categories/{id}/ - Delete a category."""
        # Note: This will not delete the products in this category.
        # A more robust implementation might handle that, e.g., using a Cloud Function.
        doc_ref = self.categories_ref.document(pk)
        doc_ref.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductViewSet(viewsets.ViewSet):
    """
    A ViewSet for listing, retrieving, and filtering products from Firestore.
    Admin users can also create, update, and delete products.
    """
    db = firestore.client()
    products_ref = db.collection('products')
    categories_ref = db.collection('categories')

    def get_permissions(self):
        """Set permissions based on action."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAdminUser]
        else:
            self.permission_classes = [AllowAny]
        return super().get_permissions()

    def list(self, request):
        """
        GET /api/products/ - List all products.
        Supports filtering by `category_id` and searching by `name`.
        e.g., /api/products/?category_id=...&name=...
        """
        query = self.products_ref
        
        category_id = request.query_params.get('category_id')
        name_query = request.query_params.get('name')

        # Filter by category
        if category_id:
            category_ref = self.categories_ref.document(category_id)
            query = query.where('categoryRef', '==', category_ref)
        
        # This is a simple "starts-with" search.
        # For full-text search, a dedicated search service like Algolia or Elasticsearch is recommended.
        if name_query:
            query = query.where('name', '>=', name_query).where('name', '<=', name_query + u'\uf8ff')

        docs = query.stream()
        products = []
        for doc in docs:
            product_data = doc.to_dict()
            # Resolve the category reference to include category name
            category_doc = product_data['categoryRef'].get()
            if category_doc.exists:
                product_data['category'] = {"id": category_doc.id, **category_doc.to_dict()}
            del product_data['categoryRef'] # Clean up the response
            products.append({"id": doc.id, **product_data})
            
        return Response(products)

    def retrieve(self, request, pk=None):
        """GET /api/products/{id}/ - Retrieve a single product."""
        doc_ref = self.products_ref.document(pk)
        doc = doc_ref.get()
        if not doc.exists:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        product_data = doc.to_dict()
        category_doc = product_data['categoryRef'].get()
        if category_doc.exists:
            product_data['category'] = {"id": category_doc.id, **category_doc.to_dict()}
        del product_data['categoryRef']
        
        return Response({"id": doc.id, **product_data})
    
    def create(self, request):
        """POST /api/products/ - Create a new product."""
        # A proper implementation would use serializers for validation here.
        data = request.data
        category_id = data.get('category_id')
        if not category_id:
             return Response({"error": "category_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        category_ref = self.categories_ref.document(category_id)
        
        new_product = {
            'name': data.get('name', ''),
            'description': data.get('description', ''),
            'price': float(data.get('price', 0)),
            'quantity': int(data.get('quantity', 0)),
            'imageUrl': data.get('imageUrl', ''),
            'categoryRef': category_ref
        }
        # Basic validation
        if not new_product['name'] or new_product['price'] <= 0:
            return Response({"error": "Valid name and price are required."}, status=status.HTTP_400_BAD_REQUEST)

        doc_ref = self.products_ref.add(new_product)
        return Response({"id": doc_ref[1].id, **data}, status=status.HTTP_201_CREATED)

    def update(self, request, pk=None):
        """PUT /api/products/{id}/ - Update a product."""
        doc_ref = self.products_ref.document(pk)
        data = request.data
        
        update_data = {
            'name': data.get('name'),
            'description': data.get('description'),
            'price': float(data.get('price')) if data.get('price') is not None else None,
            'quantity': int(data.get('quantity')) if data.get('quantity') is not None else None,
            'imageUrl': data.get('imageUrl') if 'imageUrl' in data else None
        }
        
        # Filter out any None values so we don't overwrite fields with nulls
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        if 'category_id' in data:
            category_ref = self.categories_ref.document(data['category_id'])
            update_data['categoryRef'] = category_ref

        doc_ref.update(update_data)
        return Response({"id": pk, **data})

    def destroy(self, request, pk=None):
        """DELETE /api/products/{id}/ - Delete a product."""
        doc_ref = self.products_ref.document(pk)
        doc_ref.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class OrderViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing and creating orders.
    """
    queryset = Order.objects.all()
    serializer_class = OrderSerializer 