"""Per-IP limits behind Caddy: X-Forwarded-For counts only when it comes from 127.0.0.1.

Mirrors the deploy command line (uvicorn --proxy-headers --forwarded-allow-ips 127.0.0.1).
"""

from fastapi.testclient import TestClient
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app import main
from app.main import app

proxied = ProxyHeadersMiddleware(app, trusted_hosts="127.0.0.1")


def _post(client_addr: str, xff: str | None) -> int:
    c = TestClient(proxied, client=(client_addr, 40000))
    headers = {"X-Forwarded-For": xff} if xff else {}
    return c.post("/api/rounds", json={"topic": "birthday"}, headers=headers).status_code


def test_each_client_behind_caddy_gets_its_own_bucket(monkeypatch):
    monkeypatch.setattr(main, "PER_IP_PER_HOUR", 2)
    main._hits.clear()
    assert [_post("127.0.0.1", "198.51.100.1") for _ in range(3)] == [200, 200, 429]
    # A different real client through the same proxy is not blocked.
    assert _post("127.0.0.1", "198.51.100.2") == 200
    assert "198.51.100.1" in main._hits and "127.0.0.1" not in main._hits
    main._hits.clear()


def test_spoofed_header_from_untrusted_peer_is_ignored(monkeypatch):
    monkeypatch.setattr(main, "PER_IP_PER_HOUR", 2)
    main._hits.clear()
    codes = [_post("203.0.113.9", f"198.51.100.{i}") for i in range(3)]
    assert codes == [200, 200, 429]
    assert set(main._hits) == {"203.0.113.9"}
    main._hits.clear()
