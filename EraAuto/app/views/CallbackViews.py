import logging
from django.conf import settings
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from ..models import Callback

logger = logging.getLogger(__name__)


class CallbackCreateAPIView(APIView):

    def post(self, request):
        name    = request.data.get('name', '').strip()
        phone   = request.data.get('phone', '').strip()
        message = request.data.get('message', '').strip()
        comment = request.data.get('comment', '').strip()  # отдельный комментарий из cart.html
        source  = request.data.get('source', '').strip()   # 'cart' | 'callback' (необязательно)

        if not name:
            return Response({'error': 'Введите имя'}, status=status.HTTP_400_BAD_REQUEST)
        if not phone:
            return Response({'error': 'Введите телефон'}, status=status.HTTP_400_BAD_REQUEST)

        # Склеиваем message + comment для хранения в БД (одно поле)
        full_message = message
        if comment:
            full_message = (full_message + '\n\nКомментарий клиента: ' + comment).strip()

        callback = Callback.objects.create(name=name, phone=phone, message=full_message)
        self._send_notification(callback, message, comment, source)

        return Response({'ok': True}, status=status.HTTP_201_CREATED)

    def _send_notification(self, callback, message, comment, source):
        source_label = {
            'cart':     'Заявка из корзины',
            'callback': 'Обратный звонок',
        }.get(source, 'Заявка с сайта')

        subject = f'{source_label} — {callback.name}'

        body_lines = [
            source_label,
            '',
            f'Имя: {callback.name}',
            f'Телефон: {callback.phone}',
        ]
        if message:
            body_lines += ['', 'Содержание заявки:', message]
        if comment:
            body_lines += ['', 'Комментарий клиента:', comment]

        try:
            send_mail(
                subject=subject,
                message='\n'.join(body_lines),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.CALLBACK_RECIPIENT],
                fail_silently=False,
            )
        except Exception as exc:
            logger.error(
                'Не удалось отправить email о заявке #%s: %s',
                callback.pk, exc
            )