import json
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import RequestFactory, SimpleTestCase

from .views import UploadMap


class UploadMapTests(SimpleTestCase):
    @patch("upload.views.process_map_file")
    def test_upload_returns_each_file_result(self, process_map_file):
        process_map_file.return_value = {
            "success": True,
            "data": {"name": "Ta046"},
        }
        upload = SimpleUploadedFile("Ta046.gbk", b"LOCUS       Ta046\n//\n")
        request = RequestFactory().post(
            "/upload/",
            {"type": "plasmid", "save_feature": "true", "files": upload},
            HTTP_HOST="localhost",
        )

        response = UploadMap(request)
        body = json.loads(response.content)

        self.assertEqual(response.status_code, 200, body)
        self.assertTrue(body["success"])
        self.assertEqual(body["total"], 1)
        self.assertEqual(body["results"][0]["data"]["name"], "Ta046")
