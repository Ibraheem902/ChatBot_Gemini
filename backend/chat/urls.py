from django.urls import path

from .views import ConversationDetailView, ConversationListCreateView, ConversationMessageCreateView, HealthView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("conversations/", ConversationListCreateView.as_view(), name="conversation-list"),
    path("conversations/<uuid:pk>/", ConversationDetailView.as_view(), name="conversation-detail"),
    path(
        "conversations/<uuid:conversation_id>/messages/",
        ConversationMessageCreateView.as_view(),
        name="conversation-message-create",
    ),
]
