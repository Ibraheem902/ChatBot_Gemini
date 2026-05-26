from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation, Message
from .serializers import ConversationSerializer, SendMessageSerializer
from .services import GeminiChatService, GeminiServiceError


class HealthView(APIView):
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok"})


class ConversationListCreateView(generics.ListCreateAPIView):
    queryset = Conversation.objects.all().order_by("-updated_at")
    serializer_class = ConversationSerializer
    permission_classes = []

    def perform_create(self, serializer):
        serializer.save()


class ConversationDetailView(generics.RetrieveAPIView):
    queryset = Conversation.objects.prefetch_related("messages")
    serializer_class = ConversationSerializer
    permission_classes = []
    lookup_field = "pk"


class ConversationMessageCreateView(APIView):
    permission_classes = []

    def post(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, pk=conversation_id)
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_message = Message.objects.create(
            conversation=conversation,
            role=Message.Role.USER,
            content=serializer.validated_data["content"],
        )

        if not conversation.title:
            conversation.title = user_message.content.strip()[:80] or "New chat"

        history = list(conversation.messages.order_by("created_at")[:12])

        try:
            assistant_text = GeminiChatService().generate_reply(history)
        except GeminiServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        assistant_message = Message.objects.create(
            conversation=conversation,
            role=Message.Role.ASSISTANT,
            content=assistant_text,
        )

        conversation.updated_at = timezone.now()
        conversation.save(update_fields=["title", "updated_at"])

        payload = ConversationSerializer(conversation).data
        return Response(
            {
                "conversation": payload,
                "assistant_message": {
                    "id": assistant_message.id,
                    "role": assistant_message.role,
                    "content": assistant_message.content,
                    "created_at": assistant_message.created_at,
                },
            },
            status=status.HTTP_201_CREATED,
        )
