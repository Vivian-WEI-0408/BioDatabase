import unittest
import sys
import types

try:
    import dotenv  # noqa: F401
except ModuleNotFoundError:
    dotenv_stub = types.ModuleType("dotenv")
    dotenv_stub.dotenv_values = lambda _path: {}
    sys.modules["dotenv"] = dotenv_stub
from Services.WebDatabaseAssemblyClient import WebDatabaseAssemblyClient


class FakeResponse:
    def __init__(self, data, status_code=200):
        self._data = data
        self.status_code = status_code

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(self.status_code)

    def json(self):
        return self._data


class FakeSession:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def request(self, method, url, **kwargs):
        self.calls.append((method, url, kwargs))
        return self.responses.pop(0)


class BioAppAssemblyClientTests(unittest.TestCase):
    def test_submits_and_reads_bio_app_task_contract(self):
        session = FakeSession([
            FakeResponse({"status": 1, "options": {"taskId": 17}}),
            FakeResponse({"status": 1, "options": {"task": {
                "status": "completed",
                "result": {"assemblies": [{"downloadFileId": "f-1"}]},
            }}}),
        ])
        client = WebDatabaseAssemblyClient(
            "http://bio-api:9092", "user-token", session=session
        )
        task_id = client.submit_assembly({
            "uuid": "Level2-x", "part": [1], "backbone": ["bb"],
            "plasmid": [], "scar": [["", ""]],
        }, "Level2")
        result = client.wait_for_task(task_id, "Level2", interval=0)
        self.assertEqual(result["assemblies"][0]["downloadFileId"], "f-1")
        self.assertEqual(session.calls[0][1], "http://bio-api:9092/assembly/run")
        self.assertEqual(session.calls[0][2]["headers"]["Token"], "user-token")
        self.assertEqual(session.calls[1][1], "http://bio-api:9092/assembly/tasks/17")


if __name__ == "__main__":
    unittest.main()
