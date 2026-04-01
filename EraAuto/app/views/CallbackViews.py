from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import Callback


class CallbackCreateAPIView(APIView):

    def post(self, request):
        name    = request.data.get('name', '').strip()
        phone   = request.data.get('phone', '').strip()
        message = request.data.get('message', '').strip()

        if not name:
            return Response({'error': 'Введите имя'}, status=status.HTTP_400_BAD_REQUEST)
        if not phone:
            return Response({'error': 'Введите телефон'}, status=status.HTTP_400_BAD_REQUEST)

        Callback.objects.create(name=name, phone=phone, message=message)
        return Response({'ok': True}, status=status.HTTP_201_CREATED)