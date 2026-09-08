import tempfile
import unittest
from pathlib import Path

from Services.UploadTaskStore import create_upload_task, get_upload_task_files


class FakeUpload:
    def __init__(self, content):
        self.content = content

    def save(self, path):
        Path(path).write_bytes(self.content)


class UploadTaskStoreTests(unittest.TestCase):
    def test_creates_isolated_task_and_deduplicates_names(self):
        with tempfile.TemporaryDirectory() as upload_root:
            metadata = create_upload_task(upload_root, [
                (FakeUpload(b"a,b\n1,2\n"), "data.csv"),
                (FakeUpload(b"a,b\n3,4\n"), "data.csv"),
            ])

            files = [
                Path(path)
                for path in get_upload_task_files(upload_root, metadata["upload_id"])
            ]

            self.assertEqual([path.name for path in files], ["data.csv", "data-2.csv"])
            self.assertTrue(all(path.parent.name == metadata["upload_id"] for path in files))

    def test_rejects_invalid_upload_id(self):
        with tempfile.TemporaryDirectory() as upload_root:
            with self.assertRaisesRegex(ValueError, "Invalid upload_id"):
                get_upload_task_files(upload_root, "../outside")


if __name__ == "__main__":
    unittest.main()
