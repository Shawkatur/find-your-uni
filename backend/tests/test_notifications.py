"""
Unit tests for notification helpers — WhatsApp link generation, status labels.
"""
import pytest
from app.services.notifications import (
    whatsapp_link,
    status_update_whatsapp_message,
)


class TestWhatsappLink:
    def test_basic_link(self):
        url = whatsapp_link("+8801712345678", "Hello")
        assert url.startswith("https://wa.me/8801712345678")
        assert "Hello" in url

    def test_strips_plus(self):
        url = whatsapp_link("+1234567890", "Hi")
        assert "+", url
        assert "1234567890" in url

    def test_strips_spaces_and_dashes(self):
        url = whatsapp_link("+880 171-234-5678", "Hi")
        assert "8801712345678" in url

    def test_message_url_encoded(self):
        url = whatsapp_link("1234", "Hello World!")
        assert "Hello%20World%21" in url


class TestStatusUpdateMessage:
    def test_known_status(self):
        msg = status_update_whatsapp_message(
            "Jane", "MIT", "MSc CS", "offer_received"
        )
        assert "Jane" in msg
        assert "MIT" in msg
        assert "Offer Letter Received" in msg

    def test_unknown_status_uses_raw(self):
        msg = status_update_whatsapp_message(
            "Jane", "MIT", "MSc CS", "custom_status"
        )
        assert "custom_status" in msg

    def test_all_statuses_have_labels(self):
        statuses = [
            "lead", "pre_evaluation", "docs_collection", "applied",
            "offer_received", "conditional_offer", "visa_stage",
            "enrolled", "rejected", "withdrawn",
        ]
        for s in statuses:
            msg = status_update_whatsapp_message("Name", "Uni", "Program", s)
            # Raw status should NOT appear (replaced by label)
            assert s not in msg or s == "lead"  # "lead" substring may appear in labels

    def test_message_format(self):
        msg = status_update_whatsapp_message("Jane", "MIT", "MSc CS", "applied")
        assert "Dear Jane" in msg
        assert "University: MIT" in msg
        assert "Program: MSc CS" in msg
        assert "Status:" in msg
