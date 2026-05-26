from dataclasses import dataclass

from django.conf import settings
from google import genai
from google.genai import types

from .models import Message


class GeminiServiceError(RuntimeError):
    pass


@dataclass
class GeminiChatService:
    model: str = settings.GEMINI_MODEL

    def __post_init__(self) -> None:
        if not settings.GEMINI_API_KEY:
            raise GeminiServiceError("GEMINI_API_KEY is not configured.")
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def build_contents(self, messages: list[Message]) -> list[types.Content]:
        contents: list[types.Content] = []
        for message in messages:
            role = "user" if message.role == Message.Role.USER else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part(text=message.content)],
                )
            )
        return contents

    def generate_reply(self, messages: list[Message]) -> str:
        if not messages:
            raise GeminiServiceError("No user message was provided.")

        contents = self.build_contents(messages)
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=(
                        settings.GEMINI_SYSTEM_PROMPT
                        + " Always answer the user's latest request directly and specifically. "
                        + "If the user asks for code, provide the code first and avoid generic greetings."
                    ),
                    temperature=0.4,
                ),
            )
        except Exception as exc:
            raise GeminiServiceError(f"Gemini request failed: {exc.__class__.__name__}") from exc
        text = getattr(response, "text", "") or ""
        if not text.strip():
            raise GeminiServiceError("Gemini returned an empty response.")
        return text.strip()
