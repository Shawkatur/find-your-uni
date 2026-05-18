"""
Structured JSON logging with correlation IDs.
Usage: from app.core.logger import logger
"""
import logging
import json
import sys
import uuid
from contextvars import ContextVar

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")

logger = logging.getLogger("findyouruni")
logger.setLevel(logging.INFO)


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log = {
            "time": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_var.get("-"),
        }
        if record.exc_info and record.exc_info[1]:
            log["exception"] = self.formatException(record.exc_info)
        return json.dumps(log, default=str)


if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)


def generate_request_id() -> str:
    return uuid.uuid4().hex[:12]
